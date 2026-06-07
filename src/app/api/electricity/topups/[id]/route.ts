import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityTopups } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.amount_naira !== undefined) {
      updates.amountNaira = body.amount_naira;
    }
    if (body.units_kwh !== undefined) {
      updates.unitsKwh = body.units_kwh;
    }
    if (body.rate_used !== undefined) {
      updates.rateUsed = body.rate_used;
    }
    if (body.recorded_at !== undefined) {
      updates.recordedAt = new Date(body.recorded_at);
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }
    await db.update(electricityTopups).set(updates).where(eq(electricityTopups.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update top-up' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(electricityTopups).where(eq(electricityTopups.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete top-up' }, { status: 500 });
  }
}
