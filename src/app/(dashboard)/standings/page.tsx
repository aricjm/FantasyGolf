import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, scores } from '@/db/schema';
import { eq, sum } from 'drizzle-orm';

export default async function StandingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // 1. Fetch all users and calculate their total points
  // Query all users
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
      logoUrl: users.logoUrl,
    })
    .from(users);

  // Query score sums
  const pointsData = await db
    .select({
      userId: scores.userId,
      totalPoints: sum(scores.totalPoints),
    })
    .from(scores)
    .groupBy(scores.userId);

  // Map scores to users
  const standings = allUsers.map((user) => {
    const scoreRecord = pointsData.find((s) => s.userId === user.id);
    const points = scoreRecord?.totalPoints ? parseFloat(scoreRecord.totalPoints) : 0.0;
    
    return {
      ...user,
      points,
    };
  });

  // Sort standings by points (highest first)
  standings.sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">League Standings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Real-time standings based on cumulative fantasy golf points.
        </p>
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
                <th className="px-6 py-4 text-right w-36">Total Points</th>
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
                    <td className="px-6 py-4 text-right font-black text-white text-base">
                      {team.points.toFixed(1)}
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
