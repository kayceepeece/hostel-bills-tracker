import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lightBillPayments, sweepingPayments, environmentalPayments, siteSettings } from '@/lib/schema';
import { eq, sql, and, asc } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Get all payments for this member across all categories
    const [light, sweeping, environmental] = await Promise.all([
      db.select().from(lightBillPayments).where(eq(lightBillPayments.memberId, id)).orderBy(asc(lightBillPayments.period)),
      db.select().from(sweepingPayments).where(eq(sweepingPayments.memberId, id)).orderBy(asc(sweepingPayments.period)),
      db.select().from(environmentalPayments).where(eq(environmentalPayments.memberId, id)).orderBy(asc(environmentalPayments.period)),
    ]);

    // Build a unified payment timeline
    const payments = [
      ...light.map(p => ({ ...p, category: 'light' as const, categoryLabel: 'Light Bill' })),
      ...sweeping.map(p => ({ ...p, category: 'sweeping' as const, categoryLabel: 'Sweeping' })),
      ...environmental.map(p => ({ ...p, category: 'environmental' as const, categoryLabel: 'Environmental' })),
    ].sort((a, b) => {
      // Sort by period descending, then date
      const periodA = a.period;
      const periodB = b.period;
      if (periodA !== periodB) return periodB.localeCompare(periodA);
      const dateA = a.datePaid || '';
      const dateB = b.datePaid || '';
      return dateB.localeCompare(dateA);
    });

    // Calculate payment streak (consecutive months with at least one payment)
    const allPeriods = new Set<string>();
    light.forEach(p => allPeriods.add(p.period));
    sweeping.forEach(p => { if (p.amount && p.amount > 0) allPeriods.add(p.period); });
    environmental.forEach(p => allPeriods.add(p.period));

    const sortedPeriods = Array.from(allPeriods).sort().reverse();

    // Calculate streak from most recent month backwards
    let streak = 0;
    const now = new Date();
    let checkDate = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 0; i < 60; i++) { // max 60 months back
      const periodStr = checkDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (sortedPeriods.includes(periodStr)) {
        streak++;
      } else {
        // Allow skipping current month (might not have paid yet)
        if (i === 0) {
          checkDate.setMonth(checkDate.getMonth() - 1);
          continue;
        }
        break;
      }
      checkDate.setMonth(checkDate.getMonth() - 1);
    }

    // Get settings for default light bill amount
    const settingsRows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'light_bill_default_amount'));
    const defaultAmount = settingsRows.length > 0 ? parseInt(settingsRows[0].value, 10) : 0;

    // Current month status
    const currentPeriod = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const hasLight = light.some(p => p.period === currentPeriod);
    const hasSweeping = sweeping.some(p => p.period === currentPeriod && p.amount && p.amount > 0);
    const hasEnvironmental = environmental.some(p => p.period === currentPeriod);

    return NextResponse.json({
      payments,
      streak,
      currentPeriod,
      currentStatus: {
        light: hasLight,
        sweeping: hasSweeping,
        environmental: hasEnvironmental,
      },
      totals: {
        light: light.reduce((sum, p) => sum + p.amount, 0),
        sweeping: sweeping.reduce((sum, p) => sum + (p.amount || 0), 0),
        environmental: environmental.reduce((sum, p) => sum + p.amount, 0),
      },
      defaultAmount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch member payments' }, { status: 500 });
  }
}
