import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityTopups, siteSettings } from '@/lib/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    const topups = await db.select().from(electricityTopups)
      .where(
        month && year
          ? sql`EXTRACT(MONTH FROM ${electricityTopups.recordedAt}) = ${month} AND EXTRACT(YEAR FROM ${electricityTopups.recordedAt}) = ${year}`
          : sql`1=1`
      )
      .orderBy(sql`${electricityTopups.recordedAt} DESC`);
    return NextResponse.json(topups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch top-ups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get electricity rate from settings
    const settingsRows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'electricity_rate'));
    const rate = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 73.5;

    const amountNaira = body.amount_naira;
    const unitsKwh = Math.round((amountNaira / rate) * 100) / 100;

    const newTopup = await db.insert(electricityTopups).values({
      amountNaira,
      unitsKwh,
      rateUsed: rate,
      recordedAt: body.recorded_at ? new Date(body.recorded_at) : new Date(),
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(newTopup[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create top-up' }, { status: 500 });
  }
}
