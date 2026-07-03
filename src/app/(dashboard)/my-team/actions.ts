'use server';

import { db } from '@/db';
import { users, rosters, lineups, trades, tradeItems, tournaments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function updateTeamDetails(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);
  const teamName = formData.get('teamName') as string;
  const teamAbbr = formData.get('teamAbbr') as string;
  const logoUrl = formData.get('logoUrl') as string;

  if (!teamName || !teamAbbr) {
    return { error: 'Team name and abbreviation are required' };
  }

  if (teamAbbr.length > 4) {
    return { error: 'Abbreviation must be 4 characters or less' };
  }

  await db
    .update(users)
    .set({
      teamName,
      teamAbbr: teamAbbr.toUpperCase(),
      logoUrl: logoUrl || null,
    })
    .where(eq(users.id, userId));

  revalidatePath('/my-team');
  return { success: true };
}

export async function toggleLineupGolfer(golferId: number, tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);

  // 1. Verify tournament hasn't started yet
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) {
    return { error: 'Tournament not found' };
  }

  if (tournament.status !== 'pending' && new Date() > new Date(tournament.startDate)) {
    return { error: 'Lineups are locked. The tournament has already started.' };
  }

  // 2. Fetch existing lineup
  const existingLineup = await db
    .select()
    .from(lineups)
    .where(and(eq(lineups.userId, userId), eq(lineups.tournamentId, tournamentId)));

  const isCurrentStarter = existingLineup.some((l) => l.golferId === golferId && l.isActive);
  const activeCount = existingLineup.filter((l) => l.isActive).length;

  if (!isCurrentStarter && activeCount >= 6) {
    return { error: 'Roster limit reached. You can only start 6 golfers. Please bench a golfer first.' };
  }

  // 3. Perform toggle
  // Check if record exists
  const existingRecord = existingLineup.find((l) => l.golferId === golferId);
  if (existingRecord) {
    await db
      .update(lineups)
      .set({ isActive: !existingRecord.isActive })
      .where(eq(lineups.id, existingRecord.id));
  } else {
    await db.insert(lineups).values({
      userId,
      tournamentId,
      golferId,
      isActive: true,
    });
  }

  revalidatePath('/my-team');
  return { success: true };
}

export async function handleTradeProposal(tradeId: number, action: 'accept' | 'decline') {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);

  // 1. Fetch trade proposal
  const [trade] = await db
    .select()
    .from(trades)
    .where(eq(trades.id, tradeId))
    .limit(1);

  if (!trade) {
    return { error: 'Trade proposal not found' };
  }

  if (trade.receiverId !== userId) {
    return { error: 'Unauthorized trade action' };
  }

  if (trade.status !== 'pending') {
    return { error: 'Trade is no longer pending' };
  }

  if (action === 'decline') {
    await db
      .update(trades)
      .set({ status: 'declined', updatedAt: new Date() })
      .where(eq(trades.id, tradeId));

    revalidatePath('/my-team');
    return { success: true };
  }

  // Action is accept - Execute transaction
  try {
    // Fetch trade items
    const items = await db
      .select()
      .from(tradeItems)
      .where(eq(tradeItems.tradeId, tradeId));

    const senderId = trade.senderId;
    const receiverId = trade.receiverId;

    // Separate items by direction
    const golfersToReceiver = items.filter((i) => i.direction === 'send').map((i) => i.golferId);
    const golfersToSender = items.filter((i) => i.direction === 'receive').map((i) => i.golferId);

    // Verify rosters still contain these players
    const senderRoster = await db
      .select()
      .from(rosters)
      .where(eq(rosters.userId, senderId));
      
    const receiverRoster = await db
      .select()
      .from(rosters)
      .where(eq(rosters.userId, receiverId));

    const senderGolferIds = senderRoster.map((r) => r.golferId);
    const receiverGolferIds = receiverRoster.map((r) => r.golferId);

    const senderValid = golfersToReceiver.every((id) => senderGolferIds.includes(id));
    const receiverValid = golfersToSender.every((id) => receiverGolferIds.includes(id));

    if (!senderValid || !receiverValid) {
      return { error: 'One or more players in the trade are no longer on the respective team rosters.' };
    }

    // Execute swap in rosters
    // Remove from sender, add to receiver
    for (const golferId of golfersToReceiver) {
      await db
        .delete(rosters)
        .where(and(eq(rosters.userId, senderId), eq(rosters.golferId, golferId)));
        
      await db.insert(rosters).values({
        userId: receiverId,
        golferId,
        acquiredVia: 'trade',
      });
    }

    // Remove from receiver, add to sender
    for (const golferId of golfersToSender) {
      await db
        .delete(rosters)
        .where(and(eq(rosters.userId, receiverId), eq(rosters.golferId, golferId)));
        
      await db.insert(rosters).values({
        userId: senderId,
        golferId,
        acquiredVia: 'trade',
      });
    }

    // Update trade status
    await db
      .update(trades)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(trades.id, tradeId));

    revalidatePath('/my-team');
    return { success: true };
  } catch (error: any) {
    console.error('Failed executing trade transaction:', error);
    return { error: 'Failed executing trade transaction. Please try again.' };
  }
}
