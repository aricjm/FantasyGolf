'use server';

import { db } from '@/db';
import { majorSelections, tournaments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function saveMajorSelections(
  tournamentId: string,
  t1Id: number,
  t2Id: number,
  t3Id: number,
  t4Id: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);

  // 1. Verify tournament exists and is not locked
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) {
    return { error: 'Tournament not found' };
  }

  if (tournament.status !== 'pending' && new Date() > new Date(tournament.startDate)) {
    return { error: 'Selections are locked. The tournament has already started.' };
  }

  // 2. Insert or update selections
  const [existingSelection] = await db
    .select()
    .from(majorSelections)
    .where(and(eq(majorSelections.userId, userId), eq(majorSelections.tournamentId, tournamentId)))
    .limit(1);

  if (existingSelection) {
    await db
      .update(majorSelections)
      .set({
        tier1GolferId: t1Id,
        tier2GolferId: t2Id,
        tier3GolferId: t3Id,
        tier4GolferId: t4Id,
      })
      .where(eq(majorSelections.id, existingSelection.id));
  } else {
    await db.insert(majorSelections).values({
      userId,
      tournamentId,
      tier1GolferId: t1Id,
      tier2GolferId: t2Id,
      tier3GolferId: t3Id,
      tier4GolferId: t4Id,
    });
  }

  revalidatePath('/majors');
  return { success: true };
}
