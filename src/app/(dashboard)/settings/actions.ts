'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
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
