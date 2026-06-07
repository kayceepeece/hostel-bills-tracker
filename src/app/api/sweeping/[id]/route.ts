import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sweepingPayments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(sweepingPayments).where(eq(sweepingPayments.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
