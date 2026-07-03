'use server';

import { db } from '@/db';
import { trades, tradeItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function proposeTradeAction(
  receiverId: number,
  sendGolferIds: number[],
  receiveGolferIds: number[],
  counterTradeId?: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');

  const userId = parseInt(session.user.id, 10);

  if (userId === receiverId) {
    return { error: 'You cannot trade with yourself.' };
  }

  if (sendGolferIds.length === 0 || receiveGolferIds.length === 0) {
    return { error: 'Please select at least one player from each team to trade.' };
  }

  try {
    // 1. Insert trade proposal record
    const [newTrade] = await db
      .insert(trades)
      .values({
        senderId: userId,
        receiverId,
        status: 'pending',
      })
      .returning({ id: trades.id });

    // 2. Insert trade items
    // Direction 'send' = from sender (us) to receiver (opponent)
    for (const golferId of sendGolferIds) {
      await db.insert(tradeItems).values({
        tradeId: newTrade.id,
        golferId,
        direction: 'send',
      });
    }

    // Direction 'receive' = from receiver (opponent) to sender (us)
    for (const golferId of receiveGolferIds) {
      await db.insert(tradeItems).values({
        tradeId: newTrade.id,
        golferId,
        direction: 'receive',
      });
    }

    // 3. If this was a counter-offer, update the original trade status to 'countered'
    if (counterTradeId) {
      await db
        .update(trades)
        .set({ status: 'countered', updatedAt: new Date() })
        .where(eq(trades.id, counterTradeId));
    }

    revalidatePath('/my-team');
    revalidatePath('/opposing-teams');
    return { success: true };
  } catch (error: any) {
    console.error('Proposing trade failed:', error);
    return { error: 'Failed to propose trade. Please try again.' };
  }
}
