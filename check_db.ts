import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const tableNames = (tables.rows || []).map((r: any) => r.table_name);
  console.log('Tables:', tableNames.join(', '));

  for (const tbl of ['electricity_readings', 'electricity_topups']) {
    if (tableNames.includes(tbl)) {
      const r = await db.execute(sql.raw(`SELECT count(*)::text as cnt FROM "${tbl}"`));
      const cnt = r.rows?.[0]?.cnt || '0';
      console.log(`${tbl}: ${cnt} rows`);
    } else {
      console.log(`${tbl}: DOES NOT EXIST`);
    }
  }

  if (tableNames.includes('electricity_observations')) {
    const r = await db.execute(sql.raw(`SELECT count(*)::text as cnt FROM electricity_observations`));
    console.log(`electricity_observations: ${r.rows?.[0]?.cnt || 0} rows`);
  }
}
main().catch(console.error);
