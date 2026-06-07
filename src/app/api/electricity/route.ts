import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityUsage } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    const readings = (month && year)
      ? await db.select().from(electricityUsage)
          .where(sql`EXTRACT(MONTH FROM date) = ${month} AND EXTRACT(YEAR FROM date) = ${year}`)
      : await db.select().from(electricityUsage);
    return NextResponse.json(readings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch electricity usage' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReading = await db.insert(electricityUsage).values(body).returning();
    return NextResponse.json(newReading[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reading' }, { status: 500 });
  }
}
