import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, draftStates, draftPicks, golfers, trades, tradeItems, transactions, tournaments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function RecapsPage({
  searchParams,
}: {
  searchParams: { tab?: string; draft?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const activeTab = searchParams.tab || 'drafts';
  const selectedDraftId = searchParams.draft ? parseInt(searchParams.draft, 10) : null;

  // 1. Fetch all users
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
    })
    .from(users);

  // 2. Fetch all drafts
  const drafts = await db
    .select({
      id: draftStates.id,
      type: draftStates.type,
      status: draftStates.status,
      tournamentName: tournaments.name,
    })
    .from(draftStates)
    .leftJoin(tournaments, eq(draftStates.tournamentId, tournaments.id))
    .orderBy(draftStates.type, draftStates.id);

  // Default select first draft if none chosen
  const activeDraftId = selectedDraftId || drafts[0]?.id;

  // 3. Load active draft picks if we are on the drafts tab
  let draftPicksList: any[] = [];
  if (activeTab === 'drafts' && activeDraftId) {
    draftPicksList = await db
      .select({
        id: draftPicks.id,
        round: draftPicks.round,
        pickNumber: draftPicks.pickNumber,
        userId: draftPicks.userId,
        golferName: golfers.name,
        golferRank: golfers.rank,
      })
      .from(draftPicks)
      .innerJoin(golfers, eq(draftPicks.golferId, golfers.id))
      .where(eq(draftPicks.draftId, activeDraftId))
      .orderBy(draftPicks.pickNumber);
  }

  // 4. Load trade recaps (accepted trades only)
  let tradeRecapsList: any[] = [];
  if (activeTab === 'trades') {
    const acceptedTrades = await db
      .select({
        id: trades.id,
        senderId: trades.senderId,
        receiverId: trades.receiverId,
        updatedAt: trades.updatedAt,
      })
      .from(trades)
      .where(eq(trades.status, 'accepted'))
      .orderBy(desc(trades.updatedAt));

    tradeRecapsList = await Promise.all(
      acceptedTrades.map(async (t) => {
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

        const sender = allUsers.find((u) => u.id === t.senderId);
        const receiver = allUsers.find((u) => u.id === t.receiverId);

        return {
          id: t.id,
          senderName: sender?.teamName || sender?.name || 'Unknown',
          receiverName: receiver?.teamName || receiver?.name || 'Unknown',
          updatedAt: t.updatedAt,
          gave: items.filter((i) => i.direction === 'send'), // sender to receiver
          got: items.filter((i) => i.direction === 'receive'), // receiver to sender
        };
      })
    );
  }

  // 5. Load free agency transactions
  let transactionsList: any[] = [];
  if (activeTab === 'transactions') {
    transactionsList = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        transactionDate: transactions.transactionDate,
        addedName: golfers.name,
        addedRank: golfers.rank,
      })
      .from(transactions)
      .leftJoin(golfers, eq(transactions.golferAddedId, golfers.id)) // Joined for Added
      .orderBy(desc(transactions.transactionDate));
      
    // Fetch drop details as well (requires mapping or nested query since we can't double-join easily in a simple query)
    transactionsList = await Promise.all(
      transactionsList.map(async (tx) => {
        // Query dropped golfer
        const [dropRow] = await db
          .select({
            name: golfers.name,
            rank: golfers.rank,
          })
          .from(transactions)
          .innerJoin(golfers, eq(transactions.golferDroppedId, golfers.id))
          .where(eq(transactions.id, tx.id))
          .limit(1);

        const userObj = allUsers.find((u) => u.id === tx.userId);

        return {
          ...tx,
          teamName: userObj?.teamName || userObj?.name || 'Unknown',
          droppedName: dropRow?.name || null,
          droppedRank: dropRow?.rank || null,
        };
      })
    );
  }

  const tabClass = (tab: string) =>
    `flex-1 py-3 text-center border-b-2 font-bold text-xs tracking-wider uppercase transition-all ${
      activeTab === tab
        ? 'border-emerald-500 text-emerald-400 font-extrabold'
        : 'border-transparent text-neutral-500 hover:text-neutral-300'
    }`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">League Recaps</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Review past drafts, accepted trades, and free agency activity.
        </p>
      </div>

      <div className="flex border-b border-neutral-900 bg-neutral-950/20 rounded-t-2xl overflow-hidden">
        <Link href="/recaps?tab=drafts" className={tabClass('drafts')}>
          Drafts
        </Link>
        <Link href="/recaps?tab=trades" className={tabClass('trades')}>
          Trades
        </Link>
        <Link href="/recaps?tab=transactions" className={tabClass('transactions')}>
          Free Agency
        </Link>
      </div>

      {/* 2. Tab Contents */}
      <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-b-2xl backdrop-blur-xl">
        
        {/* DRAFTS TAB */}
        {activeTab === 'drafts' && (
          <div className="space-y-6">
            {/* Draft Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-xs font-bold uppercase">Select Draft:</span>
                <select
                  value={activeDraftId || ''}
                  onChange={(e) => {
                    window.location.href = `/recaps?tab=drafts&draft=${e.target.value}`;
                  }}
                  className="bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                >
                  {drafts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.type === 'long' ? 'Preseason Long Draft' : `${d.tournamentName} (Short)`}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                Showing {draftPicksList.length} selections
              </span>
            </div>

            {/* Picks Table */}
            {draftPicksList.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-8">
                No picks have been made in this draft session yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Overall Pick</th>
                      <th className="py-3 px-4">Round</th>
                      <th className="py-3 px-4">Team Manager</th>
                      <th className="py-3 px-4">Golfer Name</th>
                      <th className="py-3 px-4 text-right">World Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/30 text-neutral-200">
                    {draftPicksList.map((p) => {
                      const picker = allUsers.find((u) => u.id === p.userId);
                      return (
                        <tr key={p.id} className="hover:bg-neutral-850/20 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-neutral-400">#{p.pickNumber}</td>
                          <td className="py-3.5 px-4 font-semibold">Round {p.round}</td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {picker?.teamName || picker?.name || 'Unknown'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-300">{p.golferName}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-neutral-400">#{p.golferRank}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TRADES TAB */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            {tradeRecapsList.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-8">
                No accepted trades have been recorded in the league yet.
              </p>
            ) : (
              tradeRecapsList.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-neutral-950/40 border border-neutral-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                      Trade Executed
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {trade.updatedAt ? new Date(trade.updatedAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Sender swap details */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        {trade.senderName} received:
                      </span>
                      <div className="space-y-1">
                        {trade.got.map((item: any) => (
                          <div key={item.golferId} className="text-xs font-semibold text-white">
                            {item.name} <span className="text-neutral-500 text-[10px]">(#{item.rank})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Receiver swap details */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        {trade.receiverName} received:
                      </span>
                      <div className="space-y-1">
                        {trade.gave.map((item: any) => (
                          <div key={item.golferId} className="text-xs font-semibold text-white">
                            {item.name} <span className="text-neutral-500 text-[10px]">(#{item.rank})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* FREE AGENCY TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {transactionsList.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-8">
                No free agency transactions have occurred yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4 text-emerald-400">Added Player</th>
                      <th className="py-3 px-4 text-red-400">Dropped Player</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/30 text-neutral-200">
                    {transactionsList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-850/20 transition-colors">
                        <td className="py-3 px-4 text-xs text-neutral-500">
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{tx.teamName}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-300">
                          {tx.addedName ? (
                            <span>{tx.addedName} <span className="text-[10px] text-neutral-500">(#{tx.addedRank})</span></span>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-red-300">
                          {tx.droppedName ? (
                            <span>{tx.droppedName} <span className="text-[10px] text-neutral-500">(#{tx.droppedRank})</span></span>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
