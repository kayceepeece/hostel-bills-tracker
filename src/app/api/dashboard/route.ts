import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, lightBillPayments, sweepingPayments, environmentalPayments, electricityUsage, siteSettings } from '@/lib/schema';
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

    // Get all members
    const allMembers = await db.select().from(members);

    // Get light bill payments for period
    const lightBill = await db.select().from(lightBillPayments).where(eq(lightBillPayments.period, period));

    // Get sweeping payments for period
    const sweeping = await db.select().from(sweepingPayments).where(eq(sweepingPayments.period, period));

    // Get environmental payments for period
    const environmental = await db.select().from(environmentalPayments).where(eq(environmentalPayments.period, period));

    // Get electricity usage for the month
    const monthNum = new Date(period + ' 1').getMonth() + 1;
    const yearNum = new Date(period + ' 1').getFullYear();
    const electricity = await db.select().from(electricityUsage)
      .where(sql`EXTRACT(MONTH FROM date) = ${monthNum} AND EXTRACT(YEAR FROM date) = ${yearNum}`);

    // Calculate summaries
    const lightBillCollected = lightBill.reduce((sum, p) => sum + p.amount, 0);
    
    const sweepingPayers = sweeping.filter(p => p.amount && p.amount > 0);
    const sweepers = allMembers.filter(m => m.sweepingRole === 'sweep');
    const sweepingCollected = sweepingPayers.reduce((sum, p) => sum + (p.amount || 0), 0);
    const sweepingShare = sweepers.length > 0 ? Math.round(sweepingCollected / sweepers.length) : 0;
    
    const environmentalCollected = environmental.reduce((sum, p) => sum + p.amount, 0);
    
    const electricityUnitsUsed = electricity.reduce((sum, e) => sum + e.unitsUsed, 0);
    const electricityCost = electricity.reduce((sum, e) => sum + e.bought, 0);

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
          unitsUsed: electricityUnitsUsed,
          cost: electricityCost,
          avgDaily: electricity.length > 0 ? Math.round(electricityUnitsUsed / electricity.length) : 0,
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
