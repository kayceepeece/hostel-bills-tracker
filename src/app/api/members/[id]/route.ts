import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await db.update(members).set({
      name: body.name,
      room: body.room,
      type: body.type,
      sweepingRole: body.sweepingRole || null,
      lightBillAmount: body.lightBillAmount !== undefined ? body.lightBillAmount : null,
      phone: body.phone || null,
      altContact: body.altContact || null,
      notes: body.notes || null,
    }).where(eq(members.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(members).where(eq(members.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
