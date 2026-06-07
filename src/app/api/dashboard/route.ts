import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, lightBillPayments, sweepingPayments, environmentalPayments, electricityObservations, siteSettings } from '@/lib/schema';
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
    const defaultLightAmount = parseInt(settings.light_bill_default_amount || '0', 10);
    const electricityRate = parseFloat(settings.electricity_rate || '73.5');

    // Get all members
    const allMembers = await db.select().from(members);

    // Get light bill payments for period
    const lightBill = await db.select().from(lightBillPayments).where(eq(lightBillPayments.period, period));

    // Get sweeping payments for period
    const sweeping = await db.select().from(sweepingPayments).where(eq(sweepingPayments.period, period));

    // Get environmental payments for period
    const environmental = await db.select().from(environmentalPayments).where(eq(environmentalPayments.period, period));

    // Get electricity observations for dashboard
    const latestRemaining = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'units_remaining'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`)
      .limit(1);

    const latestLoad = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'current_load'`)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`)
      .limit(1);

    const recentTopups = await db.select().from(electricityObservations)
      .where(sql`${electricityObservations.type} = 'topup' AND ${electricityObservations.recordedAt} >= NOW() - INTERVAL '30 days'`);

    // ---- CONSUMPTION: 3-method calculation ----
    const currentRemaining = latestRemaining.length > 0 ? latestRemaining[0].value : 0;
    const currentLoadValue = latestLoad.length > 0 ? latestLoad[0].value : null;
    let estimatedDaysLeft: number | null = null;
    let consumptionRate = 0;

    // Method 1: Current Load (instant × 24h)
    if (currentLoadValue && currentLoadValue > 0) {
      consumptionRate = Math.round(currentLoadValue * 24 * 100) / 100;
    }

    // Method 2: Balance (total topups minus remaining, ÷ days)
    if (consumptionRate === 0) {
      const allTopups = await db.select().from(electricityObservations)
        .where(sql`${electricityObservations.type} = 'topup'`)
        .orderBy(sql`${electricityObservations.recordedAt} ASC`);

      if (allTopups.length > 0) {
        const totalTopup = allTopups.reduce((s, t) => s + t.value, 0);
        const daysSinceFirst = Math.max(1, (Date.now() - new Date(allTopups[0].recordedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (currentRemaining > 0) {
          const consumed = totalTopup - currentRemaining;
          if (consumed > 0) consumptionRate = Math.round((consumed / daysSinceFirst) * 100) / 100;
        }
        if (consumptionRate === 0) {
          consumptionRate = Math.round((totalTopup / daysSinceFirst) * 100) / 100;
        }
      }
    }

    // Method 3: Meter readings (needs 2+ readings)
    if (consumptionRate === 0) {
      const meterReadings = await db.select().from(electricityObservations)
        .where(sql`${electricityObservations.type} = 'meter_reading'`)
        .orderBy(sql`${electricityObservations.recordedAt} ASC`);
      if (meterReadings.length >= 2) {
        const latest = meterReadings[meterReadings.length - 1];
        const previous = meterReadings[meterReadings.length - 2];
        const unitsUsed = latest.value - previous.value;
        const timeDiffDays = (new Date(latest.recordedAt).getTime() - new Date(previous.recordedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (timeDiffDays > 0 && unitsUsed >= 0) {
          consumptionRate = Math.round((unitsUsed / timeDiffDays) * 100) / 100;
        }
      }
    }

    if (currentRemaining > 0 && consumptionRate > 0) {
      estimatedDaysLeft = Math.round((currentRemaining / consumptionRate) * 10) / 10;
    }

    // Calculate summaries
    const lightBillCollected = lightBill.reduce((sum, p) => sum + p.amount, 0);
    const lightBillExpected = allMembers.reduce((sum, m) => sum + (m.lightBillAmount || defaultLightAmount), 0);
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
          currentLoad: currentLoadValue,
          consumptionRate,
          estimatedDaysLeft,
          costPerDay: Math.round(consumptionRate * electricityRate),
          recentTopups: recentTopups.length,
          totalTopupUnits: Math.round(recentTopups.reduce((sum, t) => sum + t.value, 0) * 100) / 100,
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
