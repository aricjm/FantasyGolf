'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { handleTradeProposal } from './actions';

interface TradeItem {
  golferId: number;
  name: string;
  rank: number;
  direction: string; // 'send' or 'receive'
}

interface Trade {
  id: number;
  senderId: number;
  senderName: string;
  senderTeamName: string | null;
  status: string;
  items: TradeItem[];
}

interface TradeAlertProps {
  trade: Trade;
}

export default function TradeAlert({ trade }: TradeAlertProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const incomingPlayers = trade.items.filter((i) => i.direction === 'send'); // sent from sender to us (we get these)
  const outgoingPlayers = trade.items.filter((i) => i.direction === 'receive'); // sent from us to sender (we give these)

  const handleAction = async (action: 'accept' | 'decline') => {
    setError(null);
    if (action === 'accept' && !confirm('Are you sure you want to accept this trade? Roster transactions are final.')) {
      return;
    }

    startTransition(async () => {
      const res = await handleTradeProposal(trade.id, action);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleCounter = () => {
    // Navigate to trade proposal screen with counter details
    router.push(`/trades?counter=${trade.id}`);
  };

  return (
    <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl animate-in slide-in-from-left-4 duration-300">
      <div className="absolute top-0 right-0 bg-amber-600/20 text-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-bl-xl border-l border-b border-amber-900/30">
        Pending Offer
      </div>

      <h3 className="text-base font-extrabold text-white">
        Trade Offer from <span className="text-amber-400">{trade.senderTeamName || trade.senderName}</span>
      </h3>

      {error && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-xs rounded-xl text-center font-medium">
          {error}
        </div>
      )}

      {/* Trade contents comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pb-4 border-b border-neutral-800/50">
        
        {/* You Receive */}
        <div className="space-y-2">
          <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">You Will Receive:</span>
          <div className="space-y-1.5">
            {incomingPlayers.map((p) => (
              <div key={p.golferId} className="flex items-center gap-2 bg-neutral-950/40 border border-neutral-850 p-2 rounded-xl text-sm">
                <span className="text-neutral-500 font-bold text-xs w-8 text-center bg-neutral-900 px-1 py-0.5 rounded">#{p.rank}</span>
                <span className="font-semibold text-white">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* You Give */}
        <div className="space-y-2">
          <span className="text-[10px] text-red-400 font-black tracking-widest uppercase">You Will Send:</span>
          <div className="space-y-1.5">
            {outgoingPlayers.map((p) => (
              <div key={p.golferId} className="flex items-center gap-2 bg-neutral-950/40 border border-neutral-850 p-2 rounded-xl text-sm">
                <span className="text-neutral-500 font-bold text-xs w-8 text-center bg-neutral-900 px-1 py-0.5 rounded">#{p.rank}</span>
                <span className="font-semibold text-white">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => handleAction('accept')}
          disabled={isPending}
          className="flex-1 min-w-[100px] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs shadow-md shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Processing...' : 'Accept Trade'}
        </button>
        <button
          onClick={handleCounter}
          disabled={isPending}
          className="flex-1 min-w-[100px] py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white font-bold rounded-xl transition text-xs active:scale-95 disabled:opacity-50"
        >
          Counter Offer
        </button>
        <button
          onClick={() => handleAction('decline')}
          disabled={isPending}
          className="flex-1 min-w-[100px] py-2.5 bg-red-950/30 hover:bg-red-900/20 border border-red-900/30 text-red-400 hover:text-red-300 font-bold rounded-xl transition text-xs active:scale-95 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
