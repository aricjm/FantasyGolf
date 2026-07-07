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
  let nextStatus = draft.status === 'pending' ? 'active' : draft.status;

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
      lastActionAt: new Date(),
    })
    .where(eq(draftStates.id, draftId));

  revalidatePath(`/drafts/${draftId}`);
  return { success: true };
}

export async function setDraftStartTime(draftId: number, startTime: string) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  try {
    const date = new Date(startTime);
    await db
      .update(draftStates)
      .set({ startTime: date })
      .where(eq(draftStates.id, draftId));
      
    revalidatePath(`/drafts/${draftId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to set start time:', error);
    return { error: 'Failed to set start time' };
  }
}

export async function toggleDraftPause(draftId: number, currentStatus: string) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  try {
    const newStatus = currentStatus === 'paused' ? 'active' : currentStatus === 'pending' ? 'active' : 'paused';
    
    const updates: any = { status: newStatus };
    if (newStatus === 'active') {
      updates.lastActionAt = new Date();
      if (currentStatus === 'pending') {
        updates.startTime = new Date();
      }
    }
    
    await db
      .update(draftStates)
      .set(updates)
      .where(eq(draftStates.id, draftId));
      
    revalidatePath(`/drafts/${draftId}`);
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Failed to toggle pause:', error);
    return { error: 'Failed to toggle pause state' };
  }
}

export async function resetDraft(draftId: number) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  try {
    const [draft] = await db
      .select()
      .from(draftStates)
      .where(eq(draftStates.id, draftId))
      .limit(1);

    if (!draft) return { error: 'Draft not found' };

    // Delete all draft picks for this draft
    await db.delete(draftPicks).where(eq(draftPicks.draftId, draftId));

    // Delete corresponding rosters
    if (draft.type === 'long') {
      await db.delete(rosters).where(eq(rosters.acquiredVia, 'long_draft'));
    } else if (draft.tournamentId) {
      await db
        .delete(rosters)
        .where(
          and(
            eq(rosters.acquiredVia, 'short_draft'),
            eq(rosters.tournamentId, draft.tournamentId)
          )
        );
    }

    // Reset draft state
    await db
      .update(draftStates)
      .set({
        status: 'pending',
        currentRound: 1,
        currentPick: 1,
        startTime: null,
        lastActionAt: null,
        autoDraftUsers: '[]',
      })
      .where(eq(draftStates.id, draftId));

    revalidatePath(`/drafts/${draftId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to reset draft:', error);
    return { error: 'Failed to reset draft' };
  }
}

export async function autoDraftGolfer(draftId: number) {
  try {
    const [draft] = await db
      .select()
      .from(draftStates)
      .where(eq(draftStates.id, draftId))
      .limit(1);

    if (!draft) return { error: 'Draft not found' };
    if (draft.status === 'completed' || draft.status === 'paused') return { error: 'Draft is not active' };

    // Verify time actually expired (give a few seconds grace period for network latency)
    const now = new Date().getTime();
    const baseTime = draft.lastActionAt 
      ? new Date(draft.lastActionAt).getTime()
      : (draft.startTime ? new Date(draft.startTime).getTime() : new Date(draft.createdAt).getTime());
    
    const pickOrder: number[] = JSON.parse(draft.pickOrder);
    const maxRounds = draft.type === 'long' ? 8 : 2;
    const totalPicksExpected = maxRounds * 10;
    const currentPick = draft.currentPick;
    const currentRound = draft.currentRound;

    if (currentPick > totalPicksExpected) return { error: 'Draft concluded' };

    const roundPickIndex = (currentPick - 1) % 10;
    const isEvenRound = currentRound % 2 === 0;
    const activePickerIndex = isEvenRound ? 9 - roundPickIndex : roundPickIndex;
    const activePickerId = pickOrder[activePickerIndex];

    let autoDraftUsers: number[] = [];
    try {
      autoDraftUsers = JSON.parse(draft.autoDraftUsers);
    } catch(e) {}
    
    const isUserOnAutoDraft = autoDraftUsers.includes(activePickerId);

    const diffInSeconds = Math.floor((now - baseTime) / 1000);
    if (!isUserOnAutoDraft && diffInSeconds < 58) {
      return { error: 'Timer has not expired yet' };
    }

    // (Pick variables already derived above)

    const existingPicks = await db.select().from(draftPicks).where(eq(draftPicks.draftId, draftId));
    const draftedGolferIds = existingPicks.map(p => p.golferId);

    // Find highest ranked available golfer
    const { inArray, notInArray, gte, lte } = await import('drizzle-orm');
    
    let rankCondition;
    if (draft.type === 'long') {
      rankCondition = and(gte(golfers.rank, 26), lte(golfers.rank, 125));
    } else {
      rankCondition = lte(golfers.rank, 25);
    }

    const [topGolfer] = await db
      .select()
      .from(golfers)
      .where(
        and(
          rankCondition,
          draftedGolferIds.length > 0 ? notInArray(golfers.id, draftedGolferIds) : undefined
        )
      )
      .orderBy(golfers.rank)
      .limit(1);

    if (!topGolfer) return { error: 'No golfers available' };

    // Insert Draft Pick
    await db.insert(draftPicks).values({
      draftId,
      userId: activePickerId,
      golferId: topGolfer.id,
      round: currentRound,
      pickNumber: currentPick,
    });

    // Add to Roster
    await db.insert(rosters).values({
      userId: activePickerId,
      golferId: topGolfer.id,
      acquiredVia: draft.type === 'long' ? 'long_draft' : 'short_draft',
      tournamentId: draft.type === 'short' ? draft.tournamentId : null,
    });

    // Advance turn
    const nextPick = currentPick + 1;
    let nextRound = currentRound;
    let nextStatus = draft.status === 'pending' ? 'active' : draft.status;

    if (nextPick > totalPicksExpected) {
      nextStatus = 'completed';
    } else {
      nextRound = Math.ceil(nextPick / 10);
    }

    if (!autoDraftUsers.includes(activePickerId)) {
      autoDraftUsers.push(activePickerId);
    }

    await db
      .update(draftStates)
      .set({
        currentPick: nextPick,
        currentRound: nextRound,
        status: nextStatus,
        lastActionAt: new Date(),
        autoDraftUsers: JSON.stringify(autoDraftUsers),
      })
      .where(eq(draftStates.id, draftId));

    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/drafts/${draftId}`);
    return { success: true };
  } catch (error) {
    console.error('Auto draft error:', error);
    return { error: 'Failed auto draft' };
  }
}

export async function toggleAutoDraft(draftId: number, targetUserId: number, isEnabled: boolean) {
  const session = await auth();
  const currentUserId = (session?.user as any)?.id;
  const isAdmin = (session?.user as any)?.role === 'admin';
  
  if (!currentUserId || (Number(currentUserId) !== targetUserId && !isAdmin)) {
    return { error: 'Unauthorized' };
  }

  try {
    const [draft] = await db
      .select()
      .from(draftStates)
      .where(eq(draftStates.id, draftId))
      .limit(1);

    if (!draft) return { error: 'Draft not found' };

    let autoDraftUsers: number[] = [];
    try {
      autoDraftUsers = JSON.parse(draft.autoDraftUsers);
    } catch(e) {}

    if (isEnabled) {
      if (!autoDraftUsers.includes(targetUserId)) {
        autoDraftUsers.push(targetUserId);
      }
    } else {
      autoDraftUsers = autoDraftUsers.filter(id => id !== targetUserId);
    }

    await db
      .update(draftStates)
      .set({ autoDraftUsers: JSON.stringify(autoDraftUsers) })
      .where(eq(draftStates.id, draftId));

    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/drafts/${draftId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle auto draft:', error);
    return { error: 'Failed to toggle auto draft' };
  }
}
