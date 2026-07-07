'use client';

import React, { useState, useTransition } from 'react';
import { claimFreeAgent } from './actions';

interface Golfer {
  id: number;
  name: string;
  rank: number;
  country: string | null;
  type: string;
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

  // Filter out top 25 golfers from drop-down list (can never drop ranks 1-25)
  const droppableRoster = myRoster.filter((g) => g.rank > 25 && g.type !== 'top20');
  const rosterLimitReached = myRoster.length >= 10;

  const handleClaim = async (freeAgentId: number) => {
    setError(null);
    const dropId = dropMap[freeAgentId] || null;

    if (rosterLimitReached && !dropId) {
      setError('You must select a player to drop to claim this free agent.');
      return;
    }

    startTransition(async () => {
      const res = await claimFreeAgent(freeAgentId, dropId);
      if (res?.error) {
        setError(res.error);
      } else {
        // Clear selection
        setDropMap((prev) => {
          const next = { ...prev };
          delete next[freeAgentId];
          return next;
        });
      }
    });
  };

  const handleSelectDrop = (freeAgentId: number, dropId: number) => {
    setDropMap((prev) => ({
      ...prev,
      [freeAgentId]: dropId,
    }));
  };

  // Filter list
  const filteredAgents = freeAgents.filter((g) => {
    const query = search.toLowerCase();
    return g.name.toLowerCase().includes(query) || (g.country?.toLowerCase() || '').includes(query);
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Summary info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 font-bold">
            Roster Status:
          </span>
          <span className={`text-xs font-black px-2.5 py-1 rounded-md border ${
            rosterLimitReached
              ? 'bg-amber-950/20 border-amber-900/40 text-amber-400'
              : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
          }`}>
            {myRoster.length} / 10 Players Rostered
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search free agents..."
            className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-xl text-center font-semibold">
          {error}
        </div>
      )}

      {/* Free Agents Table */}
      <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 text-center">Rank</th>
                <th className="px-4 py-4">Golfer</th>
                <th className="px-4 py-4 text-center">Age</th>
                <th className="px-4 py-4 text-center">Events</th>
                <th className="px-4 py-4 text-center text-emerald-400">Pts Gain</th>
                <th className="px-4 py-4 text-center text-red-400">Pts Lost</th>
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
                      <td className="px-4 py-4 font-extrabold text-white">
                        {golfer.name}
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
