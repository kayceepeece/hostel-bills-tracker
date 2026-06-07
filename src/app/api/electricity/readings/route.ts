import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityReadings } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    const readings = await db.select().from(electricityReadings)
      .where(
        month && year
          ? sql`EXTRACT(MONTH FROM ${electricityReadings.createdAt}) = ${month} AND EXTRACT(YEAR FROM ${electricityReadings.createdAt}) = ${year}`
          : sql`1=1`
      )
      .orderBy(sql`${electricityReadings.createdAt} DESC`);
    return NextResponse.json(readings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch readings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date();

    const newReading = await db.insert(electricityReadings).values({
      meterReading: body.meter_reading !== undefined ? body.meter_reading : null,
      readingTime: body.reading_time ? new Date(body.reading_time) : (body.meter_reading !== undefined ? now : null),
      unitsRemaining: body.units_remaining !== undefined ? body.units_remaining : null,
      remainingTime: body.remaining_time ? new Date(body.remaining_time) : (body.units_remaining !== undefined ? now : null),
      notes: body.notes || null,
    }).returning();

    return NextResponse.json(newReading[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reading' }, { status: 500 });
  }
}
