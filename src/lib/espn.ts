export interface GolferScore {
  athleteId: number;
  name: string;
  score: string;
  strokes: number;
  madeCut: boolean;
  rank: number;
  holePoints: number;
  placingPoints: number;
  totalPoints: number;
  today?: string;
  thru?: string;
}

export interface TournamentStatus {
  eventId: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  completed: boolean;
  round: number;
  golfers: GolferScore[];
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

    // 1. Group competitors by score to calculate ranks (handling ties)
    // First parse competitors into usable objects
    const parsedGolfers = competitors.map((comp: any) => {
      const athleteId = parseInt(comp.id, 10);
      const name = comp.athlete?.displayName || 'Unknown Golfer';
      const scoreStr = comp.score || 'E';
      
      // Parse strokes
      let strokes = 0;
      if (scoreStr === 'E') {
        strokes = 0;
      } else {
        const val = parseInt(scoreStr.replace('+', ''), 10);
        strokes = isNaN(val) ? 0 : val;
      }

      // Check if they made the cut
      // In ESPN's completed tournament, MC players will have only 2 rounds of linescores
      // with positive values.
      const linescores = comp.linescores || [];
      const playedRoundsCount = linescores.filter((l: any) => l.value > 0).length;
      
      // If completed and played < 3 rounds, they missed the cut.
      // If in progress and round is 3 or 4, and played < 3 rounds, they missed the cut.
      let madeCut = true;
      if (completed && playedRoundsCount < 3) {
        madeCut = false;
      } else if (round >= 3 && playedRoundsCount < 3 && state === 'in') {
        madeCut = false;
      }

      // Calculate hole-by-hole points (Option A)
      let holePoints = 0;
      linescores.forEach((roundScore: any) => {
        const holes = roundScore.linescores || [];
        holes.forEach((hole: any) => {
          const holeVal = hole.value;
          const displayVal = hole.scoreType?.displayValue;
          
          if (holeVal === 1) {
            // Hole-in-One
            holePoints += 12;
            return;
          }

          if (!displayVal) return;

          // Relative to par scoring
          const rel = displayVal.toUpperCase();
          if (rel === 'E' || rel === '0' || rel === 'E') {
            holePoints += 1;
          } else if (rel.startsWith('-')) {
            const diff = parseInt(rel, 10);
            if (diff <= -3) {
              holePoints += 20; // Albatross
            } else if (diff === -2) {
              holePoints += 8;  // Eagle
            } else if (diff === -1) {
              holePoints += 4;  // Birdie
            }
          } else if (rel.startsWith('+')) {
            const diff = parseInt(rel, 10);
            if (diff === 1) {
              holePoints += -4;  // Bogey
            } else if (diff === 2) {
              holePoints += -8;  // Double Bogey
            } else if (diff >= 3) {
              holePoints += -12; // Triple+ Bogey
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

    // 2. Sort golfers by score to assign tie-aware ranks
    // Standard tournament leaderboards sort by order
    const sortedGolfers = [...parsedGolfers].sort((a, b) => a.rawOrder - b.rawOrder);

    // Calculate ties
    let currentRank = 1;
    const golfersWithRank = sortedGolfers.map((g, idx, arr) => {
      if (idx > 0 && g.score !== arr[idx - 1].score) {
        currentRank = idx + 1;
      }
      
      // Missed cut players do not get standard ranks or placement points
      const rank = g.madeCut ? currentRank : 999;
      
      // Calculate placing points
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
        else placingPoints = 2; // Made cut but finished outside top 30
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
 * Returns a map of athleteId -> result string (e.g. "1st", "12th", "CUT").
 */
export async function getHistoricalTournamentResults(tournamentName: string, year: number): Promise<Record<number, string>> {
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

    // Fetch that specific event
    const scoreboard = await fetchLiveScoreboard(event.id);
    if (!scoreboard || !scoreboard.golfers) return {};

    const results: Record<number, string> = {};
    scoreboard.golfers.forEach(g => {
      if (!g.madeCut) {
        results[g.athleteId] = 'CUT';
      } else {
        results[g.athleteId] = g.rank > 0 ? getOrdinal(g.rank) : 'CUT';
      }
    });

    return results;
  } catch (err) {
    console.error(`Failed to fetch historical results for ${tournamentName} ${year}:`, err);
    return {};
  }
}
