'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Rival {
  id: number;
  name: string | null;
  teamName: string | null;
  teamAbbr: string | null;
}

interface RivalSelectorProps {
  opponents: Rival[];
  currentOpponentId: number;
}

export default function RivalSelector({ opponents, currentOpponentId }: RivalSelectorProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-400 text-xs font-bold uppercase">Rival Roster:</span>
      <select
        value={currentOpponentId}
        onChange={(e) => {
          router.push(`/opposing-teams/${e.target.value}`);
        }}
        className="bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold cursor-pointer"
      >
        {opponents.map((o) => (
          <option key={o.id} value={o.id}>
            {o.teamName || o.name || `Team ${o.id}`} ({o.teamAbbr || 'TBD'})
          </option>
        ))}
      </select>
    </div>
  );
}
