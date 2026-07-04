import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, rosters, golfers, lineups, tournaments, trades, tradeItems } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { toggleLineupGolfer, handleTradeProposal } from './actions';
import LineupManager from './LineupManager';
import TeamSettingsModal from './TeamSettingsModal';
import TradeAlert from './TradeAlert';

export default async function MyTeamPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);

  // 1. Fetch User details
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    redirect('/auth/signin');
  }

  // 2. Fetch User's Roster
  const userRoster = await db
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
    .where(eq(rosters.userId, userId));

  // 3. Fetch Active / Next Tournament
  // Find first active tournament, or the nearest upcoming tournament
  let [activeTournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.status, 'active'))
    .limit(1);

  if (!activeTournament) {
    // If no active, get the earliest pending one
    [activeTournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.status, 'pending'))
      .orderBy(tournaments.startDate)
      .limit(1);
  }

  // Fallback mock tournament if database seed is completely empty
  const tournament = activeTournament || {
    id: 'mock-sentry',
    name: 'The Sentry (Mock Event)',
    type: 'regular',
    startDate: new Date('2027-01-28T08:00:00Z'),
    status: 'pending',
  };

  // 4. Fetch Lineup selections for this tournament
  const userLineup = await db
    .select()
    .from(lineups)
    .where(
      and(
        eq(lineups.userId, userId),
        eq(lineups.tournamentId, tournament.id)
      )
    );

  // 5. Fetch Pending Trades sent to this user
  const incomingTrades = await db
    .select({
      id: trades.id,
      senderId: trades.senderId,
      senderName: users.name,
      senderTeamName: users.teamName,
      status: trades.status,
    })
    .from(trades)
    .innerJoin(users, eq(trades.senderId, users.id))
    .where(and(eq(trades.receiverId, userId), eq(trades.status, 'pending')));

  // For each trade, get the item details
  const tradesWithDetails = await Promise.all(
    incomingTrades.map(async (t) => {
      const items = await db
        .select({
          golferId: golfers.id,
          name: golfers.name,
          rank: golfers.rank,
          direction: tradeItems.direction,
        })
        .from(tradeItems)
        .innerJoin(golfers, eq(tradeItems.golferId, golfers.id))
        .where(eq(tradeItems.tradeId, t.id));

      return {
        ...t,
        items,
      };
    })
  );

  // Check if lineup is locked
  const isLocked =
    tournament.status === 'active' ||
    tournament.status === 'completed' ||
    new Date() > new Date(tournament.startDate);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-4">
          {user.logoUrl ? (
            <img
              src={user.logoUrl}
              alt="Team Logo"
              className="w-16 h-16 rounded-xl object-cover border border-emerald-950/40 shadow-lg shadow-emerald-950/20"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-950 to-emerald-900 border border-emerald-800/30 rounded-xl flex items-center justify-center text-xl font-black text-emerald-400 shadow-lg">
              {user.teamAbbr || 'BD'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{user.teamName || 'Set Your Team Name'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-emerald-900/50 border border-emerald-800/40 text-emerald-400 text-xs font-black tracking-widest px-2.5 py-0.5 rounded-md uppercase">
                {user.teamAbbr || 'TBD'}
              </span>
              <span className="text-neutral-400 text-sm">Manager: {user.name}</span>
            </div>
          </div>
        </div>

        {/* Modal Button */}
        <TeamSettingsModal user={user} />
      </div>

      {/* 2. Trade proposals alert */}
      {tradesWithDetails.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            Trade Proposals Received
          </h2>
          {tradesWithDetails.map((trade) => (
            <TradeAlert key={trade.id} trade={trade} />
          ))}
        </div>
      )}

      {/* 3. Tournament Banner */}
      <div className={`p-6 rounded-2xl border ${
        isLocked
          ? 'bg-red-950/20 border-red-900/30 text-red-100'
          : 'bg-emerald-950/10 border-emerald-900/20 text-emerald-100'
      } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div>
          <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
            isLocked ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-400'
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

      {/* 4. Roster Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Roster & Lineup Manager (Col span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Lineup & Roster</h2>
            <span className="text-xs text-neutral-400 font-medium">
              Start exactly 6 golfers • 4 sit on the bench
            </span>
          </div>

          {userRoster.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/20 border border-neutral-800 rounded-2xl backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white">Your Roster is Empty</h3>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-2 mb-6">
                You haven't drafted any golfers yet. Head to the drafts page to run the preseason snake draft and build your team.
              </p>
              <a
                href="/drafts"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition inline-block text-sm"
              >
                Go to Drafts Room
              </a>
            </div>
          ) : (
            <LineupManager
              roster={userRoster}
              lineup={userLineup}
              tournamentId={tournament.id}
              isLocked={isLocked}
            />
          )}
        </div>

        {/* Scoring & Rules summary */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Active Scoring Rules</h2>
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase">Hole scores</h3>
              <div className="grid grid-cols-2 gap-y-2 mt-2.5 text-sm text-neutral-300">
                <div className="flex justify-between pr-4"><span>Albatross</span> <span className="font-bold text-white">+20</span></div>
                <div className="flex justify-between"><span>Bogey</span> <span className="font-bold text-red-400">-4</span></div>
                <div className="flex justify-between pr-4"><span>Hole in One</span> <span className="font-bold text-white">+12</span></div>
                <div className="flex justify-between"><span>Double Bogey</span> <span className="font-bold text-red-500">-8</span></div>
                <div className="flex justify-between pr-4"><span>Eagle</span> <span className="font-bold text-white">+8</span></div>
                <div className="flex justify-between"><span>Triple+ Bogey</span> <span className="font-bold text-red-600">-12</span></div>
                <div className="flex justify-between pr-4"><span>Birdie</span> <span className="font-bold text-emerald-400">+4</span></div>
                <div className="flex justify-between"><span>Par</span> <span className="font-bold text-white">+1</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase">Finish placement points</h3>
              <div className="grid grid-cols-2 gap-y-2 mt-2.5 text-sm text-neutral-300">
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
          </div>
        </div>

      </div>

    </div>
  );
}
