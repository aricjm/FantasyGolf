import 'dotenv/config';
import { db } from './index';
import { golfers } from './schema';
import { eq, inArray } from 'drizzle-orm';

async function migrate() {
  console.log('Updating golfer types: ranks 21-25 → top20 (weekly short draft)...');

  // Reclassify ranks 21-25 from 'field' to 'top20' so they appear in weekly short drafts
  const result = await db
    .update(golfers)
    .set({ type: 'top20' })
    .where(inArray(golfers.id, [21, 22, 23, 24, 25]))
    .returning({ id: golfers.id, name: golfers.name, rank: golfers.rank, type: golfers.type });

  console.log(`Updated ${result.length} golfers:`);
  result.forEach(g => console.log(`  #${g.rank} ${g.name} → ${g.type}`));

  console.log('\nVerifying rank 26 stays as field (season draft)...');
  const rank26 = await db.select().from(golfers).where(eq(golfers.id, 26)).limit(1);
  console.log(`  #${rank26[0]?.rank} ${rank26[0]?.name} → ${rank26[0]?.type}`);

  console.log('\nDone. Season (long) draft now starts at rank #26.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
