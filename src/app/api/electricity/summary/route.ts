import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityReadings, electricityTopups, siteSettings } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get rate from settings
    const settingsRows = await db.select().from(siteSettings).where(sql`${siteSettings.key} = 'electricity_rate'`);
    const rate = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 73.5;

    // Get latest reading with units_remaining
    const latestReading = await db.select().from(electricityReadings)
      .where(sql`${electricityReadings.unitsRemaining} IS NOT NULL`)
      .orderBy(sql`${electricityReadings.remainingTime} DESC`)
      .limit(1);

    // Get all readings with both values for consumption calculation
    const allReadings = await db.select().from(electricityReadings)
      .where(sql`${electricityReadings.meterReading} IS NOT NULL AND ${electricityReadings.unitsRemaining} IS NOT NULL`)
      .orderBy(sql`${electricityReadings.readingTime} ASC`);

    // Get total top-ups in last 30 days
    const recentTopups = await db.select().from(electricityTopups)
      .where(sql`${electricityTopups.recordedAt} >= NOW() - INTERVAL '30 days'`);
    const totalTopupUnits = recentTopups.reduce((sum, t) => sum + t.unitsKwh, 0);
    const totalTopupNaira = recentTopups.reduce((sum, t) => sum + t.amountNaira, 0);

    // Calculate consumption rate (kWh per day) from recent paired readings
    let consumptionRateKwhPerDay = 0;
    if (allReadings.length >= 2) {
      const latest = allReadings[allReadings.length - 1];
      const previous = allReadings[allReadings.length - 2];
      const kwhUsed = (previous.unitsRemaining || 0) - (latest.unitsRemaining || 0);
      const timeDiffMs = new Date(latest.readingTime || latest.createdAt).getTime() - new Date(previous.readingTime || previous.createdAt).getTime();
      const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
      if (timeDiffDays > 0 && kwhUsed > 0) {
        consumptionRateKwhPerDay = Math.round((kwhUsed / timeDiffDays) * 100) / 100;
      }
    }

    // Current remaining units
    const currentRemaining = latestReading.length > 0 ? latestReading[0].unitsRemaining : 0;
    const lastReadingTime = latestReading.length > 0 ? latestReading[0].remainingTime : null;

    // Estimated days remaining
    const estimatedDaysLeft = consumptionRateKwhPerDay > 0 && currentRemaining
      ? Math.round((currentRemaining / consumptionRateKwhPerDay) * 10) / 10
      : null;

    // Cost per day
    const costPerDay = consumptionRateKwhPerDay > 0
      ? Math.round(consumptionRateKwhPerDay * rate)
      : 0;

    return NextResponse.json({
      rate,
      currentRemaining: currentRemaining || 0,
      lastReadingTime,
      consumptionRateKwhPerDay,
      estimatedDaysLeft,
      costPerDay,
      recentTopups: {
        count: recentTopups.length,
        totalUnits: Math.round(totalTopupUnits * 100) / 100,
        totalNaira: totalTopupNaira,
      },
      totalReadings: allReadings.length,
    });
  } catch (error) {
    return NextResponse.json({
      rate: 73.5,
      currentRemaining: 0,
      lastReadingTime: null,
      consumptionRateKwhPerDay: 0,
      estimatedDaysLeft: null,
      costPerDay: 0,
      recentTopups: { count: 0, totalUnits: 0, totalNaira: 0 },
      totalReadings: 0,
    });
  }
}
