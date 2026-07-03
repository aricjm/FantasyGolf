'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { proposeTradeAction } from './actions';

interface Golfer {
  id: number;
  name: string;
  rank: number;
  country: string | null;
  type: string;
}

interface Opponent {
  id: number;
  name: string;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
}

interface CounteredTradeItem {
  golferId: number;
  direction: string; // 'send' or 'receive'
}

interface CounteredTrade {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  items: CounteredTradeItem[];
}

interface TradeProposerProps {
  myRoster: Golfer[];
  opponentRoster: Golfer[];
  opponent: Opponent;
  counteredTrade: CounteredTrade | null;
}

export default function TradeProposer({
  myRoster,
  opponentRoster,
  opponent,
  counteredTrade,
}: TradeProposerProps) {
  const router = useRouter();
  const [selectedMyIds, setSelectedMyIds] = useState<number[]>([]);
  const [selectedOpponentIds, setSelectedOpponentIds] = useState<number[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Pre-populate selections if countering
  useEffect(() => {
    if (counteredTrade) {
      // In original trade:
      // 'send' direction meant from sender (opponent) to receiver (us). So we receive these.
      // In the counter, these are the players we want to receive, i.e., from the opponent's roster.
      const receiveIds = counteredTrade.items
        .filter((i) => i.direction === 'send')
        .map((i) => i.golferId);

      // 'receive' direction meant from receiver (us) to sender (opponent). So we give these.
      // In the counter, these are the players we offer to give, i.e., from our roster.
      const sendIds = counteredTrade.items
        .filter((i) => i.direction === 'receive')
        .map((i) => i.golferId);

      setSelectedMyIds(sendIds.filter(id => myRoster.some(g => g.id === id)));
      setSelectedOpponentIds(receiveIds.filter(id => opponentRoster.some(g => g.id === id)));
    }
  }, [counteredTrade, myRoster, opponentRoster]);

  const handleToggleMy = (id: number) => {
    setSelectedMyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleOpponent = (id: number) => {
    setSelectedOpponentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMyIds.length === 0 || selectedOpponentIds.length === 0) {
      setError('You must select at least one golfer from each roster to propose a trade.');
      return;
    }

    startTransition(async () => {
      const res = await proposeTradeAction(
        opponent.id,
        selectedMyIds,
        selectedOpponentIds,
        counteredTrade?.id || undefined
      );

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/my-team?trade_proposed=true');
        router.refresh();
      }
    });
  };

  const renderRosterList = (
    golfers: Golfer[],
    selectedIds: number[],
    toggleFn: (id: number) => void,
    title: string,
    badgeText: string
  ) => {
    return (
      <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-black tracking-wider text-neutral-400 uppercase border-b border-neutral-800 pb-2 flex justify-between">
          <span>{title}</span>
          <span className="text-[10px] text-emerald-400 font-bold">{badgeText}</span>
        </h3>

        {golfers.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">Roster is empty.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {golfers.map((g) => {
              const isChecked = selectedIds.includes(g.id);
              return (
                <div
                  key={g.id}
                  onClick={() => toggleFn(g.id)}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition duration-150 select-none ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-neutral-950/40 border-neutral-850 hover:border-neutral-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-500">
                      #{g.rank}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white block leading-none">{g.name}</span>
                      <span className="text-[9px] text-neutral-500 block mt-1 uppercase font-semibold">{g.type}</span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by row click
                    className="w-4 h-4 rounded border-neutral-800 text-emerald-600 focus:ring-emerald-500/50 bg-neutral-950 accent-emerald-500 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getGolferNames = (ids: number[], list: Golfer[]) => {
    return ids
      .map((id) => list.find((g) => g.id === id)?.name || 'Unknown')
      .join(', ');
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-xl text-center font-semibold">
          {error}
        </div>
      )}

      {/* Roster columns comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderRosterList(
          myRoster,
          selectedMyIds,
          handleToggleMy,
          'Your Roster',
          'Golfers to Send'
        )}
        {renderRosterList(
          opponentRoster,
          selectedOpponentIds,
          handleToggleOpponent,
          `${opponent.teamName || opponent.name}'s Roster`,
          'Golfers to Receive'
        )}
      </div>

      {/* Propose/Summary Box */}
      <div className="bg-amber-950/10 border border-amber-900/20 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-xs font-black tracking-widest text-amber-500 uppercase mb-3">Trade Summary</h3>
        
        <div className="space-y-2 text-sm text-neutral-300">
          <div>
            <span className="font-extrabold text-white text-xs block uppercase tracking-wider mb-1">
              You Give:
            </span>
            {selectedMyIds.length === 0 ? (
              <span className="text-neutral-500 text-xs italic">Select players to send...</span>
            ) : (
              <span className="font-semibold text-emerald-300">{getGolferNames(selectedMyIds, myRoster)}</span>
            )}
          </div>

          <div className="pt-2">
            <span className="font-extrabold text-white text-xs block uppercase tracking-wider mb-1">
              You Get:
            </span>
            {selectedOpponentIds.length === 0 ? (
              <span className="text-neutral-500 text-xs italic">Select players to receive...</span>
            ) : (
              <span className="font-semibold text-amber-300">{getGolferNames(selectedOpponentIds, opponentRoster)}</span>
            )}
          </div>
        </div>

        <button
          onClick={handlePropose}
          disabled={isPending || selectedMyIds.length === 0 || selectedOpponentIds.length === 0}
          className="w-full mt-6 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-amber-900/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isPending
            ? 'Sending offer...'
            : counteredTrade
            ? 'Submit Counter-Offer'
            : 'Send Trade Proposal'}
        </button>
      </div>
    </div>
  );
}
