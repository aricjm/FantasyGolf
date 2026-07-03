import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { draftStates, tournaments, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function initializeDrafts() {
  // Fetch tournaments and users
  const tourneys = await db.select().from(tournaments);
  const allUsers = await db.select().from(users);

  if (allUsers.length === 0) return;

  const userIds = allUsers.map((u) => u.id);
  // Ensure we have exactly 10 users or pad with mock IDs for testing
  const paddedUserIds = [...userIds];
  while (paddedUserIds.length < 10) {
    // Pad with temporary placeholder user IDs for draft room demo
    paddedUserIds.push(100 + paddedUserIds.length);
  }

  // 1. Initialize preseason long draft if it doesn't exist
  const existingLong = await db
    .select()
    .from(draftStates)
    .where(eq(draftStates.type, 'long'))
    .limit(1);

  if (existingLong.length === 0) {
    // Standard snake order: users order
    await db.insert(draftStates).values({
      type: 'long',
      tournamentId: null,
      status: 'pending',
      pickOrder: JSON.stringify(paddedUserIds),
    });
  }

  // 2. Initialize weekly short drafts for the 20 regular tournaments
  const regularTourneys = tourneys.filter((t) => t.type === 'regular');
  for (let i = 0; i < regularTourneys.length; i++) {
    const tourney = regularTourneys[i];
    const existingShort = await db
      .select()
      .from(draftStates)
      .where(and(eq(draftStates.type, 'short'), eq(draftStates.tournamentId, tourney.id)))
      .limit(1);

    if (existingShort.length === 0) {
      // Rotate the draft positions so each user gets to draft at each position twice
      // Simple shift rotation: shift by i places
      const shiftedOrder = [...paddedUserIds];
      for (let s = 0; s < i; s++) {
        const first = shiftedOrder.shift();
        if (first !== undefined) shiftedOrder.push(first);
      }

      await db.insert(draftStates).values({
        type: 'short',
        tournamentId: tourney.id,
        status: 'pending',
        pickOrder: JSON.stringify(shiftedOrder),
      });
    }
  }
}

export default async function DraftsListPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Auto initialize drafts if database is blank
  await initializeDrafts();

  // Fetch drafts from database
  const drafts = await db
    .select({
      id: draftStates.id,
      type: draftStates.type,
      status: draftStates.status,
      currentRound: draftStates.currentRound,
      currentPick: draftStates.currentPick,
      tournamentName: tournaments.name,
      tournamentDate: tournaments.startDate,
    })
    .from(draftStates)
    .leftJoin(tournaments, eq(draftStates.tournamentId, tournaments.id))
    .orderBy(draftStates.type, tournaments.startDate);

  const longDraft = drafts.find((d) => d.type === 'long');
  const shortDrafts = drafts.filter((d) => d.type === 'short');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Draft Rooms</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Select a draft below to enter the live room. Snake order rules will apply.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Preseason Long Draft Room Card */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-bold text-white mb-4">Preseason Long Draft</h2>
          
          {longDraft ? (
            <div className="bg-gradient-to-br from-emerald-950/20 to-neutral-900 border border-emerald-900/30 rounded-2xl p-6 relative overflow-hidden shadow-xl backdrop-blur-xl">
              <div className="absolute top-0 right-0 bg-emerald-600/20 text-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-bl-xl border-l border-b border-emerald-900/30">
                Annual Draft
              </div>
              <h3 className="text-xl font-bold text-white">Season Roster Draft</h3>
              <p className="text-xs text-emerald-500 font-semibold mt-1">
                8 Rounds • Selects world rank #21 to #125
              </p>
              
              <div className="mt-6 space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span>Status</span>
                  <span className={`font-bold capitalize ${
                    longDraft.status === 'completed' ? 'text-neutral-500' :
                    longDraft.status === 'active' ? 'text-emerald-400 animate-pulse' : 'text-amber-500'
                  }`}>
                    {longDraft.status === 'completed' ? 'Finished' :
                     longDraft.status === 'active' ? 'Drafting Live' : 'Not Started'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span>Current Pick</span>
                  <span className="font-bold text-white">#{longDraft.currentPick} / 80</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Current Round</span>
                  <span className="font-bold text-white">{longDraft.currentRound} / 8</span>
                </div>
              </div>

              <Link
                href={`/drafts/${longDraft.id}`}
                className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center text-sm transition shadow-lg shadow-emerald-700/20 active:scale-[0.98] block"
              >
                Enter Draft Room
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center bg-neutral-900/20 border border-neutral-800 rounded-2xl text-sm text-neutral-500">
              Initializing Preseason Draft...
            </div>
          )}
        </div>

        {/* 20 Weekly Short Draft Rooms */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">Weekly Short Drafts</h2>
          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-3 max-h-[500px] overflow-y-auto">
            {shortDrafts.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-950/40 border border-neutral-800 hover:border-neutral-700 rounded-xl transition duration-200"
              >
                <div>
                  <h3 className="font-bold text-white text-sm">{d.tournamentName}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-medium">
                    <span className="text-amber-500 font-bold uppercase tracking-wider">
                      ⚡ 2 Rounds (Top 20)
                    </span>
                    <span>•</span>
                    <span>
                      {d.tournamentDate ? new Date(d.tournamentDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right sm:text-right">
                    <span className="text-[10px] text-neutral-500 block">Status</span>
                    <span className={`text-xs font-bold capitalize ${
                      d.status === 'completed' ? 'text-neutral-500' :
                      d.status === 'active' ? 'text-emerald-400 font-black' : 'text-amber-500'
                    }`}>
                      {d.status === 'completed' ? 'Finished' :
                       d.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <Link
                    href={`/drafts/${d.id}`}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition active:scale-95 ${
                      d.status === 'completed'
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20'
                    }`}
                  >
                    Draft
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
