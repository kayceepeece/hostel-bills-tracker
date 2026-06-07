import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Migrating electricity_readings to observations...');

  // Migrate meter_reading observations
  await db.execute(sql.raw(`
    INSERT INTO electricity_observations (type, value, recorded_at, notes, created_at)
    SELECT 
      'meter_reading',
      meter_reading,
      COALESCE(reading_time, created_at),
      CASE WHEN notes IS NOT NULL THEN 'meter: ' || notes ELSE NULL END,
      created_at
    FROM electricity_readings
    WHERE meter_reading IS NOT NULL
  `));
  console.log('  meter_reading observations created');

  // Migrate units_remaining observations
  await db.execute(sql.raw(`
    INSERT INTO electricity_observations (type, value, recorded_at, notes, created_at)
    SELECT 
      'units_remaining',
      units_remaining,
      COALESCE(remaining_time, created_at),
      CASE WHEN notes IS NOT NULL THEN 'remaining: ' || notes ELSE NULL END,
      created_at
    FROM electricity_readings
    WHERE units_remaining IS NOT NULL
  `));
  console.log('  units_remaining observations created');

  // Migrate topups - store kWh value, put ₦ info in notes
  await db.execute(sql.raw(`
    INSERT INTO electricity_observations (type, value, recorded_at, notes, created_at)
    SELECT 
      'topup',
      units_kwh,
      COALESCE(recorded_at, created_at),
      '₦' || amount_naira || ' top-up at ₦' || rate_used || '/kWh' || CASE WHEN notes IS NOT NULL THEN ' — ' || notes ELSE '' END,
      created_at
    FROM electricity_topups
  `));
  console.log('  topup observations created');

  const count = await db.execute(sql.raw(`SELECT count(*)::text as cnt FROM electricity_observations`));
  console.log(`\nTotal observations now: ${count.rows?.[0]?.cnt || 0}`);
  console.log('Migration complete!');
}
main().catch(console.error);
