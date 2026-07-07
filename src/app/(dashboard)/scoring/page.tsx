import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ScoringPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Scoring Rules</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Official point system for tournament scores and season standings.
        </p>
        <p className="text-sm text-neutral-400 mt-1">
          Tournament points reset each week/tournament. Season points are cumulative and what determine the ultimate winner.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Hole-by-Hole Points */}
        <div className="xl:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Tournament Points</h2>

          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div>
              <h3 className="text-sm font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
                Hole-by-Hole Points
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Points are awarded for every hole played during the tournament based on the golfer&apos;s score relative to par:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Eagle</span>
                    <span className="font-bold text-emerald-400">+10 points</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Birdie</span>
                    <span className="font-bold text-emerald-400">+4 points</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Par</span>
                    <span className="font-bold text-emerald-400">+1 point</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Bogey</span>
                    <span className="font-bold text-red-400">-4 points</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Double Bogey</span>
                    <span className="font-bold text-red-500">-8 points</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Triple Bogey+</span>
                    <span className="font-bold text-red-600">-12 points</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Albatross</span>
                    <span className="font-bold text-emerald-400">+20 points</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                    <span>Hole in One</span>
                    <span className="font-bold text-emerald-400">+12 points</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
                Golfer Finish Placement
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Bonus points added to your Tournament Score based on each golfer&apos;s finishing position:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-neutral-300">
                {[
                  { place: '1st', pts: 30, color: 'text-emerald-400' },
                  { place: '2nd', pts: 28 },
                  { place: '3rd', pts: 26 },
                  { place: '4th', pts: 24 },
                ].map(({ place, pts, color }) => (
                  <div key={place} className="bg-neutral-950/40 p-3 border border-neutral-850 rounded-xl text-center">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold mb-1">{place} Place</span>
                    <span className={`text-base font-black ${color ?? 'text-white'}`}>+{pts} pts</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 text-xs text-neutral-300">
                {[
                  { place: '5th', pts: 22 },
                  { place: '6th', pts: 20 },
                  { place: '7th', pts: 18 },
                  { place: '8th', pts: 16 },
                  { place: '9th', pts: 14 },
                  { place: '10th', pts: 12 },
                ].map(({ place, pts }) => (
                  <div key={place} className="bg-neutral-950/40 p-2 border border-neutral-850 rounded-lg text-center">
                    <span className="text-[9px] text-neutral-500 block">{place}</span>
                    <span className="font-bold text-white">+{pts} pts</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 border border-neutral-900 bg-neutral-950/40 rounded-xl text-xs text-neutral-400 space-y-1">
                <p>• 11th - 15th Position: 10 points</p>
                <p>• 16th - 20th Position: 8 points</p>
                <p>• 21st - 25th Position: 6 points</p>
                <p>• 26th - 30th Position: 4 points</p>
                <p>• 30th place and below (who made the cut): 2 points</p>
                <p className="text-[10px] text-red-400 mt-2 font-bold">Missed Cut / DQ / WD: 0 placement points.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Season Points */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Season Points</h2>

          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div>
              <h3 className="text-sm font-black tracking-widest text-amber-400 uppercase border-b border-neutral-800 pb-2 mb-3">
                Team vs. Team Rankings
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                After each tournament, teams are ranked against each other by their <span className="text-white font-semibold">Tournament Score</span>. The finishing rank earns <span className="text-white font-semibold">Season Points</span> that accumulate all year — the team with the most Season Points at year&apos;s end wins the league.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-neutral-300">
                {[
                  { place: '1st', pts: 20, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
                  { place: '2nd', pts: 17, color: 'text-neutral-200', bg: 'bg-neutral-500/5 border-neutral-500/20' },
                  { place: '3rd', pts: 14, color: 'text-amber-600', bg: 'bg-amber-800/5 border-amber-800/20' },
                  { place: '4th', pts: 12, color: 'text-white', bg: 'bg-neutral-950/40 border-neutral-850' },
                  { place: '5th', pts: 10, color: 'text-white', bg: 'bg-neutral-950/40 border-neutral-850' },
                  { place: '6th', pts: 8, color: 'text-white', bg: 'bg-neutral-950/40 border-neutral-850' },
                  { place: '7th', pts: 6, color: 'text-white', bg: 'bg-neutral-950/40 border-neutral-850' },
                  { place: '8th', pts: 4, color: 'text-white', bg: 'bg-neutral-950/40 border-neutral-850' },
                  { place: '9th', pts: 2, color: 'text-white', bg: 'bg-neutral-950/40 border-neutral-850' },
                  { place: '10th', pts: 0, color: 'text-red-400', bg: 'bg-red-950/10 border-red-900/20' },
                ].map(({ place, pts, color, bg }) => (
                  <div key={place} className={`p-3 border rounded-xl text-center ${bg}`}>
                    <span className="text-[9px] text-neutral-500 block uppercase font-bold mb-1">{place} Place</span>
                    <span className={`font-black text-lg ${color}`}>{pts > 0 ? `+${pts}` : '0'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-200/80 space-y-2">
              <p className="font-black text-amber-400 text-base">🏆 How the Champion is Determined</p>
              <p className="text-xs leading-relaxed">
                <span className="text-white font-semibold">Tournament Points</span> measure your team&apos;s total fantasy score each week — these determine your rank vs. other teams per tournament.
              </p>
              <p className="text-xs leading-relaxed">
                <span className="text-white font-semibold">Season Points</span> are earned based on that rank (e.g. finishing 1st in a tournament earns 20 Season Points). These accumulate over every tournament all year.
              </p>
              <p className="text-xs leading-relaxed font-semibold text-amber-300">
                The team with the most Season Points at the end of the season is crowned the league champion.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/40 border border-neutral-800 rounded-xl">
              <h4 className="text-xs font-black tracking-widest text-neutral-400 uppercase mb-3">Example Scenario</h4>
              <div className="space-y-2 text-xs text-neutral-300">
                <div className="flex justify-between items-center py-1.5 border-b border-neutral-800/50">
                  <span>Your team scores <span className="text-emerald-400 font-bold">1,240 Tournament Pts</span> — best in the league</span>
                  <span className="text-amber-400 font-black ml-4 shrink-0">+20 Season Pts</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-neutral-800/50">
                  <span>Next tournament you finish 3rd with <span className="text-emerald-400 font-bold">980 Tournament Pts</span></span>
                  <span className="text-amber-400 font-black ml-4 shrink-0">+14 Season Pts</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="font-semibold text-white">Running Season Points total</span>
                  <span className="text-amber-400 font-black ml-4 shrink-0">34 Season Pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
