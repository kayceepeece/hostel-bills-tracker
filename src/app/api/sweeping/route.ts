import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sweepingPayments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  try {
    const payments = period
      ? await db.select().from(sweepingPayments).where(eq(sweepingPayments.period, period))
      : await db.select().from(sweepingPayments);
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sweeping payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPayment = await db.insert(sweepingPayments).values(body).returning();
    return NextResponse.json(newPayment[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
