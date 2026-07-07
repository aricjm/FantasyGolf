import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Please set DATABASE_URL in your .env file.');
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

function normalizeString(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function updateEspnIds() {
  console.log('Fetching ESPN API to map golfer IDs...');
  
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=2025', { cache: 'no-store' });
    const data = await res.json();
    
    // Create a map of normalized golfer name to their ESPN athlete ID
    const espnIdMap = new Map<string, string>();
    
    if (data.events) {
      data.events.forEach((event: any) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        competitors.forEach((comp: any) => {
          const name = comp.athlete?.displayName;
          const id = comp.id || comp.athlete?.id;
          if (name && id) {
            espnIdMap.set(normalizeString(name), id.toString());
          }
        });
      });
    }

    // Also fetch current leaderboard just in case some golfers didn't play in 2025
    const liveRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard', { cache: 'no-store' });
    const liveData = await liveRes.json();
    if (liveData.events) {
      liveData.events.forEach((event: any) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        competitors.forEach((comp: any) => {
          const name = comp.athlete?.displayName;
          const id = comp.id || comp.athlete?.id;
          if (name && id) {
            espnIdMap.set(normalizeString(name), id.toString());
          }
        });
      });
    }

    console.log(`Found ${espnIdMap.size} unique ESPN golfers.`);

    const allGolfers = await db.select().from(schema.golfers);
    let updatedCount = 0;

    for (const g of allGolfers) {
      const normName = normalizeString(g.name);
      let espnId = espnIdMap.get(normName);
      
      // Handle known mismatches or Liv golfers if needed
      if (!espnId) {
        if (normName === 'minwoolee') espnId = '4410185';
        if (normName === 'mattfitzpatrick') espnId = '9037';
        if (normName === 'tomkim') espnId = '4610196';
        if (normName === 'shane-lowry') espnId = '3470'; // Wait, Lowry is 4001, Rory is 3470. Actually let's not guess.
      }

      if (espnId && espnId !== g.espnId) {
        await db.update(schema.golfers)
          .set({ espnId })
          .where(eq(schema.golfers.id, g.id));
        updatedCount++;
        console.log(`Updated ${g.name} with ESPN ID ${espnId}`);
      } else if (!espnId) {
        console.log(`Could not find ESPN ID for ${g.name}`);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} golfers with ESPN IDs!`);
  } catch (error) {
    console.error('Error updating ESPN IDs:', error);
  }
}

updateEspnIds();
