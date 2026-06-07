import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, lightBillPayments, sweepingPayments, environmentalPayments, electricityReadings, electricityTopups, siteSettings } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  try {
    // Get settings
    const settingsRows = await db.select().from(siteSettings);
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const showExpected = settings.light_bill_show_expected === 'true';
    const expectedAmount = parseInt(settings.light_bill_expected_amount || '0', 10);
    const electricityRate = parseFloat(settings.electricity_rate || '73.5');

    // Get all members
    const allMembers = await db.select().from(members);

    // Get light bill payments for period
    const lightBill = await db.select().from(lightBillPayments).where(eq(lightBillPayments.period, period));

    // Get sweeping payments for period
    const sweeping = await db.select().from(sweepingPayments).where(eq(sweepingPayments.period, period));

    // Get environmental payments for period
    const environmental = await db.select().from(environmentalPayments).where(eq(environmentalPayments.period, period));

    // Get latest electricity reading for dashboard
    const latestReading = await db.select().from(electricityReadings)
      .where(sql`${electricityReadings.unitsRemaining} IS NOT NULL`)
      .orderBy(sql`${electricityReadings.remainingTime} DESC`)
      .limit(1);

    // Get recent top-ups
    const recentTopups = await db.select().from(electricityTopups)
      .where(sql`${electricityTopups.recordedAt} >= NOW() - INTERVAL '30 days'`);

    // Get paired readings for consumption calculation
    const pairedReadings = await db.select().from(electricityReadings)
      .where(sql`${electricityReadings.meterReading} IS NOT NULL AND ${electricityReadings.unitsRemaining} IS NOT NULL`)
      .orderBy(sql`${electricityReadings.readingTime} ASC`);

    // Calculate electricity summary
    let consumptionRate = 0;
    let estimatedDaysLeft: number | null = null;
    if (pairedReadings.length >= 2) {
      const latest = pairedReadings[pairedReadings.length - 1];
      const previous = pairedReadings[pairedReadings.length - 2];
      const kwhUsed = (previous.unitsRemaining || 0) - (latest.unitsRemaining || 0);
      const timeDiffMs = new Date(latest.readingTime || latest.createdAt).getTime() - new Date(previous.readingTime || previous.createdAt).getTime();
      const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
      if (timeDiffDays > 0 && kwhUsed > 0) {
        consumptionRate = Math.round((kwhUsed / timeDiffDays) * 100) / 100;
        const currentRemaining = latestReading.length > 0 ? latestReading[0].unitsRemaining : 0;
        if (currentRemaining && consumptionRate > 0) {
          estimatedDaysLeft = Math.round((currentRemaining / consumptionRate) * 10) / 10;
        }
      }
    }

    const currentRemaining = latestReading.length > 0 ? latestReading[0].unitsRemaining : 0;

    // Calculate summaries
    const lightBillCollected = lightBill.reduce((sum, p) => sum + p.amount, 0);
    
    const sweepingPayers = sweeping.filter(p => p.amount && p.amount > 0);
    const sweepers = allMembers.filter(m => m.sweepingRole === 'sweep');
    const sweepingCollected = sweepingPayers.reduce((sum, p) => sum + (p.amount || 0), 0);
    const sweepingShare = sweepers.length > 0 ? Math.round(sweepingCollected / sweepers.length) : 0;
    
    const environmentalCollected = environmental.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      period,
      settings: {
        lightBillShowExpected: showExpected,
        lightBillExpectedAmount: expectedAmount,
      },
      summary: {
        lightBill: {
          collected: lightBillCollected,
          expected: showExpected ? expectedAmount : 0,
          percentPaid: showExpected && expectedAmount > 0 ? Math.round((lightBillCollected / expectedAmount) * 100) : 0,
        },
        sweeping: {
          collected: sweepingCollected,
          payers: sweepingPayers.length,
          sweepers: sweepers.length,
          share: sweepingShare,
        },
        environmental: {
          collected: environmentalCollected,
          paid: environmental.length,
          total: allMembers.length,
        },
        electricity: {
          currentRemaining: currentRemaining || 0,
          consumptionRate,
          estimatedDaysLeft,
          costPerDay: Math.round(consumptionRate * electricityRate),
          recentTopups: recentTopups.length,
          totalTopupUnits: Math.round(recentTopups.reduce((sum, t) => sum + t.unitsKwh, 0) * 100) / 100,
        },
      },
      recentPayments: [
        ...lightBill.map(p => ({ ...p, type: 'light' })),
        ...sweeping.map(p => ({ ...p, type: 'sweeping' })),
        ...environmental.map(p => ({ ...p, type: 'environmental' })),
      ].sort((a, b) => {
        const dateA = a.datePaid ? new Date(a.datePaid).getTime() : 0;
        const dateB = b.datePaid ? new Date(b.datePaid).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 10),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
