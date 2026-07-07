'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface DraftOption {
  id: number;
  type: string;
  tournamentName: string | null;
}

interface DraftSelectorProps {
  drafts: DraftOption[];
  activeDraftId: number | string;
}

export default function DraftSelector({ drafts, activeDraftId }: DraftSelectorProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-400 text-xs font-bold uppercase">Select Draft:</span>
      <select
        value={activeDraftId}
        onChange={(e) => {
          router.push(`/recaps?tab=drafts&draft=${e.target.value}`);
        }}
        className="bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold cursor-pointer"
      >
        {drafts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.type === 'long' ? 'Preseason Long Draft' : `${d.tournamentName} (Short)`}
          </option>
        ))}
      </select>
    </div>
  );
}
