import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityObservations, siteSettings } from '@/lib/schema';
import { sql, eq, asc } from 'drizzle-orm';

interface CalcResult {
  kwhPerDay: number;
  costPerDay: number;
  method: 'load' | 'balance' | 'meter' | 'topup_only';
  label: string;
}

export async function GET() {
  try {
    const settingsRows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'electricity_rate'));
    const rate = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 73.5;

    // ---- FETCH LATEST OF EACH OBSERVATION TYPE ----
    const latestMeter = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'meter_reading'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`).limit(1);

    const latestRemaining = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'units_remaining'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`).limit(1);

    const latestLoad = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'current_load'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`).limit(1);

    // ---- CALCULATE CONSUMPTION ----
    let calc: CalcResult = { kwhPerDay: 0, costPerDay: 0, method: 'topup_only', label: 'Estimate' };

    // Method 1: Current Load (instantaneous × 24h — most reliable short-term)
    if (latestLoad.length > 0 && latestLoad[0].value > 0) {
      const loadKw = latestLoad[0].value;
      calc = {
        kwhPerDay: Math.round(loadKw * 24 * 100) / 100,
        costPerDay: Math.round(loadKw * 24 * rate),
        method: 'load',
        label: `⚡ ${loadKw} kW load × 24h`,
      };
    }

    // Method 2: Balance method (total topups minus remaining, ÷ days)
    if (calc.method === 'topup_only') {
      const allTopups = await db.select().from(electricityObservations)
        .where(sql`${electricityObservations.type} = 'topup'`)
        .orderBy(asc(electricityObservations.recordedAt));

      if (allTopups.length > 0) {
        const totalTopupKwh = allTopups.reduce((s, t) => s + t.value, 0);
        const firstTopupTime = new Date(allTopups[0].recordedAt).getTime();
        const now = Date.now();
        const daysSinceFirst = Math.max(1, (now - firstTopupTime) / (1000 * 60 * 60 * 24));

        if (latestRemaining.length > 0) {
          // Consumed = what was added minus what's left
          const consumed = totalTopupKwh - latestRemaining[0].value;
          if (consumed > 0) {
            const kwhPerDay = Math.round((consumed / daysSinceFirst) * 100) / 100;
            calc = {
              kwhPerDay,
              costPerDay: Math.round(kwhPerDay * rate),
              method: 'balance',
              label: `💰 ${totalTopupKwh.toFixed(1)} added − ${latestRemaining[0].value.toFixed(1)} left ÷ ${Math.round(daysSinceFirst)} days`,
            };
          }
        }

        // Fallback: just top-up average (no remaining data)
        if (calc.method === 'topup_only') {
          const kwhPerDay = Math.round((totalTopupKwh / daysSinceFirst) * 100) / 100;
          calc = {
            kwhPerDay,
            costPerDay: Math.round(kwhPerDay * rate),
            method: 'topup_only',
            label: `💰 ~avg from ${allTopups.length} top-up(s)`,
          };
        }
      }
    }

    // Method 3: Meter readings (reliable long-term, needs 2+ readings)
    if (calc.method === 'topup_only') {
      const meterReadings = await db.select().from(electricityObservations)
        .where(sql`${electricityObservations.type} = 'meter_reading'`)
        .orderBy(asc(electricityObservations.recordedAt));

      if (meterReadings.length >= 2) {
        const latest = meterReadings[meterReadings.length - 1];
        const previous = meterReadings[meterReadings.length - 2];
        const unitsUsed = latest.value - previous.value;
        const timeDiffDays = (new Date(latest.recordedAt).getTime() - new Date(previous.recordedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (timeDiffDays > 0 && unitsUsed >= 0) {
          const kwhPerDay = Math.round((unitsUsed / timeDiffDays) * 100) / 100;
          calc = {
            kwhPerDay,
            costPerDay: Math.round(kwhPerDay * rate),
            method: 'meter',
            label: `🔢 ${unitsUsed.toFixed(1)} kWh ÷ ${Math.round(timeDiffDays)} days`,
          };
        }
      }
    }

    // ---- ESTIMATED DAYS LEFT ----
    let estimatedDaysLeft: number | null = null;
    if (latestRemaining.length > 0 && calc.kwhPerDay > 0) {
      estimatedDaysLeft = Math.round((latestRemaining[0].value / calc.kwhPerDay) * 10) / 10;
    }

    // ---- RECENT TOP-UPS ----
    const recentTopups = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'topup' AND ${electricityObservations.recordedAt} >= NOW() - INTERVAL '30 days'`);
    const totalTopupKwhRecent = recentTopups.reduce((s, t) => s + t.value, 0);

    return NextResponse.json({
      rate,
      currentMeterReading: latestMeter.length > 0 ? latestMeter[0].value : null,
      currentMeterTime: latestMeter.length > 0 ? latestMeter[0].recordedAt : null,
      currentRemaining: latestRemaining.length > 0 ? latestRemaining[0].value : 0,
      remainingTime: latestRemaining.length > 0 ? latestRemaining[0].recordedAt : null,
      currentLoad: latestLoad.length > 0 ? latestLoad[0].value : null,
      currentLoadTime: latestLoad.length > 0 ? latestLoad[0].recordedAt : null,
      consumption: calc,
      estimatedDaysLeft,
      recentTopups: {
        count: recentTopups.length,
        totalKwh: Math.round(totalTopupKwhRecent * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json({
      rate: 73.5,
      currentMeterReading: null,
      currentMeterTime: null,
      currentRemaining: 0,
      remainingTime: null,
      currentLoad: null,
      currentLoadTime: null,
      consumption: { kwhPerDay: 0, costPerDay: 0, method: 'topup_only', label: 'No data yet' },
      estimatedDaysLeft: null,
      recentTopups: { count: 0, totalKwh: 0 },
    });
  }
}
