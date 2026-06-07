import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lightBillPayments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(lightBillPayments).where(eq(lightBillPayments.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
