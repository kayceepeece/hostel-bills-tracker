import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityObservations, siteSettings } from '@/lib/schema';
import { sql, eq, asc } from 'drizzle-orm';

/** Each method returns its own estimate + a confidence indicator */
interface MethodResult {
  kwhPerDay: number;
  costPerDay: number;
  method: 'load_avg' | 'load_latest' | 'balance' | 'meter';
  label: string;
  confidence: 'high' | 'medium' | 'low' | 'insufficient_data';
  reason: string;
}

export async function GET() {
  try {
    const settingsRows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'electricity_rate'));
    const rate = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 73.5;

    // ---- FETCH ALL DATA AT ONCE ----
    const allObs = await db.select()
      .from(electricityObservations)
      .orderBy(asc(electricityObservations.recordedAt));

    const getType = (type: string) => allObs.filter(o => o.type === type);

    const topups = getType('topup');
    const loads = getType('current_load');
    const readings = getType('meter_reading');
    const remainings = getType('units_remaining');

    // Latest of each
    const latestLoad = loads.length > 0 ? loads[loads.length - 1] : null;
    const latestRemaining = remainings.length > 0 ? remainings[remainings.length - 1] : null;
    const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

    const now = Date.now();

    // ---- CALCULATE ALL METHODS ----
    const methods: MethodResult[] = [];

    // ── Method A: Average Load × 24 ──
    if (loads.length > 0) {
      const avgLoad = loads.reduce((s, o) => s + o.value, 0) / loads.length;
      const spanMs = now - new Date(loads[0].recordedAt).getTime();
      const spanHours = spanMs / 3600000;
      const kwhPerDay = Math.round(avgLoad * 24 * 100) / 100;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      let reason = '';
      if (spanHours >= 20 && loads.length >= 10) {
        confidence = 'high';
        reason = `Average of ${loads.length} readings across ${spanHours.toFixed(0)}h`;
      } else if (spanHours >= 4 && loads.length >= 4) {
        confidence = 'medium';
        reason = `Average of ${loads.length} readings across ${spanHours.toFixed(0)}h (more hours needed)`;
      } else {
        confidence = 'low';
        reason = `Only ${loads.length} readings in ${spanHours.toFixed(1)}h — needs readings across a full day`;
      }

      methods.push({
        kwhPerDay,
        costPerDay: Math.round(kwhPerDay * rate),
        method: 'load_avg',
        label: `Avg ${avgLoad.toFixed(2)} kW × 24h`,
        confidence,
        reason,
      });
    }

    // ── Method B: Latest Load × 24 (current snapshot) ──
    if (latestLoad && latestLoad.value > 0) {
      const kwhPerDay = Math.round(latestLoad.value * 24 * 100) / 100;
      methods.push({
        kwhPerDay,
        costPerDay: Math.round(kwhPerDay * rate),
        method: 'load_latest',
        label: `Latest ${latestLoad.value} kW × 24h`,
        confidence: 'low',
        reason: 'Snapshot — assumes constant load. Unreliable if load varies.',
      });
    }

    // ── Method C: Balance Method ──
    // (Total kWh ever topped up) − (latest remaining) = total consumed
    // Divide by days since first meaningful data point
    const totalTopupKwh = topups.reduce((s, o) => s + o.value, 0);
    if (topups.length > 0 && latestRemaining && totalTopupKwh > latestRemaining.value) {
      const firstData = topups[0];
      const daysSinceFirst = Math.max(1, (now - new Date(firstData.recordedAt).getTime()) / 86400000);
      const consumed = totalTopupKwh - latestRemaining.value;
      const kwhPerDay = Math.round((consumed / daysSinceFirst) * 100) / 100;

      // Check how recent the last top-up is — balance is unreliable if it just happened
      const hoursSinceLastTopup = (now - new Date(topups[topups.length - 1].recordedAt).getTime()) / 3600000;
      const daysSinceLastRemaining = (now - new Date(latestRemaining.recordedAt).getTime()) / 86400000;

      let confidence: 'high' | 'medium' | 'low' = 'medium';
      let reason = '';
      if (daysSinceFirst >= 7 && hoursSinceLastTopup >= 24) {
        confidence = 'high';
        reason = `Tracked over ${daysSinceFirst.toFixed(0)} days — reliable`;
      } else if (daysSinceFirst >= 2 && hoursSinceLastTopup >= 6) {
        confidence = 'medium';
        reason = `${daysSinceFirst.toFixed(0)} days of data, ${hoursSinceLastTopup.toFixed(0)}h since last top-up`;
      } else {
        confidence = 'low';
        reason = `Only ${daysSinceFirst.toFixed(1)} days — last top-up was ${hoursSinceLastTopup.toFixed(0)}h ago, need more settling time`;
      }

      methods.push({
        kwhPerDay,
        costPerDay: Math.round(kwhPerDay * rate),
        method: 'balance',
        label: `${totalTopupKwh.toFixed(1)} added − ${latestRemaining.value.toFixed(1)} left ÷ ${daysSinceFirst.toFixed(1)}d`,
        confidence,
        reason,
      });
    }

    // ── Method D: Meter Reading Difference ──
    if (readings.length >= 2) {
      const first = readings[0];
      const last = readings[readings.length - 1];
      const diff = last.value - first.value;
      const days = Math.max(1, (new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()) / 86400000);
      const kwhPerDay = Math.round((diff / days) * 100) / 100;

      methods.push({
        kwhPerDay,
        costPerDay: Math.round(kwhPerDay * rate),
        method: 'meter',
        label: `${diff.toFixed(1)} kWh ÷ ${days.toFixed(0)} days`,
        confidence: 'high',
        reason: `Direct meter reading difference — most accurate`,
      });
    }

    // ---- DERIVED VALUES ----
    // Pick the best method as primary
    const confidenceRank = { high: 3, medium: 2, low: 1, insufficient_data: 0 };
    const methodRank = { meter: 4, balance: 3, load_avg: 2, load_latest: 1 };
    const primary = methods.length > 0
      ? methods.sort((a, b) => {
          const scoreA = (confidenceRank[a.confidence] || 0) * 10 + (methodRank[a.method] || 0);
          const scoreB = (confidenceRank[b.confidence] || 0) * 10 + (methodRank[b.method] || 0);
          return scoreB - scoreA;
        })[0]
      : null;

    // Estimated days left from remaining
    let estimatedDaysLeft: number | null = null;
    if (latestRemaining && primary && primary.kwhPerDay > 0) {
      estimatedDaysLeft = Math.round((latestRemaining.value / primary.kwhPerDay) * 10) / 10;
    }

    // Recent top-ups
    const recentTopups = topups.filter(o => new Date(o.recordedAt).getTime() >= now - 30 * 86400000);

    return NextResponse.json({
      rate,
      readings: {
        meter: latestReading ? { value: latestReading.value, time: latestReading.recordedAt } : null,
        remaining: latestRemaining ? { value: latestRemaining.value, time: latestRemaining.recordedAt } : null,
        load: latestLoad ? { value: latestLoad.value, time: latestLoad.recordedAt } : null,
      },
      methods,
      primary,
      estimatedDaysLeft,
      dataAge: {
        firstTopup: topups.length > 0 ? topups[0].recordedAt : null,
        trackDays: topups.length > 0 ? Math.round((now - new Date(topups[0].recordedAt).getTime()) / 86400000 * 10) / 10 : 0,
        loadSpan: loads.length > 0 ? Math.round((now - new Date(loads[0].recordedAt).getTime()) / 3600000 * 10) / 10 : 0,
      },
      recentTopups: {
        count: recentTopups.length,
        totalKwh: Math.round(recentTopups.reduce((s, o) => s + o.value, 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json({
      rate: 73.5,
      readings: { meter: null, remaining: null, load: null },
      methods: [],
      primary: null,
      estimatedDaysLeft: null,
      dataAge: { firstTopup: null, trackDays: 0, loadSpan: 0 },
      recentTopups: { count: 0, totalKwh: 0 },
    });
  }
}
