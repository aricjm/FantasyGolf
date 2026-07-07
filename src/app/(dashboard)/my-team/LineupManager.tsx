'use client';

import React, { useState, useTransition } from 'react';
import { toggleLineupGolfer } from './actions';

interface Golfer {
  id: number;
  name: string;
  rank: number;
  country: string | null;
  type: string;
  acquiredVia: string;
}

interface LineupItem {
  id: number;
  userId: number;
  tournamentId: string;
  golferId: number;
  isActive: boolean;
}

interface LineupManagerProps {
  roster: Golfer[];
  lineup: LineupItem[];
  tournamentId: string;
  isLocked: boolean;
}

export default function LineupManager({ roster, lineup, tournamentId, isLocked }: LineupManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Derive which golfers are starters based on database lineup records
  const starters = roster.filter((g) => lineup.some((l) => l.golferId === g.id && l.isActive));
  const bench = roster.filter((g) => !lineup.some((l) => l.golferId === g.id && l.isActive));

  const handleToggle = async (golferId: number) => {
    setError(null);
    startTransition(async () => {
      const res = await toggleLineupGolfer(golferId, tournamentId);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const golferCard = (golfer: Golfer, isStarter: boolean) => {
    // Get country text details
    const countryText = golfer.country ? `(${golfer.country})` : '';

    return (
      <div
        key={golfer.id}
        className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
          isStarter
            ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700'
            : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-950 border border-neutral-850 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-400">
            #{golfer.rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white leading-none">{golfer.name}</span>
              <span className="text-[10px] text-neutral-500 leading-none">{countryText}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none uppercase ${
                golfer.type === 'top20'
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-800/20'
                  : 'bg-neutral-800/50 text-neutral-400 border border-neutral-750'
              }`}>
                {golfer.type === 'top20' ? 'Top 25 Weekly' : 'Season Roster'}
              </span>
              <span className="text-[9px] text-neutral-500 font-medium lowercase">
                via {golfer.acquiredVia.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleToggle(golfer.id)}
          disabled={isLocked || isPending}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
            isStarter
              ? 'bg-red-950/40 text-red-400 hover:bg-red-900/30 border border-red-900/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20'
          }`}
        >
          {isStarter ? 'Bench' : 'Start'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-xl text-center font-medium animate-in fade-in duration-200">
          Error: {error}
        </div>
      )}

      {/* Starters Block */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
          <h3 className="text-sm font-black text-emerald-400 tracking-wider uppercase">
            Active Starters ({starters.length} / 6)
          </h3>
          {starters.length < 6 && (
            <span className="text-[10px] text-amber-500 font-bold animate-pulse">
              Incomplete lineup: Need to start {6 - starters.length} more golfers!
            </span>
          )}
        </div>
        
        {starters.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/10 border border-dashed border-neutral-850 rounded-2xl text-neutral-500 text-sm">
            No starting golfers chosen yet. Click "Start" on your players below to select them.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {starters.map((g) => golferCard(g, true))}
          </div>
        )}
      </div>

      {/* Bench Block */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-neutral-400 tracking-wider uppercase border-b border-neutral-900 pb-2">
          Bench ({bench.length})
        </h3>
        
        {bench.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/10 border border-dashed border-neutral-850 rounded-2xl text-neutral-500 text-sm">
            Your bench is empty. All golfers are currently in your starting lineup!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bench.map((g) => golferCard(g, false))}
          </div>
        )}
      </div>
    </div>
  );
}
