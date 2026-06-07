import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityReadings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.meter_reading !== undefined) {
      updates.meterReading = body.meter_reading;
    }
    if (body.reading_time !== undefined) {
      updates.readingTime = new Date(body.reading_time);
    }
    if (body.units_remaining !== undefined) {
      updates.unitsRemaining = body.units_remaining;
    }
    if (body.remaining_time !== undefined) {
      updates.remainingTime = new Date(body.remaining_time);
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }
    await db.update(electricityReadings).set(updates).where(eq(electricityReadings.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reading' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(electricityReadings).where(eq(electricityReadings.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete reading' }, { status: 500 });
  }
}
