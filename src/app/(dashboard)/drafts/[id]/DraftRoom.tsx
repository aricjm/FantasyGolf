'use client';

import React, { useState, useTransition } from 'react';
import { draftGolfer } from './actions';

interface User {
  id: number;
  name: string;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
}

interface Golfer {
  id: number;
  name: string;
  rank: number;
  country: string | null;
  type: string;
}

interface DraftPick {
  id: number;
  userId: number;
  golferId: number;
  round: number;
  pickNumber: number;
  golferName: string;
  golferRank: number;
  userName: string;
  userTeamName: string | null;
}

interface Draft {
  id: number;
  type: string;
  status: string;
  currentRound: number;
  currentPick: number;
  pickOrder: string;
  tournamentName: string | null;
}

interface DraftRoomProps {
  draft: Draft;
  users: User[];
  availableGolfers: Golfer[];
  picks: DraftPick[];
  myPicks: DraftPick[];
  userId: number;
}

export default function DraftRoom({
  draft,
  users,
  availableGolfers,
  picks,
  myPicks,
  userId,
}: DraftRoomProps) {
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pickOrder: number[] = JSON.parse(draft.pickOrder);
  const maxRounds = draft.type === 'long' ? 8 : 2;
  const totalPicksExpected = maxRounds * 10;

  // 1. Calculate active picker
  const roundPickIndex = (draft.currentPick - 1) % 10;
  const isEvenRound = draft.currentRound % 2 === 0;
  const activePickerIndex = isEvenRound ? 9 - roundPickIndex : roundPickIndex;
  const activePickerId = pickOrder[activePickerIndex];
  
  const isMyTurn = activePickerId === userId && draft.status !== 'completed';
  const activePicker = users.find((u) => u.id === activePickerId);

  // 2. Format pick queue (the next 5 picks)
  const getUpcomingPicks = () => {
    const list = [];
    let p = draft.currentPick;
    let r = draft.currentRound;
    
    while (list.length < 5 && p <= totalPicksExpected) {
      const idx = (p - 1) % 10;
      const isEven = r % 2 === 0;
      const uIndex = isEven ? 9 - idx : idx;
      const uId = pickOrder[uIndex];
      const uObj = users.find((u) => u.id === uId);
      
      list.push({
        pickNumber: p,
        round: r,
        userName: uObj?.teamName || uObj?.name || `Manager #${uId}`,
        logoUrl: uObj?.logoUrl,
        teamAbbr: uObj?.teamAbbr || 'TBD',
        isMe: uId === userId,
      });

      p++;
      r = Math.ceil(p / 10);
    }
    return list;
  };

  const upcomingPicks = getUpcomingPicks();

  // 3. Filter available golfers
  const filteredGolfers = availableGolfers.filter((g) => {
    const query = search.toLowerCase();
    return g.name.toLowerCase().includes(query) || (g.country?.toLowerCase() || '').includes(query);
  });

  // 4. Handle drafting action
  const handleDraft = async (golferId: number) => {
    setError(null);
    startTransition(async () => {
      const res = await draftGolfer(draft.id, golferId);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Banner */}
      <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-800/20 px-2 py-0.5 rounded">
            {draft.type === 'long' ? 'Preseason Long Draft' : `Weekly Short Draft - ${draft.tournamentName}`}
          </span>
          <h1 className="text-2xl font-black text-white mt-2">Live Draft Room</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Status: {draft.status === 'completed' ? (
              <span className="text-neutral-500 font-bold">Concluded</span>
            ) : (
              <span className="text-amber-400 font-bold animate-pulse">Draft Active</span>
            )}
          </p>
        </div>

        {/* Current Turn display */}
        {draft.status !== 'completed' && activePicker && (
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${
            isMyTurn 
              ? 'bg-emerald-950/20 border-emerald-700/50 animate-pulse text-emerald-200' 
              : 'bg-neutral-950/40 border-neutral-850 text-neutral-300'
          }`}>
            <div className="w-10 h-10 bg-neutral-950 rounded-lg flex items-center justify-center border border-neutral-800">
              {isMyTurn ? (
                <span className="text-[10px] font-black text-emerald-400 uppercase">Pick</span>
              ) : (
                <span className="text-[10px] font-semibold text-neutral-500 uppercase">Wait</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">
                {isMyTurn ? 'YOUR TURN' : 'ON THE CLOCK'}
              </span>
              <span className="text-sm font-extrabold text-white">
                {activePicker.teamName || activePicker.name}
              </span>
              <span className="text-xs text-neutral-400 block">
                Round {draft.currentRound} • Pick #{draft.currentPick}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-xl text-center font-semibold animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Main Draft dashboard layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left Column: My Picks & Upcoming Queue (Col span 1) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Upcoming Queue */}
          {draft.status !== 'completed' && (
            <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
                Upcoming Picks
              </h3>
              <div className="space-y-2">
                {upcomingPicks.map((pick, i) => (
                  <div
                    key={pick.pickNumber}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold ${
                      i === 0
                        ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300 font-bold'
                        : 'bg-neutral-950/20 border-neutral-900 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-bold">#{pick.pickNumber}</span>
                      <span className="truncate max-w-[120px]">{pick.userName}</span>
                      {pick.isMe && (
                        <span className="bg-emerald-900/50 text-emerald-400 text-[8px] font-black tracking-widest px-1 py-0.5 rounded leading-none uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-neutral-500">R{pick.round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's drafted players */}
          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-5 backdrop-blur-xl">
            <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
              Your Roster ({myPicks.length} drafted)
            </h3>
            {myPicks.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">No golfers drafted yet.</p>
            ) : (
              <div className="space-y-1.5">
                {myPicks.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-neutral-950/40 border border-neutral-800 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-white block">{p.golferName}</span>
                      <span className="text-[10px] text-neutral-500">Rank: #{p.golferRank}</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold">Pick {p.pickNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Column: Available Golfers Table (Col span 3) */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Search box & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Available Golfers</h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search golfers or country..."
                className="w-full pl-3 pr-8 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
              <span className="absolute right-3 top-2.5 text-neutral-500 text-xs">🔍</span>
            </div>
          </div>

          {/* Golfers Table */}
          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950/60 border-b border-neutral-800 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">World Rank</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Country</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredGolfers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-xs text-neutral-500">
                        No available golfers match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredGolfers.map((golfer) => (
                      <tr
                        key={golfer.id}
                        className="hover:bg-neutral-800/10 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-bold text-neutral-300">
                          #{golfer.rank}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-white">
                          {golfer.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {golfer.country || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDraft(golfer.id)}
                            disabled={!isMyTurn || isPending}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                              isMyTurn
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20'
                                : 'bg-neutral-800 text-neutral-500 border border-neutral-750'
                            }`}
                          >
                            {isMyTurn ? 'Draft Player' : 'Draft'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom section: Complete Draft History Log */}
      <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-sm font-black text-neutral-400 tracking-wider uppercase border-b border-neutral-800 pb-2 mb-4">
          Draft Pick History ({picks.length} picks made)
        </h3>
        {picks.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">No picks made in this session yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto">
            {picks.map((pick) => (
              <div
                key={pick.id}
                className="p-3 bg-neutral-950/40 border border-neutral-800 rounded-xl text-xs flex items-center justify-between"
              >
                <div>
                  <span className="text-neutral-500 font-bold block">Pick #{pick.pickNumber} (R{pick.round})</span>
                  <span className="font-extrabold text-white block mt-0.5">{pick.golferName}</span>
                  <span className="text-[10px] text-emerald-500 font-medium block">
                    to {pick.userTeamName || pick.userName}
                  </span>
                </div>
                <div className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-md flex items-center justify-center font-bold text-[10px] text-neutral-400">
                  #{pick.golferRank}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
