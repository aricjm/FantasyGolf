import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, rosters, golfers, lineups, tournaments } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import LineupManager from '../../my-team/LineupManager';
import RivalSelector from './RivalSelector';
import Link from 'next/link';

export default async function OpponentTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);
  const resolvedParams = await params;
  const opponentId = parseInt(resolvedParams.teamId, 10);

  if (opponentId === userId) {
    redirect('/my-team');
  }

  // 1. Fetch Opponent details
  const [opponent] = await db
    .select()
    .from(users)
    .where(eq(users.id, opponentId))
    .limit(1);

  if (!opponent) {
    redirect('/my-team');
  }

  // 2. Fetch all other managers (opponents) for switcher
  const opponentsList = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
    })
    .from(users)
    .where(ne(users.id, userId));

  // 3. Fetch Opponent's Roster
  const opponentRoster = await db
    .select({
      id: golfers.id,
      name: golfers.name,
      rank: golfers.rank,
      country: golfers.country,
      type: golfers.type,
      acquiredVia: rosters.acquiredVia,
    })
    .from(rosters)
    .innerJoin(golfers, eq(rosters.golferId, golfers.id))
    .where(eq(rosters.userId, opponentId));

  // 4. Fetch Active / Next Tournament
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
    type: 'regular',
    startDate: new Date('2027-01-28T08:00:00Z'),
    status: 'pending',
  };

  // 5. Fetch Lineup selections for this tournament
  const opponentLineup = await db
    .select()
    .from(lineups)
    .where(
      and(
        eq(lineups.userId, opponentId),
        eq(lineups.tournamentId, tournament.id)
      )
    );

  const isLocked =
    tournament.status === 'active' ||
    tournament.status === 'completed' ||
    new Date() > new Date(tournament.startDate);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-4">
          {opponent.logoUrl ? (
            <img
              src={opponent.logoUrl}
              alt="Rival Logo"
              className="w-16 h-16 rounded-xl object-cover border border-emerald-950/40 shadow-lg shadow-emerald-950/20"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-950 to-emerald-900 border border-emerald-800/30 rounded-xl flex items-center justify-center text-xl font-black text-emerald-400 shadow-lg">
              {opponent.teamAbbr || 'OP'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{opponent.teamName || 'Rival Team'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-neutral-800 border border-neutral-750 text-neutral-300 text-xs font-black tracking-widest px-2.5 py-0.5 rounded-md uppercase">
                {opponent.teamAbbr || 'TBD'}
              </span>
              <span className="text-neutral-400 text-sm">Manager: {opponent.name}</span>
            </div>
          </div>
        </div>

        {/* Rival Selector & Trade Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <RivalSelector opponents={opponentsList} currentOpponentId={opponentId} />
          
          <Link
            href={`/trades?propose=${opponentId}`}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-amber-900/20 active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Propose Trade
          </Link>
        </div>
      </div>

      {/* 2. Tournament Banner */}
      <div className={`p-6 rounded-2xl border ${isLocked
        ? 'bg-red-950/20 border-red-900/30 text-red-100'
        : 'bg-emerald-950/10 border-emerald-900/20 text-emerald-100'
        } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div>
          <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${isLocked ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-400'
            }`}>
            {isLocked ? 'Lineup Locked' : 'Lineup Open'}
          </span>
          <h2 className="text-lg font-bold text-white mt-2">{tournament.name}</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Starts: {new Date(tournament.startDate).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-400 block">Tournament Type</span>
          <span className="text-sm font-extrabold text-white uppercase tracking-wider">
            {tournament.type === 'major' ? 'Major' : 'Regular Tour'}
          </span>
        </div>
      </div>

      {/* 3. Roster Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Roster & Lineup (Col span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Rival Lineup & Roster</h2>
            <span className="text-xs text-neutral-400 font-medium">
              Read-Only Mode
            </span>
          </div>

          {opponentRoster.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/20 border border-neutral-800 rounded-2xl backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white">Rival Roster is Empty</h3>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-2">
                This manager hasn't drafted any golfers yet.
              </p>
            </div>
          ) : (
            <LineupManager
              roster={opponentRoster}
              lineup={opponentLineup}
              tournamentId={tournament.id}
              isLocked={isLocked}
              readOnly={true}
            />
          )}
        </div>

        {/* Scoring & Rules summary */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Active Scoring Rules</h2>
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">

            {/* Hole Scores */}
            <div className="border-b border-neutral-800 pb-4">
              <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase mb-2.5">Tournament Points — Hole Scores</h3>
              <p className="text-[10px] text-neutral-500 mb-3">Points earned per hole by each of your rostered golfers.</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-neutral-300">
                <div className="flex justify-between pr-4"><span>Albatross</span> <span className="font-bold text-emerald-400">+20</span></div>
                <div className="flex justify-between"><span>Bogey</span> <span className="font-bold text-red-400">-4</span></div>
                <div className="flex justify-between pr-4"><span>Hole in One</span> <span className="font-bold text-emerald-400">+12</span></div>
                <div className="flex justify-between"><span>Double Bogey</span> <span className="font-bold text-red-500">-8</span></div>
                <div className="flex justify-between pr-4"><span>Eagle</span> <span className="font-bold text-emerald-400">+8</span></div>
                <div className="flex justify-between"><span>Triple+ Bogey</span> <span className="font-bold text-red-600">-12</span></div>
                <div className="flex justify-between pr-4"><span>Birdie</span> <span className="font-bold text-emerald-400">+4</span></div>
                <div className="flex justify-between"><span>Par</span> <span className="font-bold text-emerald-400">+1</span></div>
              </div>
            </div>

            {/* Golfer Finish Placement */}
            <div className="border-b border-neutral-800 pb-4">
              <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase mb-2.5">Tournament Points — Golfer Finish</h3>
              <p className="text-[10px] text-neutral-500 mb-3">Bonus points added to your Tournament Score based on each golfer's finishing position.</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-neutral-300">
                <div className="flex justify-between pr-4"><span>1st Place</span> <span className="font-bold text-white">+30</span></div>
                <div className="flex justify-between"><span>6th Place</span> <span className="font-bold text-white">+20</span></div>
                <div className="flex justify-between pr-4"><span>2nd Place</span> <span className="font-bold text-white">+28</span></div>
                <div className="flex justify-between"><span>7th Place</span> <span className="font-bold text-white">+18</span></div>
                <div className="flex justify-between pr-4"><span>3rd Place</span> <span className="font-bold text-white">+26</span></div>
                <div className="flex justify-between"><span>8th Place</span> <span className="font-bold text-white">+16</span></div>
                <div className="flex justify-between pr-4"><span>4th Place</span> <span className="font-bold text-white">+24</span></div>
                <div className="flex justify-between"><span>9th Place</span> <span className="font-bold text-white">+14</span></div>
                <div className="flex justify-between pr-4"><span>5th Place</span> <span className="font-bold text-white">+22</span></div>
                <div className="flex justify-between"><span>10th Place</span> <span className="font-bold text-white">+12</span></div>
              </div>
              <div className="mt-3 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
                <p>• 11th - 15th: 10 pts</p>
                <p className="mt-1">• 16th - 20th: 8 pts</p>
                <p className="mt-1">• 21st - 25th: 6 pts</p>
                <p className="mt-1">• 26th - 30th: 4 pts</p>
                <p className="mt-1">• 30th+ & made cut: 2 pts</p>
              </div>
            </div>

            {/* Season Points */}
            <div>
              <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase mb-2.5">Season Points — Team vs. Team</h3>
              <p className="text-[10px] text-neutral-500 mb-3">After each tournament, teams rank against each other by Tournament Score. Your place earns Season Points — the most at year's end wins the league.</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-neutral-300">
                <div className="flex justify-between pr-4"><span>1st Place</span> <span className="font-bold text-amber-400">+20</span></div>
                <div className="flex justify-between"><span>6th Place</span> <span className="font-bold text-emerald-400">+8</span></div>
                <div className="flex justify-between pr-4"><span>2nd Place</span> <span className="font-bold text-emerald-400">+17</span></div>
                <div className="flex justify-between"><span>7th Place</span> <span className="font-bold text-emerald-400">+6</span></div>
                <div className="flex justify-between pr-4"><span>3rd Place</span> <span className="font-bold text-emerald-400">+14</span></div>
                <div className="flex justify-between"><span>8th Place</span> <span className="font-bold text-emerald-400">+4</span></div>
                <div className="flex justify-between pr-4"><span>4th Place</span> <span className="font-bold text-emerald-400">+12</span></div>
                <div className="flex justify-between"><span>9th Place</span> <span className="font-bold text-emerald-400">+2</span></div>
                <div className="flex justify-between pr-4"><span>5th Place</span> <span className="font-bold text-emerald-400">+10</span></div>
                <div className="flex justify-between"><span>10th Place</span> <span className="font-bold text-red-400">0</span></div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
