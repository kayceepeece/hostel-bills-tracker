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

    // Get all electricity observations for consumption calculation
    const allObs = await db.select().from(electricityObservations).orderBy(sql`${electricityObservations.recordedAt} ASC`);

    const getType = (type: string) => allObs.filter(o => o.type === type);
    const topups = getType('topup');
    const loads = getType('current_load');
    const readings = getType('meter_reading');
    const remainings = getType('units_remaining');

    const currentRemaining = remainings.length > 0 ? remainings[remainings.length - 1].value : 0;
    const currentLoadValue = loads.length > 0 ? loads[loads.length - 1].value : null;
    const now = Date.now();
    let consumptionRate = 0;
    let estimatedDaysLeft: number | null = null;

    // Average Load × 24 (best short-term method)
    if (loads.length > 0) {
      const avgLoad = loads.reduce((s, o) => s + o.value, 0) / loads.length;
      consumptionRate = Math.round(avgLoad * 24 * 100) / 100;
    }

    // Balance method (if load data is insufficient)
    if (consumptionRate === 0 && topups.length > 0 && currentRemaining > 0) {
      const totalTopup = topups.reduce((s, t) => s + t.value, 0);
      const daysSinceFirst = Math.max(0.5, (now - new Date(topups[0].recordedAt).getTime()) / 86400000);
      const consumed = totalTopup - currentRemaining;
      if (consumed > 0) consumptionRate = Math.round((consumed / daysSinceFirst) * 100) / 100;
    }

    // Meter reading difference (if enough time between readings)
    if (readings.length >= 2) {
      const first = readings[0];
      const last = readings[readings.length - 1];
      const diff = last.value - first.value;
      const hoursBetween = (new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()) / 3600000;
      const daysBetween = Math.max(0.1, hoursBetween / 24); // at least 0.1 day = 2.4h minimum
      if (diff >= 0 && hoursBetween > 0) {
        consumptionRate = Math.round((diff / daysBetween) * 100) / 100;
      }
    }

    if (currentRemaining > 0 && consumptionRate > 0) {
      estimatedDaysLeft = Math.round((currentRemaining / consumptionRate) * 10) / 10;
    }

    // Calculate summaries
    const lightBillCollected = lightBill.reduce((sum, p) => sum + p.amount, 0);
    const lightBillExpected = allMembers.reduce((sum, m) => sum + (m.lightBillAmount || defaultLightAmount), 0);
    const sweepingPayers = sweeping.filter(p => p.amount && p.amount > 0);
    const allPayers = allMembers.filter(m => m.sweepingRole === 'pay');
    const sweepers = allMembers.filter(m => m.sweepingRole === 'sweep');
    const sweepingCollected = sweepingPayers.reduce((sum, p) => sum + (p.amount || 0), 0);
    const sweepingShare = sweepers.length > 0 ? Math.round(sweepingCollected / sweepers.length) : 0;
    const sweepingExpected = allPayers.length * 1500;
    const sweepingPercentPaid = sweepingExpected > 0 ? Math.round((sweepingCollected / sweepingExpected) * 100) : 0;
    
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
          expected: sweepingExpected,
          percentPaid: sweepingPercentPaid,
          payers: sweepingPayers.length,
          expectedPayers: allPayers.length,
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
          recentTopups: topups.length,
          totalTopupUnits: Math.round(topups.reduce((sum, t) => sum + t.value, 0) * 100) / 100,
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
