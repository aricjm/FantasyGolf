export interface GolferScore {
  athleteId: number;
  name: string;
  score: string;      // e.g., '-5', 'E', '+2'
  strokes: number;
  madeCut: boolean;
  rank: number;
  holePoints: number;     // Points from hole-by-hole scoring
  placingPoints: number;  // Points from final rank
  totalPoints: number;    // holePoints + placingPoints
  today: string;      // e.g., '-2'
  thru: string;       // e.g., '14', 'F'
}

export interface TournamentStatus {
  eventId: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  completed: boolean;
  round: number;
  golfers: GolferScore[];
}

export function parseEventScoreboard(event: any): TournamentStatus | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const completed = event.status?.type?.completed || false;
  const state = event.status?.type?.state || 'pre';
  
  let status: 'pending' | 'active' | 'completed' = 'pending';
  if (completed) {
    status = 'completed';
  } else if (state === 'in') {
    status = 'active';
  }

  const round = event.status?.period || 1;
  const competitors = competition.competitors || [];

  let maxStandardRound = 0;
  competitors.forEach((c: any) => {
    c.linescores?.forEach((ls: any) => {
       if (ls.period <= 4 && ls.period > maxStandardRound) {
         maxStandardRound = ls.period;
       }
    });
  });

  const parsedGolfers = competitors.map((comp: any) => {
    const athleteId = parseInt(comp.id, 10);
    const name = comp.athlete?.displayName || 'Unknown Golfer';
    const scoreStr = comp.score || 'E';
    
    let strokes = 0;
    const linescoresArray = comp.linescores || [];
    linescoresArray.forEach((ls: any) => {
      strokes += ls.value || 0;
    });

    const statusDisp = comp.status?.displayValue || '';
    let madeCut = !statusDisp.toUpperCase().includes('CUT') && statusDisp.toUpperCase() !== 'WD' && statusDisp.toUpperCase() !== 'DQ';

    // Fallback for historical events where ESPN drops the status object
    if (!comp.status && maxStandardRound > 2) {
       let roundsPlayed = 0;
       linescoresArray.forEach((ls: any) => {
          if (ls.period <= 4) roundsPlayed++;
       });
       if (roundsPlayed < maxStandardRound) {
         madeCut = false;
       }
    }

    let holePoints = 0;
    linescoresArray.forEach((ls: any) => {
      const roundLinescores = ls.linescores || [];
      roundLinescores.forEach((hole: any) => {
        const holeVal = hole.value || 0;
        const displayVal = hole.scoreType?.displayValue;
        
        if (holeVal === 1) {
          holePoints += 12;
          return;
        }

        if (!displayVal) return;

        const rel = displayVal.toUpperCase();
        if (rel === 'E' || rel === '0' || rel === 'E') {
          holePoints += 1;
        } else if (rel.startsWith('-')) {
          const diff = parseInt(rel, 10);
          if (diff <= -3) {
            holePoints += 20;
          } else if (diff === -2) {
            holePoints += 10;
          } else if (diff === -1) {
            holePoints += 4;
          }
        } else if (rel.startsWith('+')) {
          const diff = parseInt(rel, 10);
          if (diff === 1) {
            holePoints += -4;
          } else if (diff === 2) {
            holePoints += -8;
          } else if (diff >= 3) {
            holePoints += -12;
          }
        }
      });
    });

    return {
      athleteId,
      name,
      score: scoreStr,
      strokes,
      madeCut,
      holePoints,
      today: comp.today || '',
      thru: comp.thru || '',
      rawOrder: comp.order || 0
    };
  });

  const sortedGolfers = [...parsedGolfers].sort((a, b) => a.rawOrder - b.rawOrder);

  let currentRank = 1;
  const golfersWithRank = sortedGolfers.map((g, idx, arr) => {
    if (idx > 0 && g.score !== arr[idx - 1].score) {
      currentRank = idx + 1;
    }
    
    const rank = g.madeCut ? currentRank : 999;
    
    let placingPoints = 0;
    if (g.madeCut) {
      if (rank === 1) placingPoints = 30;
      else if (rank === 2) placingPoints = 28;
      else if (rank === 3) placingPoints = 26;
      else if (rank === 4) placingPoints = 24;
      else if (rank === 5) placingPoints = 22;
      else if (rank === 6) placingPoints = 20;
      else if (rank === 7) placingPoints = 18;
      else if (rank === 8) placingPoints = 16;
      else if (rank === 9) placingPoints = 14;
      else if (rank === 10) placingPoints = 12;
      else if (rank <= 15) placingPoints = 10;
      else if (rank <= 20) placingPoints = 8;
      else if (rank <= 25) placingPoints = 6;
      else if (rank <= 30) placingPoints = 4;
      else placingPoints = 2;
    }

    return {
      athleteId: g.athleteId,
      name: g.name,
      score: g.score,
      strokes: g.strokes,
      madeCut: g.madeCut,
      rank,
      holePoints: g.holePoints,
      placingPoints,
      totalPoints: g.holePoints + placingPoints,
      today: g.today,
      thru: g.thru
    };
  });

  return {
    eventId: event.id,
    name: event.name || 'PGA Tournament',
    status,
    completed,
    round,
    golfers: golfersWithRank
  };
}

export async function fetchLiveScoreboard(eventId?: string): Promise<TournamentStatus | null> {
  try {
    const url = eventId
      ? `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?event=${eventId}`
      : `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ESPN API returned status ${res.status}`);

    const data = await res.json();
    const event = data.events?.[0];
    if (!event) return null;

    return parseEventScoreboard(event);
  } catch (error) {
    console.error('Error fetching ESPN scoreboard:', error);
    return null;
  }
}

function normalizeString(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Fetches the historical results for a specific tournament name and year.
 * Returns a map of normalized golfer name -> { rank: string, points: number }
 */
export async function getHistoricalTournamentResults(tournamentName: string, year: number): Promise<Record<string, {rank: string, points: number}>> {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=${year}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    
    const normSearch = normalizeString(tournamentName);
    const event = data.events?.find((e: any) => {
      const normEvt = normalizeString(e.name);
      return normEvt.includes(normSearch) || normSearch.includes(normEvt);
    });

    if (!event) return {};

    const scoreboard = parseEventScoreboard(event);
    if (!scoreboard || !scoreboard.golfers) return {};

    const results: Record<string, {rank: string, points: number}> = {};
    scoreboard.golfers.forEach(g => {
      const normName = normalizeString(g.name);
      const rankStr = (!g.madeCut || g.rank > 300) ? 'CUT' : getOrdinal(g.rank);
      results[normName] = {
        rank: rankStr,
        points: g.totalPoints
      };
    });

    return results;
  } catch (err) {
    console.error(`Failed to fetch historical results for ${tournamentName} ${year}:`, err);
    return {};
  }
}
