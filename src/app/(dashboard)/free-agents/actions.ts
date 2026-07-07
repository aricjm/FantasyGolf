'use server';

import { db } from '@/db';
import { rosters, golfers, transactions, tournaments } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function claimFreeAgent(golferToAddId: number, golferToDropId: number | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);

  // 1. Verify golfer to add exists and is a free agent
  const [golferToAdd] = await db
    .select()
    .from(golfers)
    .where(eq(golfers.id, golferToAddId))
    .limit(1);

  if (!golferToAdd) {
    return { error: 'Selected free agent golfer not found' };
  }

  const existingRosters = await db.select().from(rosters);
  const isAlreadyClaimed = existingRosters.some((r) => r.golferId === golferToAddId);
  if (isAlreadyClaimed) {
    return { error: 'Golfer has already been claimed by another team' };
  }

  // 2. Fetch User's current roster
  const myRoster = existingRosters.filter((r) => r.userId === userId);

  // Roster size limit is 10.
  // Note: Roster size = 8 permanent + 2 weekly top-20 short draft golfers.
  // In Free Agency, users can only add/drop permanent field golfers (#26-#125). They cannot pick up top-20 golfers as free agents (top-20 golfers are exclusively drafted in weekly short drafts).
  if (golferToAdd.type === 'top20') {
    return { error: 'Ranks 1–25 golfers cannot be claimed in Free Agency. They must be drafted in weekly short drafts.' };
  }

  // Check if we need to drop
  if (myRoster.length >= 10 && !golferToDropId) {
    return { error: 'Roster limit reached. You must select a player to drop to claim a free agent.' };
  }

  // 3. Verify drop golfer details
  if (golferToDropId) {
    const isOwner = myRoster.some((r) => r.golferId === golferToDropId);
    if (!isOwner) {
      return { error: 'You do not own the golfer selected to drop' };
    }

    const [golferToDrop] = await db
      .select()
      .from(golfers)
      .where(eq(golfers.id, golferToDropId))
      .limit(1);

    // You can never drop a rank 1-25 golfer (weekly short draft tier)
    if (golferToDrop.type === 'top20' || golferToDrop.rank <= 25) {
      return { error: 'Invalid Drop: You cannot drop a top 25 world-ranked golfer as a free agent.' };
    }

    // Execute drop
    await db
      .delete(rosters)
      .where(and(eq(rosters.userId, userId), eq(rosters.golferId, golferToDropId)));
  }

  // 4. Execute add
  await db.insert(rosters).values({
    userId,
    golferId: golferToAddId,
    acquiredVia: 'free_agency',
  });

  // 5. Log transaction
  // Find active tournament
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

  await db.insert(transactions).values({
    userId,
    golferAddedId: golferToAddId,
    golferDroppedId: golferToDropId || null,
    type: 'free_agency',
    tournamentId: activeTournament?.id || null,
  });

  revalidatePath('/free-agents');
  revalidatePath('/my-team');
  return { success: true };
}
