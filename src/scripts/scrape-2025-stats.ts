import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

import { parseEventScoreboard } from '../lib/espn';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Please set DATABASE_URL in your .env file to seed.');
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function scrape2025() {
  console.log('Fetching 2025 PGA schedule from ESPN...');
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=2025');
  const data = await res.json() as any;

  if (!data || !data.events) {
    console.error('No events found for 2025.');
    return;
  }

  console.log(`Found ${data.events.length} events for 2025.`);

  const statsMap: Record<string, { starts: number, cuts: number, totalPoints: number, historicalResults: Array<{ tournament: string, points: number, date: string }> }> = {};

  function normalizeString(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  for (const event of data.events) {
    const scoreboard = parseEventScoreboard(event);
    if (!scoreboard || !scoreboard.golfers || scoreboard.golfers.length === 0) continue;

    for (const g of scoreboard.golfers) {
      const normName = normalizeString(g.name);
      if (!statsMap[normName]) {
        statsMap[normName] = { starts: 0, cuts: 0, totalPoints: 0, historicalResults: [] };
      }
      
      statsMap[normName].starts += 1;
      if (g.madeCut) {
        statsMap[normName].cuts += 1;
      }
      statsMap[normName].totalPoints += g.totalPoints;
      statsMap[normName].historicalResults.push({
        tournament: scoreboard.name,
        points: g.totalPoints,
        date: event.date || ''
      });
    }
  }

  console.log('Finished processing all events. Updating database...');

  const allGolfers = await db.select().from(schema.golfers);
  let updatedCount = 0;

  for (const golfer of allGolfers) {
    const normName = normalizeString(golfer.name);
    const stats = statsMap[normName];

    if (stats && stats.starts > 0) {
      const avgPoints = stats.totalPoints / stats.starts;
      await db.update(schema.golfers).set({
        starts: stats.starts,
        cutsMade: stats.cuts,
        avgPoints: Number(avgPoints.toFixed(2)),
        historicalResults: stats.historicalResults
      }).where(eq(schema.golfers.id, golfer.id));
      updatedCount++;
    }
  }

  console.log(`Successfully updated stats for ${updatedCount} out of ${allGolfers.length} golfers.`);
  console.log('Done.');
  process.exit(0);
}

scrape2025().catch((err) => {
  console.error(err);
  process.exit(1);
});
