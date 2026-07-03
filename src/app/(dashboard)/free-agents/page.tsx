import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { rosters, golfers, users, scores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import FreeAgentsList from './FreeAgentsList';

export default async function FreeAgentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);

  // 1. Fetch User's current roster
  const myRoster = await db
    .select({
      id: golfers.id,
      name: golfers.name,
      rank: golfers.rank,
      country: golfers.country,
      type: golfers.type,
    })
    .from(rosters)
    .innerJoin(golfers, eq(rosters.golferId, golfers.id))
    .where(eq(rosters.userId, userId));

  // 2. Fetch all rostered golfer IDs across the entire league
  const allRosteredRecords = await db.select({ golferId: rosters.golferId }).from(rosters);
  const rosteredGolferIds = allRosteredRecords.map((r) => r.golferId);

  // 3. Fetch all field golfers (PGA field golfers #21-#125 are eligible for free agency)
  const fieldGolfers = await db
    .select()
    .from(golfers)
    .where(eq(golfers.type, 'field'))
    .orderBy(golfers.rank);

  // 4. Fetch all scores to calculate statistics
  const allScores = await db.select().from(scores);

  // Available free agents = field golfers not currently rostered, with calculated stats
  const freeAgents = fieldGolfers
    .filter((g) => !rosteredGolferIds.includes(g.id))
    .map((golfer) => {
      const golferScores = allScores.filter((s) => s.golferId === golfer.id);
      
      // Age: deterministic mock (realistic range 22-38)
      const age = (golfer.id % 17) + 22;
      
      let events = golferScores.length;
      let totPts = golferScores.reduce((sum, s) => sum + s.totalPoints, 0);
      
      // Fallback/mock values if no scores exist in the database yet
      if (events === 0) {
        events = (golfer.id % 5) + 4; // 4 to 8 events
        const basePoints = Math.max(15, Math.round((140 - golfer.rank) * 1.8));
        totPts = basePoints + (golfer.id % 15);
      }
      
      const avgPts = parseFloat((totPts / events).toFixed(1));
      const ptsLost = Math.round(events * 9 + (golfer.id % 7) * 1.5);
      const ptsGain = totPts + ptsLost;
      
      return {
        ...golfer,
        age,
        events,
        totPts,
        avgPts,
        ptsLost,
        ptsGain,
      };
    });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Free Agency</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Pick up players who are not currently on any team roster. Top 20 golfers cannot be claimed.
        </p>
      </div>

      <FreeAgentsList
        freeAgents={freeAgents}
        myRoster={myRoster}
      />

    </div>
  );
}
