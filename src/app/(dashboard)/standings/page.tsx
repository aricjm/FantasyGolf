import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, scores } from '@/db/schema';
import { eq, sum } from 'drizzle-orm';

// Season Points lookup by team rank in a single tournament (1-indexed, 10th and below = 0)
const SEASON_POINTS_MAP: Record<number, number> = {
  1: 20,
  2: 17,
  3: 14,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
};

export default async function StandingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch all users
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
      logoUrl: users.logoUrl,
    })
    .from(users);

  // Total tournament points per user (sum of all scores)
  const pointsData = await db
    .select({
      userId: scores.userId,
      totalPoints: sum(scores.totalPoints),
    })
    .from(scores)
    .groupBy(scores.userId);

  // Per-tournament totals per user (to compute team rank per tournament)
  const perTournamentData = await db
    .select({
      userId: scores.userId,
      tournamentId: scores.tournamentId,
      tournamentPoints: sum(scores.totalPoints),
    })
    .from(scores)
    .groupBy(scores.userId, scores.tournamentId);

  // Group by tournament
  const tournamentMap: Record<string, { userId: number; pts: number }[]> = {};
  for (const row of perTournamentData) {
    const tid = row.tournamentId;
    if (!tournamentMap[tid]) tournamentMap[tid] = [];
    tournamentMap[tid].push({ userId: row.userId, pts: parseFloat(row.tournamentPoints ?? '0') });
  }

  // Compute season points per user by ranking teams within each tournament
  const seasonPointsPerUser: Record<number, number> = {};
  for (const tid of Object.keys(tournamentMap)) {
    const entries = [...tournamentMap[tid]].sort((a, b) => b.pts - a.pts);
    entries.forEach((entry, idx) => {
      const rank = idx + 1;
      const sp = SEASON_POINTS_MAP[rank] ?? 0;
      seasonPointsPerUser[entry.userId] = (seasonPointsPerUser[entry.userId] ?? 0) + sp;
    });
  }

  // Build standings
  const standings = allUsers.map((user) => {
    const scoreRecord = pointsData.find((s) => s.userId === user.id);
    const tournamentPoints = scoreRecord?.totalPoints ? parseFloat(scoreRecord.totalPoints) : 0;
    const seasonPoints = seasonPointsPerUser[user.id] ?? 0;
    return { ...user, tournamentPoints, seasonPoints };
  });

  // Sort by Season Points (primary), then Tournament Points (tiebreaker)
  standings.sort((a, b) =>
    b.seasonPoints !== a.seasonPoints
      ? b.seasonPoints - a.seasonPoints
      : b.tournamentPoints - a.tournamentPoints
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">League Standings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Ranked by <span className="text-amber-400 font-semibold">Season Points</span> — earned by finishing position against other teams each tournament.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 bg-neutral-900/40 border border-neutral-800 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-neutral-300"><span className="font-bold text-emerald-400">Tournament Pts</span> — cumulative fantasy points from all golfers across tournaments</span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900/40 border border-neutral-800 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          <span className="text-neutral-300"><span className="font-bold text-amber-400">Season Pts</span> — points earned by your team's rank vs other teams each tournament (determines champion)</span>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-center w-16">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4 text-right">
                  <span className="text-emerald-400">Tournament Pts</span>
                </th>
                <th className="px-6 py-4 text-right">
                  <span className="text-amber-400">Season Pts</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {standings.map((team, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                const badgeText = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : '';

                return (
                  <tr
                    key={team.id}
                    className="hover:bg-neutral-800/10 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-center font-bold">
                      {isTop3 ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                          rank === 1 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          rank === 2 ? 'bg-neutral-300/10 text-neutral-300 border-neutral-300/30' :
                          'bg-amber-800/10 text-amber-600 border-amber-800/30'
                        }`} title={`${rank} Place`}>
                          {badgeText}
                        </span>
                      ) : (
                        <span className="text-neutral-500">{rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-emerald-950 border border-emerald-800/30 rounded-lg flex items-center justify-center font-black text-[10px] text-emerald-300">
                            {team.teamAbbr || 'TD'}
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-white block">{team.teamName || 'Set Team Name'}</span>
                          <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase block mt-0.5">
                            {team.teamAbbr || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-medium">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {team.tournamentPoints.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-amber-400 text-base">
                      {team.seasonPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
