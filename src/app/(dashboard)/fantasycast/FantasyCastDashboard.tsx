'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GolferDetails {
  id: number;
  isActive: boolean;
  name: string;
  score: string;
  strokes: number;
  rank: number;
  madeCut: boolean;
  holePoints: number;
  placingPoints: number;
  totalPoints: number;
  thru: string;
  today: string;
}

interface Team {
  id: number;
  name: string;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
  starters: GolferDetails[];
  bench: GolferDetails[];
  totalPoints: number;
}

interface FantasyCastDashboardProps {
  tournamentName: string;
  round: number;
  completed: boolean;
  teams: Team[];
}

export default function FantasyCastDashboard({
  tournamentName,
  round,
  completed,
  teams,
}: FantasyCastDashboardProps) {
  const router = useRouter();
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(teams[0]?.id || null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const toggleExpand = (id: number) => {
    setExpandedTeamId(expandedTeamId === id ? null : id);
  };

  const golferRow = (g: GolferDetails, index: number) => {
    return (
      <tr key={g.id} className={`${g.isActive ? '' : 'opacity-40 text-neutral-500'} hover:bg-neutral-850/10 transition-colors`}>
        <td className="py-2.5 px-4 font-bold text-xs text-neutral-500">
          {g.isActive ? `Starter #${index + 1}` : 'Bench'}
        </td>
        <td className="py-2.5 px-4 font-extrabold text-white">
          {g.name}
          {!g.madeCut && (
            <span className="ml-2 text-[9px] bg-red-950/40 border border-red-900/30 text-red-400 px-1 py-0.5 rounded uppercase font-black leading-none">
              Missed Cut
            </span>
          )}
        </td>
        <td className="py-2.5 px-4 text-xs font-semibold text-neutral-300">
          {g.rank === 999 ? 'MC' : `#${g.rank}`}
        </td>
        <td className="py-2.5 px-4 text-xs font-semibold text-neutral-300">
          {g.score}
        </td>
        <td className="py-2.5 px-4 text-xs text-neutral-400">
          {g.thru}
        </td>
        <td className="py-2.5 px-4 text-xs text-right font-semibold text-neutral-300">
          {g.holePoints.toFixed(0)}
        </td>
        <td className="py-2.5 px-4 text-xs text-right font-semibold text-neutral-300">
          {g.placingPoints.toFixed(0)}
        </td>
        <td className="py-2.5 px-4 text-sm text-right font-black text-emerald-400">
          {g.totalPoints.toFixed(0)}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Scoreboard Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/40 border border-neutral-850 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-black text-white">{tournamentName}</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Status: {completed ? 'Finished' : `Active • Round ${round}`}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-700/20 active:scale-95 disabled:opacity-50"
        >
          <span>{refreshing ? 'Syncing...' : 'Sync Scores'}</span>
        </button>
      </div>

      {/* 2. Leaderboard Roster Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Teams Leaderboard standings list (Col span 1) */}
        <div className="xl:col-span-1 space-y-3">
          <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase border-b border-neutral-900 pb-2">
            Fantasy Leaderboard
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {teams.map((team, idx) => {
              const rank = idx + 1;
              const isExpanded = expandedTeamId === team.id;

              return (
                <div
                  key={team.id}
                  onClick={() => toggleExpand(team.id)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 select-none flex items-center justify-between ${
                    isExpanded
                      ? 'bg-emerald-950/20 border-emerald-800/40 shadow-lg'
                      : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-sm text-neutral-500">
                      #{rank}
                    </span>
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-400">
                        {team.teamAbbr || 'TD'}
                      </div>
                    )}
                    <div>
                      <span className="font-extrabold text-white block text-sm">
                        {team.teamName || 'Team Name'}
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Manager: {team.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400 block">
                      {team.totalPoints.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">
                      {team.starters.length} Starters
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Team Details Card (Col span 2) */}
        <div className="xl:col-span-2 space-y-3">
          <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase border-b border-neutral-900 pb-2">
            Selected Team Lineup Details
          </h3>

          {expandedTeamId ? (
            (() => {
              const activeTeam = teams.find((t) => t.id === expandedTeamId);
              if (!activeTeam) return null;

              return (
                <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                      {activeTeam.logoUrl ? (
                        <img src={activeTeam.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center font-bold text-sm text-neutral-400">
                          {activeTeam.teamAbbr || 'TD'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-black text-white leading-none">
                          {activeTeam.teamName}
                        </h4>
                        <span className="text-xs text-neutral-400 block mt-1.5">
                          Manager: {activeTeam.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-400 block">Fantasy Points</span>
                      <span className="text-2xl font-black text-emerald-400 block leading-none">
                        {activeTeam.totalPoints.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Starters & Bench List */}
                  {activeTeam.starters.length === 0 && activeTeam.bench.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-6 text-center">
                      Roster is empty or no lineup set for this tournament.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Golfer</th>
                            <th className="py-2.5 px-4">Rank</th>
                            <th className="py-2.5 px-4">Score</th>
                            <th className="py-2.5 px-4">Thru</th>
                            <th className="py-2.5 px-4 text-right">Hole Pts</th>
                            <th className="py-2.5 px-4 text-right">Finish Pts</th>
                            <th className="py-2.5 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/20">
                          {activeTeam.starters.map((g, idx) => golferRow(g, idx))}
                          {activeTeam.bench.map((g) => golferRow(g, 0))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="p-12 text-center bg-neutral-900/20 border border-neutral-800 rounded-2xl text-neutral-400 text-sm">
              Click a team on the leaderboard list to inspect their lineup scorecard details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
