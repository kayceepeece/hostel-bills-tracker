import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityObservations, siteSettings } from '@/lib/schema';
import { sql, eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const settingsRows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'electricity_rate'));
    const rate = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 73.5;

    // Latest meter reading (cumulative kWh)
    const latestMeter = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'meter_reading'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`)
      .limit(1);

    // Latest units remaining
    const latestRemaining = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'units_remaining'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`)
      .limit(1);

    // Latest current load
    const latestLoad = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'current_load'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`)
      .limit(1);

    // Recent top-ups (30 days)
    const recentTopups = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'topup' AND ${electricityObservations.recordedAt} >= NOW() - INTERVAL '30 days'`);

    // Consumption rate: use meter readings to calculate kWh/day
    const meterReadingsOverTime = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'meter_reading'`)
      .orderBy(asc(electricityObservations.recordedAt));

    let consumptionRateKwhPerDay = 0;
    let estimatedDaysLeft: number | null = null;
    let currentRemaining = 0;

    if (meterReadingsOverTime.length >= 2) {
      const latest = meterReadingsOverTime[meterReadingsOverTime.length - 1];
      const previous = meterReadingsOverTime[meterReadingsOverTime.length - 2];
      const unitsUsed = latest.value - previous.value;
      const timeDiffMs = new Date(latest.recordedAt).getTime() - new Date(previous.recordedAt).getTime();
      const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
      if (timeDiffDays > 0 && unitsUsed >= 0) {
        consumptionRateKwhPerDay = Math.round((unitsUsed / timeDiffDays) * 100) / 100;
      }
    }

    if (latestRemaining.length > 0) {
      currentRemaining = latestRemaining[0].value;
      if (consumptionRateKwhPerDay > 0) {
        estimatedDaysLeft = Math.round((currentRemaining / consumptionRateKwhPerDay) * 10) / 10;
      }
    }

    const latestLoadValue = latestLoad.length > 0 ? latestLoad[0].value : null;
    const latestLoadTime = latestLoad.length > 0 ? latestLoad[0].recordedAt : null;

    const totalTopupKwh = recentTopups.reduce((sum, t) => sum + t.value, 0);
    const costPerDay = consumptionRateKwhPerDay > 0 ? Math.round(consumptionRateKwhPerDay * rate) : 0;

    return NextResponse.json({
      rate,
      currentMeterReading: latestMeter.length > 0 ? latestMeter[0].value : null,
      currentMeterTime: latestMeter.length > 0 ? latestMeter[0].recordedAt : null,
      currentRemaining,
      remainingTime: latestRemaining.length > 0 ? latestRemaining[0].recordedAt : null,
      currentLoad: latestLoadValue,
      currentLoadTime: latestLoadTime,
      consumptionRateKwhPerDay,
      estimatedDaysLeft,
      costPerDay,
      recentTopups: {
        count: recentTopups.length,
        totalKwh: Math.round(totalTopupKwh * 100) / 100,
      },
    });
  } catch (error) {
    return NextResponse.json({
      rate: 73.5,
      currentMeterReading: null,
      currentMeterTime: null,
      currentRemaining: 0,
      remainingTime: null,
      currentLoad: null,
      currentLoadTime: null,
      consumptionRateKwhPerDay: 0,
      estimatedDaysLeft: null,
      costPerDay: 0,
      recentTopups: { count: 0, totalKwh: 0 },
    });
  }
}
