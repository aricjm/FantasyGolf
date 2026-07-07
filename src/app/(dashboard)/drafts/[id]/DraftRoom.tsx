'use client';

import React, { useState, useTransition } from 'react';
import { draftGolfer, setDraftStartTime, toggleDraftPause, resetDraft, toggleAutoDraft } from './actions';
import GolferHoverCard from '@/components/GolferHoverCard';
import DraftTrackerBar from '@/components/DraftTrackerBar';

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
  espnId?: string | null;
  starts: number;
  cutsMade: number;
  avgPoints: number;
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
  createdAt: string | Date;
}

interface Draft {
  id: number;
  type: string;
  status: string;
  currentRound: number;
  currentPick: number;
  tournamentName: string | null;
  createdAt: string | Date;
  startTime: string | Date | null;
  lastActionAt: string | Date | null;
  autoDraftUsers: string;
  pickOrder: string;
}

interface DraftRoomProps {
  draft: Draft;
  users: User[];
  availableGolfers: Golfer[];
  picks: DraftPick[];
  userId: number;
  isAdmin?: boolean;
  historicalResults?: Record<string, { rank: string, points: number }>;
}

export default function DraftRoom({
  draft,
  users,
  availableGolfers,
  picks,
  userId,
  isAdmin = false,
  historicalResults = {},
}: DraftRoomProps) {
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number>(userId);
  const [isPending, startTransition] = useTransition();

  const [adminStartTime, setAdminStartTime] = useState(
    draft.startTime ? new Date(new Date(draft.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
  );

  const handleSetStartTime = () => {
    if (!adminStartTime) return;
    startTransition(async () => {
      const d = new Date(adminStartTime);
      await setDraftStartTime(draft.id, d.toISOString());
    });
  };

  const handleTogglePause = () => {
    startTransition(async () => {
      const statusToPass = isEffectivelyActive && draft.status === 'pending' ? 'active' : draft.status;
      await toggleDraftPause(draft.id, statusToPass);
    });
  };

  const handleResetDraft = () => {
    if (window.confirm("Are you sure you want to RESET this draft? This will delete all picks and clear all rosters tied to this draft. This cannot be undone.")) {
      startTransition(async () => {
        await resetDraft(draft.id);
      });
    }
  };

  const handleToggleAutoDraft = (targetUserId: number, isEnabled: boolean) => {
    startTransition(async () => {
      await toggleAutoDraft(draft.id, targetUserId, isEnabled);
    });
  };

  const pickOrder: number[] = JSON.parse(draft.pickOrder);
  const maxRounds = draft.type === 'long' ? 8 : 2;
  const totalPicksExpected = maxRounds * 10;

  let autoDraftUserIds: number[] = [];
  try {
    autoDraftUserIds = JSON.parse(draft.autoDraftUsers);
  } catch (e) { }
  const isUserAutoDrafting = autoDraftUserIds.includes(userId);

  const isEffectivelyActive = draft.status === 'active' ||
    (draft.status === 'pending' && draft.startTime && new Date(draft.startTime).getTime() <= new Date().getTime());

  // 1. Calculate active picker
  const roundPickIndex = (draft.currentPick - 1) % 10;
  const isEvenRound = draft.currentRound % 2 === 0;
  const activePickerIndex = isEvenRound ? 9 - roundPickIndex : roundPickIndex;
  const activePickerId = pickOrder[activePickerIndex];

  const isMyTurn = (activePickerId === userId || isAdmin) && draft.status !== 'completed';
  const activePicker = users.find((u) => u.id === activePickerId);

  // 2. Format pick queue (the last 5 picks)
  const getLatestPicks = () => {
    return [...picks].sort((a, b) => b.pickNumber - a.pickNumber).slice(0, 5);
  };

  const latestPicks = getLatestPicks();

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

      {/* Auto-Draft Banner */}
      {isUserAutoDrafting && draft.status !== 'completed' && (
        <div className="bg-red-900/40 border-2 border-red-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow">
          <div>
            <h2 className="text-xl font-black text-red-400 uppercase tracking-wide">You are on Auto-Draft</h2>
            <p className="text-sm text-red-200 mt-1">Your timer expired. We will automatically draft the highest ranked player for you as soon as it is your turn.</p>
          </div>
          <button
            onClick={() => handleToggleAutoDraft(userId, false)}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-sm px-6 py-3 rounded-xl whitespace-nowrap shadow-lg transition-all"
          >
            Resume Manual Drafting
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-xl flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div>
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-800/20 px-2 py-0.5 rounded">
                {draft.type === 'long' ? 'Preseason Long Draft' : `Weekly Short Draft - ${draft.tournamentName}`}
              </span>
              <h1 className="text-2xl font-black text-white mt-2">Live Draft Room</h1>
              <p className="text-xs text-neutral-400 mt-1">
                Status: {draft.status === 'completed' ? (
                  <span className="text-neutral-500 font-bold">Concluded</span>
                ) : draft.status === 'paused' ? (
                  <span className="text-amber-500 font-bold animate-pulse">Paused</span>
                ) : (
                  <span className="text-emerald-400 font-bold animate-pulse">
                    {isEffectivelyActive ? 'Draft Active' : 'Pending'}
                  </span>
                )}
              </p>
            </div>

            {/* ADMIN PANEL */}
            {isAdmin && draft.status !== 'completed' && (
              <div className="flex flex-col gap-2 p-3 bg-red-950/10 border border-red-900/30 rounded-xl shrink-0">
                <div className="text-[9px] font-black tracking-widest text-red-500 uppercase">Admin Controls</div>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={adminStartTime}
                    onChange={(e) => setAdminStartTime(e.target.value)}
                    className="bg-neutral-900 text-xs text-white border border-neutral-700 rounded px-2 py-1 outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleSetStartTime}
                    disabled={isPending}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] uppercase font-bold px-3 py-1 rounded border border-neutral-600 transition"
                  >
                    Set Start
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleTogglePause}
                    disabled={isPending}
                    className={`flex-1 text-xs px-3 py-1.5 rounded font-bold transition ${draft.status === 'paused' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}
                  >
                    {draft.status === 'paused' ? 'Resume Draft' : isEffectivelyActive ? 'Pause Draft' : 'Force Start Draft'}
                  </button>

                  <button
                    onClick={handleResetDraft}
                    disabled={isPending}
                    className="flex-1 text-xs px-3 py-1.5 rounded font-bold transition bg-red-800 hover:bg-red-700 text-white border border-red-700"
                  >
                    Reset Draft
                  </button>
                </div>

                {autoDraftUserIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-900/30">
                    <div className="text-[9px] font-black tracking-widest text-red-500 uppercase mb-2">On Auto-Draft</div>
                    <div className="flex flex-wrap gap-2">
                      {autoDraftUserIds.map(uid => {
                        const user = users.find(u => u.id === uid);
                        return (
                          <div key={uid} className="flex items-center gap-1 bg-red-900/40 border border-red-800 rounded px-2 py-1">
                            <span className="text-xs text-red-200">{user?.teamAbbr || user?.name || `User ${uid}`}</span>
                            <button
                              onClick={() => handleToggleAutoDraft(uid, false)}
                              disabled={isPending}
                              className="text-red-400 hover:text-white ml-1 px-1 rounded hover:bg-red-700/50"
                              title="Remove from Auto-Draft"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Turn display */}
          {draft.status !== 'completed' && activePicker && (
            <div className={`p-4 rounded-xl border flex items-center gap-4 ${isMyTurn
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

        <div className="w-full">
          <DraftTrackerBar draft={draft} picks={picks} users={users} userId={userId} onSelectUser={setViewingUserId} />
        </div>
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

          {/* Latest Picks Queue */}
          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-5 backdrop-blur-xl">
            <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
              Latest Picks
            </h3>
            <div className="space-y-2">
              {latestPicks.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">No picks made yet.</p>
              ) : (
                latestPicks.map((pick, i) => {
                  const uObj = users.find(u => u.id === pick.userId);
                  return (
                    <div
                      key={pick.pickNumber}
                      className={`flex flex-col p-2.5 rounded-lg border text-xs font-semibold transition-all duration-300 ${i === 0
                          ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                          : 'bg-neutral-950/20 border-neutral-900 text-neutral-400'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{pick.golferName}</span>
                        <span className="text-neutral-500 text-[10px]">#{pick.pickNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-500/80 uppercase tracking-widest truncate max-w-[150px]">{uObj?.teamName || uObj?.name}</span>
                        <span className="text-neutral-500 text-[10px]">R{pick.round}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* User's drafted players */}
          <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
              <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                Roster
              </h3>
              <select
                value={viewingUserId}
                onChange={(e) => setViewingUserId(Number(e.target.value))}
                className="bg-neutral-950 border border-neutral-800 text-emerald-400 text-[10px] uppercase font-bold rounded px-2 py-1 outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.teamAbbr || u.name}</option>
                ))}
              </select>
            </div>

            {(() => {
              const displayedPicks = picks.filter(p => p.userId === viewingUserId).sort((a, b) => a.pickNumber - b.pickNumber);

              if (displayedPicks.length === 0) {
                return <p className="text-xs text-neutral-500 text-center py-4">No golfers drafted yet.</p>;
              }

              return (
                <div className="space-y-1.5">
                  {displayedPicks.map((p) => (
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
              );
            })()}
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
                    <th className="px-6 py-4 cursor-help" title="Number of tournaments played in the previous year">Starts</th>
                    <th className="px-6 py-4 cursor-help" title="Percentage of cuts made based on starts">Cuts %</th>
                    <th className="px-6 py-4 cursor-help" title="Average fantasy points per start based on our custom scoring system">Avg Pts</th>
                    {draft.type === 'short' && (
                      <>
                        <th className="px-6 py-4">2025 Result</th>
                        <th className="px-6 py-4">2025 Points</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredGolfers.length === 0 ? (
                    <tr>
                      <td colSpan={draft.type === 'short' ? 9 : 7} className="px-6 py-12 text-center text-xs text-neutral-500">
                        No available golfers match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredGolfers.map((golfer) => {
                      const normName = golfer.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return (
                        <tr
                          key={golfer.id}
                          className="hover:bg-neutral-800/10 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 font-bold text-neutral-300">
                            #{golfer.rank}
                          </td>
                          <td className="px-6 py-4 font-black text-white">
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
                          <td className="px-6 py-4 text-xs text-neutral-400">
                            {golfer.country || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-neutral-300">
                            {golfer.starts}
                          </td>
                          <td
                            className="px-6 py-4 text-xs font-bold text-neutral-300 cursor-help"
                            title={`${golfer.cutsMade}/${golfer.starts} cuts made`}
                          >
                            {golfer.starts > 0 ? `${Math.round((golfer.cutsMade / golfer.starts) * 100)}%` : '0%'}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-emerald-400">
                            {golfer.avgPoints}
                          </td>
                          {draft.type === 'short' && (
                            <>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${historicalResults[normName]?.rank === 'CUT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    historicalResults[normName]?.rank ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                      'bg-neutral-800 text-neutral-500 border border-neutral-700'
                                  }`}>
                                  {historicalResults[normName]?.rank || 'DNP'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-white">
                                {historicalResults[normName] ? historicalResults[normName].points : '-'}
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDraft(golfer.id)}
                              disabled={!isMyTurn || isPending}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isMyTurn
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20'
                                  : 'bg-neutral-800 text-neutral-500 border border-neutral-750'
                                }`}
                            >
                              {isMyTurn ? 'Draft Player' : 'Draft'}
                            </button>
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
