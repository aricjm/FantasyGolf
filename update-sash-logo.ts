import { db } from './src/db';
import { users } from './src/db/schema';
import { eq, or, ilike } from 'drizzle-orm';

async function updateLogos() {
  try {
    const result = await db
      .update(users)
      .set({ logoUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=100&auto=format&fit=crop&q=60' })
      .where(
        or(
          ilike(users.teamAbbr, 'SASH'),
          ilike(users.name, '%sash%'),
          ilike(users.teamName, '%sash%')
        )
      )
      .returning();
      
    console.log('Updated users:', result.map(u => u.name));
  } catch (error) {
    console.error('Failed to update:', error);
  }
}

updateLogos();
