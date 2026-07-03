import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, lineups, tournaments, golfers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchLiveScoreboard } from '@/lib/espn';
import FantasyCastDashboard from './FantasyCastDashboard';

export default async function FantasyCastPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // 1. Fetch active tournament
  let [activeTournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.status, 'active'))
    .limit(1);

  if (!activeTournament) {
    // If no active, get the nearest pending one
    [activeTournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.status, 'pending'))
      .orderBy(tournaments.startDate)
      .limit(1);
  }

  // 2. Fetch live scoreboard from ESPN API
  // If we have an active tournament, we pass its ID, otherwise it defaults to current PGA event
  const liveScoreboard = await fetchLiveScoreboard(activeTournament?.id || undefined);

  if (!liveScoreboard) {
    return (
      <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400">
        <h2 className="text-lg font-bold text-white">Live Scoreboard Unavailable</h2>
        <p className="text-xs text-neutral-500 mt-1">
          The ESPN PGA Tour Scoreboard API is currently unreachable, or there are no active tournaments happening.
        </p>
      </div>
    );
  }

  // 3. Fetch all league users and their lineups for this tournament
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
      logoUrl: users.logoUrl,
    })
    .from(users);

  // Fetch lineups
  const tournamentId = activeTournament?.id || liveScoreboard.eventId;
  const dbLineups = await db
    .select()
    .from(lineups)
    .where(eq(lineups.tournamentId, tournamentId));

  // Map live golfer scores to team lineups
  const teamsLeaderboard = allUsers.map((user) => {
    // Get user's lineup
    const userLineupRecords = dbLineups.filter((l) => l.userId === user.id);
    
    // Match golfers in lineup to live scores
    const activeStarters: any[] = [];
    const benchedGolfers: any[] = [];
    let activeTotalPoints = 0;

    userLineupRecords.forEach((record) => {
      // Find golfer live scores
      const liveScore = liveScoreboard.golfers.find((g) => g.athleteId === record.golferId);
      
      const golferDetails = {
        id: record.golferId,
        isActive: record.isActive,
        name: liveScore?.name || `Golfer #${record.golferId}`,
        score: liveScore?.score || 'E',
        strokes: liveScore?.strokes || 0,
        rank: liveScore?.rank || 999,
        madeCut: liveScore?.madeCut ?? true,
        holePoints: liveScore?.holePoints || 0,
        placingPoints: liveScore?.placingPoints || 0,
        totalPoints: liveScore?.totalPoints || 0,
        thru: liveScore?.thru || '-',
        today: liveScore?.today || '-',
      };

      if (record.isActive) {
        activeStarters.push(golferDetails);
        activeTotalPoints += golferDetails.totalPoints;
      } else {
        benchedGolfers.push(golferDetails);
      }
    });

    return {
      ...user,
      starters: activeStarters,
      bench: benchedGolfers,
      totalPoints: activeTotalPoints,
    };
  });

  // Sort teams by cumulative fantasy points descending
  teamsLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse inline-block"></span> FantasyCast
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time scoreboard showing active lineups and live fantasy points.
          </p>
        </div>
      </div>

      <FantasyCastDashboard
        tournamentName={liveScoreboard.name}
        round={liveScoreboard.round}
        completed={liveScoreboard.completed}
        teams={teamsLeaderboard}
      />

    </div>
  );
}
