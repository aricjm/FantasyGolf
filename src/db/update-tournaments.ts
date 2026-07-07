import 'dotenv/config';
import { db } from './index';
import { tournaments } from './schema';
import { inArray } from 'drizzle-orm';

const oldIds = [
  'farmers-2027',
  'cadillac-2027',
  'valspar-2027',
  'john-deere-2027',
  'rocket-classic-2027'
];

const newTournaments = [
  { id: 'cj-cup-2027', name: 'The CJ CUP Byron Nelson', type: 'regular', startDate: new Date('2027-05-20T08:00:00Z'), status: 'pending' },
  { id: 'houston-open-2027', name: 'Texas Childrens Houston Open', type: 'regular', startDate: new Date('2027-03-25T08:00:00Z'), status: 'pending' },
  { id: 'schwab-2027', name: 'Charles Schwab Challenge', type: 'regular', startDate: new Date('2027-05-27T08:00:00Z'), status: 'pending' },
  { id: 'rbc-canadian-2027', name: 'RBC Canadian Championship', type: 'regular', startDate: new Date('2027-06-10T08:00:00Z'), status: 'pending' },
  { id: 'hero-world-2027', name: 'Hero World Challenge', type: 'regular', startDate: new Date('2027-11-25T08:00:00Z'), status: 'pending' }
];

async function updateTournaments() {
  console.log('Deleting 5 old regular tournaments...');
  
  // Drizzle cascades deletions based on schema
  const deleted = await db.delete(tournaments).where(inArray(tournaments.id, oldIds)).returning({ id: tournaments.id, name: tournaments.name });
  console.log('Deleted:', deleted.map(t => t.name));

  console.log('Inserting 5 new regular tournaments...');
  const inserted = await db.insert(tournaments).values(newTournaments).returning({ id: tournaments.id, name: tournaments.name });
  console.log('Inserted:', inserted.map(t => t.name));

  console.log('Tournament swap complete!');
  process.exit(0);
}

updateTournaments().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
