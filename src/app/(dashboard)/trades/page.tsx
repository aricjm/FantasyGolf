import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, rosters, golfers, trades, tradeItems } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import TradeProposer from './TradeProposer';

export default async function TradesPage({
  searchParams,
}: {
  searchParams: { propose?: string; counter?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);
  let opponentId = searchParams.propose ? parseInt(searchParams.propose, 10) : null;
  const counterTradeId = searchParams.counter ? parseInt(searchParams.counter, 10) : null;

  let counteredTrade: any = null;

  // 1. If counter offer, load countered trade details
  if (counterTradeId) {
    const [trade] = await db
      .select()
      .from(trades)
      .where(eq(trades.id, counterTradeId))
      .limit(1);

    if (trade && trade.status === 'pending') {
      // The countered trade's sender becomes the receiver for our new proposal
      // If we are countering, we are the receiver of the original trade.
      // So the receiver of the original trade (us) is the sender of the counter,
      // and the sender of the original trade is the receiver of the counter.
      opponentId = trade.senderId;

      const items = await db
        .select({
          golferId: tradeItems.golferId,
          direction: tradeItems.direction,
        })
        .from(tradeItems)
        .where(eq(tradeItems.tradeId, counterTradeId));

      counteredTrade = {
        ...trade,
        items,
      };
    }
  }

  if (!opponentId) {
    redirect('/opposing-teams');
  }

  // 2. Fetch Opponent details
  const [opponent] = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
      logoUrl: users.logoUrl,
    })
    .from(users)
    .where(and(eq(users.id, opponentId), ne(users.id, userId)))
    .limit(1);

  if (!opponent) {
    redirect('/opposing-teams');
  }

  // 3. Fetch User's Roster
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

  // 4. Fetch Opponent's Roster
  const opponentRoster = await db
    .select({
      id: golfers.id,
      name: golfers.name,
      rank: golfers.rank,
      country: golfers.country,
      type: golfers.type,
    })
    .from(rosters)
    .innerJoin(golfers, eq(rosters.golferId, golfers.id))
    .where(eq(rosters.userId, opponentId));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Propose Trade</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Select the golfers to swap between your team and the opponent's team.
        </p>
      </div>

      <TradeProposer
        myRoster={myRoster}
        opponentRoster={opponentRoster}
        opponent={opponent}
        counteredTrade={counteredTrade}
      />

    </div>
  );
}
