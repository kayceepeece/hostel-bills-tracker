import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityObservations, siteSettings } from '@/lib/schema';
import { sql, eq, desc } from 'drizzle-orm';

const VALID_TYPES = ['meter_reading', 'units_remaining', 'current_load', 'topup'] as const;
type ObservationType = typeof VALID_TYPES[number];

const TYPE_LABELS: Record<ObservationType, string> = {
  meter_reading: 'Meter Reading (cumulative kWh)',
  units_remaining: 'Units Remaining (kWh)',
  current_load: 'Current Load (kW)',
  topup: 'Top-Up (₦ → kWh)',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    if (type && !VALID_TYPES.includes(type as ObservationType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const conditions = [];
    if (type) conditions.push(sql`${electricityObservations.type} = ${type}`);
    if (month && year) {
      conditions.push(sql`EXTRACT(MONTH FROM ${electricityObservations.recordedAt}) = ${month} AND EXTRACT(YEAR FROM ${electricityObservations.recordedAt}) = ${year}`);
    }

    const whereClause = conditions.length > 0 ? sql`${conditions.join(' AND ')}` : sql`1=1`;
    const observations = await db.select()
      .from(electricityObservations)
      .where(whereClause)
      .orderBy(sql`${electricityObservations.recordedAt} DESC`);

    return NextResponse.json(observations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch observations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const obsType = body.type as ObservationType;

    if (!VALID_TYPES.includes(obsType)) {
      return NextResponse.json({ error: 'Invalid type. Must be: meter_reading, units_remaining, current_load, or topup' }, { status: 400 });
    }

    let value = body.value;

    // For topups, auto-calculate kWh from ₦
    if (obsType === 'topup') {
      const settingsRows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'electricity_rate'));
      const rate = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 73.5;
      // Store both ₦ amount and kWh: encode as ₦_amount.kWh_value
      // Actually, let's just store the kWh and put ₦ in notes
      const amountNaira = body.value;
      const unitsKwh = Math.round((amountNaira / rate) * 100) / 100;
      value = unitsKwh;
      body.notes = `₦${amountNaira.toLocaleString()} top-up at ₦${rate}/kWh${body.notes ? ' — ' + body.notes : ''}`;
    }

    const newObs = await db.insert(electricityObservations).values({
      type: obsType,
      value,
      recordedAt: body.recorded_at ? new Date(body.recorded_at) : new Date(),
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(newObs[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create observation' }, { status: 500 });
  }
}
