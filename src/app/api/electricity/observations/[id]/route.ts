import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityObservations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.value !== undefined) updates.value = body.value;
    if (body.recorded_at !== undefined) updates.recordedAt = new Date(body.recorded_at);
    if (body.notes !== undefined) updates.notes = body.notes;
    await db.update(electricityObservations).set(updates).where(eq(electricityObservations.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update observation' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(electricityObservations).where(eq(electricityObservations.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete observation' }, { status: 500 });
  }
}
