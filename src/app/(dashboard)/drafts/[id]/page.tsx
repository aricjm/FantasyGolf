import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { draftStates, draftPicks, golfers, users, tournaments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import DraftRoom from './DraftRoom';

export default async function DraftRoomPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);
  const draftId = parseInt(params.id, 10);

  if (isNaN(draftId)) {
    redirect('/drafts');
  }

  // 1. Fetch Draft State
  const [draft] = await db
    .select({
      id: draftStates.id,
      type: draftStates.type,
      status: draftStates.status,
      currentRound: draftStates.currentRound,
      currentPick: draftStates.currentPick,
      pickOrder: draftStates.pickOrder,
      tournamentName: tournaments.name,
    })
    .from(draftStates)
    .leftJoin(tournaments, eq(draftStates.tournamentId, tournaments.id))
    .where(eq(draftStates.id, draftId))
    .limit(1);

  if (!draft) {
    redirect('/drafts');
  }

  // 2. Fetch Users to map names
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      teamName: users.teamName,
      teamAbbr: users.teamAbbr,
      logoUrl: users.logoUrl,
    })
    .from(users);

  // 3. Fetch Golfers (filtered by draft type)
  let eligibleGolfers = [];
  if (draft.type === 'long') {
    eligibleGolfers = await db
      .select()
      .from(golfers)
      .where(and(eq(golfers.type, 'field'))); // field players #21-#125
  } else {
    eligibleGolfers = await db
      .select()
      .from(golfers)
      .where(eq(golfers.type, 'top20')); // top 20 players
  }

  // 4. Fetch Picks already made in this draft session
  const picks = await db
    .select({
      id: draftPicks.id,
      userId: draftPicks.userId,
      golferId: draftPicks.golferId,
      round: draftPicks.round,
      pickNumber: draftPicks.pickNumber,
      golferName: golfers.name,
      golferRank: golfers.rank,
      userName: users.name,
      userTeamName: users.teamName,
    })
    .from(draftPicks)
    .innerJoin(golfers, eq(draftPicks.golferId, golfers.id))
    .innerJoin(users, eq(draftPicks.userId, users.id))
    .where(eq(draftPicks.draftId, draftId))
    .orderBy(draftPicks.pickNumber);

  // 5. Exclude already drafted golfers from available listing
  const draftedGolferIds = picks.map((p) => p.golferId);
  const availableGolfers = eligibleGolfers
    .filter((g) => !draftedGolferIds.includes(g.id))
    .sort((a, b) => a.rank - b.rank);

  // 6. User's specific picks in this session
  const myPicks = picks.filter((p) => p.userId === userId);

  return (
    <DraftRoom
      draft={draft}
      users={allUsers}
      availableGolfers={availableGolfers}
      picks={picks}
      myPicks={myPicks}
      userId={userId}
    />
  );
}
