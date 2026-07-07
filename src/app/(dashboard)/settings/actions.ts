'use server';

import { db } from '@/db';
import { users, draftPicks, draftStates, rosters, lineups, majorSelections, tradeItems, trades, transactions, scores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function adminUpdateTeamDetails(formData: FormData) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === 'admin';
  if (!isAdmin) throw new Error('Unauthenticated or Unauthorized');

  const targetUserId = parseInt(formData.get('userId') as string, 10);
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const teamName = formData.get('teamName') as string;
  const teamAbbr = formData.get('teamAbbr') as string;
  const logoUrl = formData.get('logoUrl') as string;

  if (!targetUserId || !name || !email) {
    return { error: 'Manager name and email are required' };
  }

  if (teamAbbr && teamAbbr.length > 4) {
    return { error: 'Abbreviation must be 4 characters or less' };
  }

  await db
    .update(users)
    .set({
      name,
      email,
      teamName: teamName || null,
      teamAbbr: teamAbbr ? teamAbbr.toUpperCase() : null,
      logoUrl: logoUrl || null,
    })
    .where(eq(users.id, targetUserId));

  revalidatePath('/settings');
  return { success: true };
}

export async function resetAllDraftsAndTeams(clearTeamProfiles: boolean) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === 'admin';
  if (!isAdmin) throw new Error('Unauthenticated or Unauthorized');

  try {
    await db.transaction(async (tx) => {
      // 1. Delete trade items (depends on trades)
      await tx.delete(tradeItems);
      
      // 2. Delete trades
      await tx.delete(trades);
      
      // 3. Delete transactions
      await tx.delete(transactions);

      // 4. Delete lineups
      await tx.delete(lineups);

      // 5. Delete rosters
      await tx.delete(rosters);

      // 6. Delete draft picks
      await tx.delete(draftPicks);

      // 7. Delete draft states
      await tx.delete(draftStates);

      // 8. Delete major selections
      await tx.delete(majorSelections);

      // 9. Delete scores
      await tx.delete(scores);

      // 10. Reset team details in users table if selected
      if (clearTeamProfiles) {
        await tx.update(users).set({
          teamName: null,
          teamAbbr: null,
          logoUrl: null,
        });
      }
    });

    revalidatePath('/settings');
    revalidatePath('/my-team');
    revalidatePath('/drafts');
    revalidatePath('/standings');
    revalidatePath('/recaps');
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return { error: error.message || 'An unexpected database error occurred' };
  }
}
