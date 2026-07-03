import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, rosters, golfers, lineups, tournaments } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export default async function OpposingTeamsPage({
  searchParams,
}: {
  searchParams: { opponent?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);
  const selectedOpponentId = searchParams.opponent ? parseInt(searchParams.opponent, 10) : null;

  // 1. Fetch other 9 managers in the league
  const opponents = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
      logoUrl: users.logoUrl,
    })
    .from(users)
    .where(ne(users.id, userId));

  // 2. Fetch active tournament
  let [activeTournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.status, 'active'))
    .limit(1);

  if (!activeTournament) {
    [activeTournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.status, 'pending'))
      .orderBy(tournaments.startDate)
      .limit(1);
  }

  const tournament = activeTournament || {
    id: 'mock-sentry',
    name: 'The Sentry (Mock Event)',
  };

  // 3. If an opponent is selected, fetch their roster and lineup
  let opponentRoster: any[] = [];
  let opponentLineup: any[] = [];
  let selectedOpponent: any = null;

  if (selectedOpponentId) {
    selectedOpponent = opponents.find((o) => o.id === selectedOpponentId);

    if (selectedOpponent) {
      // Fetch roster
      opponentRoster = await db
        .select({
          id: golfers.id,
          name: golfers.name,
          rank: golfers.rank,
          country: golfers.country,
          type: golfers.type,
        })
        .from(rosters)
        .innerJoin(golfers, eq(rosters.golferId, golfers.id))
        .where(eq(rosters.userId, selectedOpponentId));

      // Fetch lineup
      opponentLineup = await db
        .select()
        .from(lineups)
        .where(
          and(
            eq(lineups.userId, selectedOpponentId),
            eq(lineups.tournamentId, tournament.id)
          )
        );
    }
  }

  // Separate starters and bench
  const starters = opponentRoster.filter((g) =>
    opponentLineup.some((l) => l.golferId === g.id && l.isActive)
  );
  const bench = opponentRoster.filter(
    (g) => !opponentLineup.some((l) => l.golferId === g.id && l.isActive)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Opposing Teams</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Inspect your rivals' rosters and propose trades.
        </p>
      </div>

      {/* Selector dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-900/40 border border-neutral-850 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <select
            value={selectedOpponentId || ''}
            onChange={(e) => {
              const val = e.target.value;
              window.location.href = val ? `/opposing-teams?opponent=${val}` : '/opposing-teams';
            }}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-extrabold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="" disabled>-- Select an Opponent --</option>
            {opponents.map((o) => (
              <option key={o.id} value={o.id}>
                {o.teamName || o.name} ({o.teamAbbr || 'TBD'})
              </option>
            ))}
          </select>
        </div>

        {selectedOpponent && (
          <Link
            href={`/trades?propose=${selectedOpponent.id}`}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-amber-900/20 active:scale-95"
          >
            Propose Trade Offer
          </Link>
        )}
      </div>

      {/* Roster Viewer */}
      {selectedOpponent ? (
        <div className="space-y-6">
          
          {/* Opponent Profile Card */}
          <div className="flex items-center gap-4 bg-neutral-900/20 border border-neutral-850 p-5 rounded-2xl">
            {selectedOpponent.logoUrl ? (
              <img src={selectedOpponent.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center font-bold text-sm text-neutral-400">
                {selectedOpponent.teamAbbr || 'OP'}
              </div>
            )}
            <div>
              <h2 className="text-lg font-black text-white">{selectedOpponent.teamName || 'Opponent Team'}</h2>
              <p className="text-xs text-neutral-400">Manager: {selectedOpponent.name} • {selectedOpponent.teamAbbr || 'TBD'}</p>
            </div>
          </div>

          {opponentRoster.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/20 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
              This opponent's roster is currently empty.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Starters */}
              <div className="space-y-3">
                <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-900 pb-2">
                  Starting Lineup ({starters.length})
                </h3>
                <div className="space-y-2">
                  {starters.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3.5 bg-emerald-950/10 border border-emerald-900/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-neutral-950 border border-neutral-850 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-400">
                          #{g.rank}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">{g.name}</span>
                          <span className="text-[10px] text-neutral-500">{g.country}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-950/40 border border-emerald-900/20 px-2 py-0.5 rounded">
                        {g.type === 'top20' ? 'Weekly Top 20' : 'Permanent'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bench */}
              <div className="space-y-3">
                <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase border-b border-neutral-900 pb-2">
                  Bench ({bench.length})
                </h3>
                <div className="space-y-2">
                  {bench.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3.5 bg-neutral-900/40 border border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-neutral-950 border border-neutral-850 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-400">
                          #{g.rank}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white block">{g.name}</span>
                          <span className="text-[10px] text-neutral-500">{g.country}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase bg-neutral-850 border border-neutral-800 px-2 py-0.5 rounded">
                        {g.type === 'top20' ? 'Weekly Top 20' : 'Permanent'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center bg-neutral-900/20 border border-neutral-800 rounded-2xl text-neutral-400 text-sm">
          Select an opponent from the dropdown menu above to view their roster details.
        </div>
      )}

    </div>
  );
}
