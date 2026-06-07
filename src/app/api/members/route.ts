import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/lib/schema';

export async function GET() {
  try {
    const allMembers = await db.select().from(members);
    return NextResponse.json(allMembers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMember = await db.insert(members).values(body).returning();
    return NextResponse.json(newMember[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
