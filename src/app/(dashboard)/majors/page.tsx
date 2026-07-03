import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { tournaments, majorSelections, golfers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import MajorsTierSelector from './MajorsTierSelector';

export default async function MajorsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id, 10);

  // 1. Fetch the 4 major tournaments
  const majorsList = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.type, 'major'))
    .orderBy(tournaments.startDate);

  // 2. Fetch all golfers to construct the tier dropdown arrays
  const allGolfers = await db.select().from(golfers);

  // Tiers definition based on IDs (or names)
  const tier1Ids = [1, 2]; // Scheffler, McIlroy
  const tier2Ids = [3, 4, 5, 6, 7, 8, 9]; // Young, Fitzpatrick, Henley, Morikawa, Fleetwood, Rose, Clark
  const tier3Ids = [10, 211, 11, 12, 13]; // Spaun, Rahm (LIV), Hovland, Schauffele, Gotterup
  const tier4Ids = [14, 15, 16, 17, 18, 19, 221, 20]; // Burns, Griffin, Thomas, Rai, Aberg, MacIntyre, Hatton (LIV), Si Woo Kim

  const tier1Golfers = allGolfers.filter((g) => tier1Ids.includes(g.id)).sort((a, b) => a.rank - b.rank);
  const tier2Golfers = allGolfers.filter((g) => tier2Ids.includes(g.id)).sort((a, b) => a.rank - b.rank);
  const tier3Golfers = allGolfers.filter((g) => tier3Ids.includes(g.id)).sort((a, b) => a.rank - b.rank);
  const tier4Golfers = allGolfers.filter((g) => tier4Ids.includes(g.id)).sort((a, b) => a.rank - b.rank);

  // 3. Fetch user's existing selections for all majors
  const selections = await db
    .select()
    .from(majorSelections)
    .where(eq(majorSelections.userId, userId));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Major Tournaments</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Select one golfer from each tier for the 4 Majors. Selections lock at tournament start.
        </p>
      </div>

      <MajorsTierSelector
        majors={majorsList}
        selections={selections}
        tier1={tier1Golfers}
        tier2={tier2Golfers}
        tier3={tier3Golfers}
        tier4={tier4Golfers}
      />
    </div>
  );
}
