'use server';

import { db } from '@/db';
import { draftStates, draftPicks, rosters, golfers, tournaments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function draftGolfer(draftId: number, golferId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);

  // 1. Fetch Draft State
  const [draft] = await db
    .select()
    .from(draftStates)
    .where(eq(draftStates.id, draftId))
    .limit(1);

  if (!draft) {
    return { error: 'Draft session not found' };
  }

  if (draft.status === 'completed') {
    return { error: 'Draft is already completed' };
  }

  // Parse snake order and pick parameters
  const pickOrder: number[] = JSON.parse(draft.pickOrder);
  const currentRound = draft.currentRound;
  const currentPick = draft.currentPick; // 1-based index overall

  // Determine total picks: Long Draft = 80 picks, Short Draft = 20 picks
  const maxRounds = draft.type === 'long' ? 8 : 2;
  const totalPicksExpected = maxRounds * 10;

  if (currentPick > totalPicksExpected) {
    return { error: 'Draft has already concluded' };
  }

  // 2. Calculate whose turn it is
  // Round number is 1-based.
  // Within a round, pick offset (0-9)
  const roundPickIndex = (currentPick - 1) % 10;
  const isEvenRound = currentRound % 2 === 0;

  // Determine active picker ID
  // Snake logic: even rounds reverse the order
  const activePickerIndex = isEvenRound ? 9 - roundPickIndex : roundPickIndex;
  const activePickerId = pickOrder[activePickerIndex];

  const isAdmin = (session.user as any)?.role === 'admin';
  if (activePickerId !== userId && !isAdmin) {
    return { error: 'It is not your turn to draft' };
  }

  // 3. Verify golfer is still available
  const existingPicks = await db
    .select()
    .from(draftPicks)
    .where(eq(draftPicks.draftId, draftId));

  const isAlreadyDrafted = existingPicks.some((p) => p.golferId === golferId);
  if (isAlreadyDrafted) {
    return { error: 'Golfer has already been drafted' };
  }

  // 4. Verify golfer fits rank constraints
  const [golfer] = await db
    .select()
    .from(golfers)
    .where(eq(golfers.id, golferId))
    .limit(1);

  if (!golfer) {
    return { error: 'Selected golfer not found' };
  }

  if (draft.type === 'long') {
    // Rank 26 to 125
    if (golfer.rank < 26 || golfer.rank > 125) {
      return { error: 'Invalid pick: Preseason draft only allows golfers ranked #26 to #125.' };
    }
  } else {
    // Rank 1 to 25
    if (golfer.rank > 25) {
      return { error: 'Invalid pick: Weekly short draft only allows top 25 ranked golfers.' };
    }
  }

  // 5. Insert Draft Pick record
  await db.insert(draftPicks).values({
    draftId,
    userId: activePickerId, // Always use activePickerId in case an admin is drafting on their behalf
    golferId,
    round: currentRound,
    pickNumber: currentPick,
  });

  // 6. Add golfer to User's Roster
  await db.insert(rosters).values({
    userId: activePickerId,
    golferId,
    acquiredVia: draft.type === 'long' ? 'long_draft' : 'short_draft',
    tournamentId: draft.type === 'short' ? draft.tournamentId : null, // Weekly short draft players clear after tournament
  });

  // 7. Calculate next pick / round
  const nextPick = currentPick + 1;
  let nextRound = currentRound;
  let nextStatus = draft.status;

  if (nextPick > totalPicksExpected) {
    nextStatus = 'completed';
  } else {
    // Round increases after every 10 picks
    nextRound = Math.ceil(nextPick / 10);
  }

  // Update draft state
  await db
    .update(draftStates)
    .set({
      currentPick: nextPick,
      currentRound: nextRound,
      status: nextStatus,
    })
    .where(eq(draftStates.id, draftId));

  revalidatePath(`/drafts/${draftId}`);
  return { success: true };
}
