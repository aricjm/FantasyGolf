'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { saveMajorSelections } from './actions';

interface Tournament {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  status: string;
}

interface Selection {
  id: number;
  userId: number;
  tournamentId: string;
  tier1GolferId: number;
  tier2GolferId: number;
  tier3GolferId: number;
  tier4GolferId: number;
}

interface Golfer {
  id: number;
  name: string;
  rank: number;
  country: string | null;
  type: string;
}

interface MajorsTierSelectorProps {
  majors: Tournament[];
  selections: Selection[];
  tier1: Golfer[];
  tier2: Golfer[];
  tier3: Golfer[];
  tier4: Golfer[];
}

export default function MajorsTierSelector({
  majors,
  selections,
  tier1,
  tier2,
  tier3,
  tier4,
}: MajorsTierSelectorProps) {
  const [selectedMajorId, setSelectedMajorId] = useState(majors[0]?.id || '');
  const [t1, setT1] = useState<number | ''>('');
  const [t2, setT2] = useState<number | ''>('');
  const [t3, setT3] = useState<number | ''>('');
  const [t4, setT4] = useState<number | ''>('');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Load selections when active major changes
  const activeMajor = majors.find((m) => m.id === selectedMajorId);
  const activeSelection = selections.find((s) => s.tournamentId === selectedMajorId);

  useEffect(() => {
    if (activeSelection) {
      setT1(activeSelection.tier1GolferId);
      setT2(activeSelection.tier2GolferId);
      setT3(activeSelection.tier3GolferId);
      setT4(activeSelection.tier4GolferId);
    } else {
      setT1('');
      setT2('');
      setT3('');
      setT4('');
    }
    setError(null);
    setSuccess(false);
  }, [selectedMajorId, activeSelection]);

  if (majors.length === 0) {
    return (
      <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400">
        No Major tournaments seeded in the system.
      </div>
    );
  }

  // Check locking state
  const isLocked =
    activeMajor?.status === 'active' ||
    activeMajor?.status === 'completed' ||
    (activeMajor?.startDate && new Date() > new Date(activeMajor.startDate));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!t1 || !t2 || !t3 || !t4) {
      setError('Please select a golfer for all 4 Tiers.');
      return;
    }

    startTransition(async () => {
      const res = await saveMajorSelections(selectedMajorId, t1, t2, t3, t4);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  };

  const dropdownField = (label: string, value: number | '', setValue: (v: number) => void, list: Golfer[]) => {
    return (
      <div className="bg-neutral-900/40 border border-neutral-850 p-5 rounded-2xl backdrop-blur-xl space-y-3">
        <label className="block text-xs font-black tracking-widest text-emerald-400 uppercase">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
          disabled={isLocked || isPending}
          className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition disabled:opacity-50 disabled:pointer-events-none"
        >
          <option value="" disabled>-- Select a Golfer --</option>
          {list.map((g) => (
            <option key={g.id} value={g.id}>
              #{g.rank} - {g.name} ({g.country}) {g.type === 'liv' ? '[LIV]' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Selector Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-900/40 border border-neutral-850 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <select
            value={selectedMajorId}
            onChange={(e) => setSelectedMajorId(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-extrabold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md ${
            isLocked
              ? 'bg-red-950/40 border border-red-900/40 text-red-400'
              : 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-400'
          }`}>
            {isLocked ? 'Roster Locked' : 'Edits Allowed'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-xl text-center font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 text-emerald-200 text-sm rounded-xl text-center font-semibold">
          Major selections saved successfully!
        </div>
      )}

      {/* 2. Selections Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dropdownField('Tier 1 Selection', t1, setT1, tier1)}
          {dropdownField('Tier 2 Selection', t2, setT2, tier2)}
          {dropdownField('Tier 3 Selection', t3, setT3, tier3)}
          {dropdownField('Tier 4 Selection', t4, setT4, tier4)}
        </div>

        <button
          type="submit"
          disabled={isLocked || isPending || !t1 || !t2 || !t3 || !t4}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl transition shadow-lg shadow-emerald-700/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm"
        >
          {isPending ? 'Saving selections...' : isLocked ? 'Selections Locked' : 'Save Selections'}
        </button>
      </form>

      {/* Tournament Info Panel */}
      {activeMajor && (
        <div className="p-5 border border-neutral-900 bg-neutral-950/40 rounded-2xl text-xs text-neutral-400 space-y-1">
          <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">Tournament Schedule Details:</p>
          <p>• Major Event: {activeMajor.name}</p>
          <p>• Lock Date: {new Date(activeMajor.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>• Lock Time: {new Date(activeMajor.startDate).toLocaleTimeString()}</p>
          <p className="mt-2 text-amber-500/80">Selections cannot be changed once the tournament begins. If you do not save a player, you will receive 0 points for that tier.</p>
        </div>
      )}

    </div>
  );
}
