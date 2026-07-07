import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ne } from 'drizzle-orm';

export default async function OpposingTeamsRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);

  // Fetch the first opponent in the league to redirect to
  const [firstOpponent] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(ne(users.id, userId))
    .limit(1);

  if (firstOpponent) {
    redirect(`/opposing-teams/${firstOpponent.id}`);
  } else {
    redirect('/my-team');
  }
}
