'use client';

import React, { useState, useTransition } from 'react';
import { claimFreeAgent } from './actions';
import GolferHoverCard from '@/components/GolferHoverCard';

interface Golfer {
  id: number;
  name: string;
  rank: number;
  country: string | null;
  type: string;
  espnId?: string | null;
  age?: number;
  events?: number;
  totPts?: number;
  avgPts?: number;
  ptsLost?: number;
  ptsGain?: number;
}

interface FreeAgentsListProps {
  freeAgents: Golfer[];
  myRoster: Golfer[];
}

export default function FreeAgentsList({ freeAgents, myRoster }: FreeAgentsListProps) {
  const [search, setSearch] = useState('');
  const [dropMap, setDropMap] = useState<Record<number, number>>({}); // freeAgentId -> rosterGolferIdToDrop
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredAgents = freeAgents.filter((a) => {
    const s = search.toLowerCase();
    return a.name.toLowerCase().includes(s) || (a.country && a.country.toLowerCase().includes(s));
  });

  const rosterLimitReached = myRoster.length >= 6;
  const droppableRoster = myRoster.filter(r => r.type !== 'top20'); // Cannot drop top 20 players

  const handleSelectDrop = (freeAgentId: number, dropGolferId: number) => {
    setDropMap(prev => ({ ...prev, [freeAgentId]: dropGolferId }));
  };

  const handleClaim = (golferId: number) => {
    const dropGolferId = dropMap[golferId];
    if (rosterLimitReached && !dropGolferId) {
      setError('You must select a player to drop before claiming.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    startTransition(async () => {
      const res = await claimFreeAgent(golferId, dropGolferId);
      if (res.error) {
        setError(res.error);
        setTimeout(() => setError(null), 4000);
      } else {
        setSuccess('Player claimed successfully!');
        setDropMap(prev => {
          const next = { ...prev };
          delete next[golferId];
          return next;
        });
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl backdrop-blur-xl">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or country..."
            className="w-full pl-3 pr-8 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          <span className="absolute right-3 top-2.5 text-neutral-500 text-xs">🔍</span>
        </div>
        
        <div className="text-xs text-neutral-400">
          Your Roster Size: <span className="text-white font-bold">{myRoster.length}/6</span>
          {rosterLimitReached && <span className="ml-2 text-amber-400 text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">Full</span>}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs font-bold text-center">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold text-center">
          {success}
        </div>
      )}

      {/* Free Agents Table */}
      <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 text-center">World Rank</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4 text-center">Age</th>
                <th className="px-4 py-4 text-center">Events</th>
                <th className="px-4 py-4 text-center">Gain</th>
                <th className="px-4 py-4 text-center">Loss</th>
                <th className="px-4 py-4 text-center">Tot Pts</th>
                <th className="px-4 py-4 text-center">Avg Pts</th>
                <th className="px-4 py-4 text-center">Country</th>
                <th className="px-4 py-4 text-right w-[240px]">Roster Swap Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-xs text-neutral-500">
                    No free agents match your search query.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((golfer) => {
                  const selectedDropId = dropMap[golfer.id] || '';

                  return (
                    <tr
                      key={golfer.id}
                      className="hover:bg-neutral-850/10 transition-colors duration-150 text-xs"
                    >
                      <td className="px-4 py-4 text-center font-bold text-neutral-300">
                        #{golfer.rank}
                      </td>
                      <td className="px-4 py-4 font-black text-white">
                        <GolferHoverCard espnId={golfer.espnId} name={golfer.name}>
                          <div className="flex items-center gap-3 cursor-pointer">
                            {golfer.espnId ? (
                              <img
                                src={`https://a.espncdn.com/i/headshots/golf/players/full/${golfer.espnId}.png`}
                                alt={golfer.name}
                                className="w-8 h-8 rounded-full bg-neutral-800 object-cover object-top border border-neutral-700"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs text-neutral-500 font-bold shrink-0">
                                {golfer.name.charAt(0)}
                              </div>
                            )}
                            <span>{golfer.name}</span>
                          </div>
                        </GolferHoverCard>
                      </td>
                      <td className="px-4 py-4 text-center text-neutral-350">
                        {golfer.age}
                      </td>
                      <td className="px-4 py-4 text-center text-neutral-350">
                        {golfer.events}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-400">
                        +{golfer.ptsGain}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-red-400">
                        -{golfer.ptsLost}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-white">
                        {golfer.totPts}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-neutral-300">
                        {golfer.avgPts}
                      </td>
                      <td className="px-4 py-4 text-center text-neutral-400">
                        {golfer.country || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Drop Player select box - only visible if roster size limit is reached */}
                          {rosterLimitReached && (
                            <select
                              value={selectedDropId}
                              onChange={(e) => handleSelectDrop(golfer.id, parseInt(e.target.value, 10))}
                              disabled={isPending}
                              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 font-semibold"
                            >
                              <option value="" disabled>-- Drop to add --</option>
                              {droppableRoster.map((r) => (
                                <option key={r.id} value={r.id}>
                                  Drop {r.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() => handleClaim(golfer.id)}
                            disabled={isPending || (rosterLimitReached && !selectedDropId)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                              isPending
                                ? 'bg-neutral-800 text-neutral-500'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20'
                            }`}
                          >
                            Claim
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
