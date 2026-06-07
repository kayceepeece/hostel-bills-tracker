import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lightBillPayments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  try {
    let query = db.select().from(lightBillPayments);
    if (period) {
      query = query.where(eq(lightBillPayments.period, period));
    }
    const payments = await query;
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch light bill payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPayment = await db.insert(lightBillPayments).values(body).returning();
    return NextResponse.json(newPayment[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
