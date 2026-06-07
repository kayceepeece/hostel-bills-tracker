import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Default settings
const DEFAULTS: Record<string, string> = {
  light_bill_show_expected: 'false',
  light_bill_expected_amount: '0',
  electricity_rate: '73.5',
};

// GET - read all settings
export async function GET() {
  try {
    const rows = await db.select().from(siteSettings);
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(DEFAULTS);
  }
}

// PUT - upsert settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
      if (existing.length > 0) {
        await db.update(siteSettings)
          .set({ value: String(value), updatedAt: new Date() })
          .where(eq(siteSettings.key, key));
      } else {
        await db.insert(siteSettings).values({ key, value: String(value) });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
