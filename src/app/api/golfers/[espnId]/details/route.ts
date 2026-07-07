import { NextResponse } from 'next/server';
import { db } from '@/db';
import { golfers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ espnId: string }> }) {
  const { espnId } = await params;
  
  if (!espnId) {
    return NextResponse.json({ error: 'Missing espnId' }, { status: 400 });
  }

  try {
    // 1. Fetch Core Athlete Data (age, country, basic status)
    const coreRes = await fetch(`https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/athletes/${espnId}`, { next: { revalidate: 3600 } });
    const coreData = coreRes.ok ? await coreRes.json() : null;

    // 2. Fetch News and filter for this athlete
    const newsRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/golf/pga/news`, { next: { revalidate: 900 } });
    const newsData = newsRes.ok ? await newsRes.json() : null;

    let latestNews = null;
    if (newsData && newsData.articles) {
      const athleteNews = newsData.articles.find((a: any) => 
        a.categories?.some((c: any) => c.athleteId === parseInt(espnId, 10))
      );
      if (athleteNews) {
        latestNews = {
          headline: athleteNews.headline,
          description: athleteNews.description,
          published: athleteNews.published
        };
      }
    }

    // 3. Process Injury/Status
    let injuryStatus = 'Active';
    let injuryDetails = null;

    if (coreData) {
      // If ESPN formally lists an injury ref, we could fetch it here:
      if (coreData.injuries && coreData.injuries.$ref) {
        try {
          const injRes = await fetch(coreData.injuries.$ref, { next: { revalidate: 3600 } });
          const injData = injRes.ok ? await injRes.json() : null;
          if (injData && injData.status) {
            injuryStatus = injData.status;
            injuryDetails = injData.details || 'No further details provided.';
          }
        } catch (e) {
          console.error('Failed to fetch injury ref', e);
        }
      } else if (coreData.status && coreData.status.name !== 'Active') {
        injuryStatus = coreData.status.name;
      }
    }

    // 4. Fetch Historical Results from DB
    let historicalResults: any[] = [];
    try {
      const golferRecord = await db.select({ historicalResults: golfers.historicalResults }).from(golfers).where(eq(golfers.espnId, espnId)).limit(1);
      if (golferRecord.length > 0 && golferRecord[0].historicalResults) {
        historicalResults = golferRecord[0].historicalResults as any[];
      }
    } catch (e) {
      console.error('Failed to fetch historical results from DB', e);
    }

    return NextResponse.json({
      age: coreData?.age || null,
      country: coreData?.birthPlace?.country || null,
      injury: {
        status: injuryStatus,
        details: injuryDetails
      },
      news: latestNews,
      historicalResults
    });

  } catch (error) {
    console.error('Error fetching golfer details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
