import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { electricityUsage } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(electricityUsage).where(eq(electricityUsage.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete reading' }, { status: 500 });
  }
}
