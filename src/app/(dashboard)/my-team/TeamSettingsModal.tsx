'use client';

import React, { useState, useTransition } from 'react';
import { updateTeamDetails } from './actions';

const PRESET_LOGOS = [
  { id: 'A', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23064e3b" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">A</text></svg>` },
  { id: 'B', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f766e" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">B</text></svg>` },
  { id: 'C', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231d4ed8" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">C</text></svg>` },
  { id: 'D', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236d28d9" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">D</text></svg>` },
  { id: 'E', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23be185d" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">E</text></svg>` },
  { id: 'F', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23b91c1c" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">F</text></svg>` },
  { id: 'G', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23c2410c" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">G</text></svg>` },
  { id: 'H', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2315803d" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">H</text></svg>` },
  { id: 'I', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230369a1" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">I</text></svg>` },
  { id: 'J', url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234d7c0f" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" font-family="sans-serif" font-weight="900" fill="%23ffffff">J</text></svg>` },
];

interface User {
  id: number;
  name: string;
  email: string;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
}

interface TeamSettingsModalProps {
  user: User;
}

export default function TeamSettingsModal({ user }: TeamSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState(user.teamName || '');
  const [teamAbbr, setTeamAbbr] = useState(user.teamAbbr || '');
  const [logoUrl, setLogoUrl] = useState(user.logoUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamName || !teamAbbr) {
      setError('Team name and abbreviation are required');
      return;
    }

    if (teamAbbr.length > 4) {
      setError('Abbreviation must be 4 characters or less');
      return;
    }

    const formData = new FormData();
    formData.append('teamName', teamName);
    formData.append('teamAbbr', teamAbbr);
    formData.append('logoUrl', logoUrl);

    startTransition(async () => {
      const res = await updateTeamDetails(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border border-neutral-800 hover:border-emerald-800/40 bg-neutral-950/50 hover:bg-neutral-800/40 text-neutral-300 hover:text-white font-bold rounded-xl transition text-sm flex items-center gap-1.5"
      >
        Edit Profile
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-extrabold text-white mb-6">Edit Team Profile</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Fantasy Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm"
                  placeholder="e.g. Par-Tee Dads"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Team Abbreviation (Max 4 characters)
                </label>
                <input
                  type="text"
                  value={teamAbbr}
                  onChange={(e) => setTeamAbbr(e.target.value.toUpperCase())}
                  required
                  maxLength={4}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm text-center font-black tracking-widest"
                  placeholder="PTD"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Team Logo
                </label>

                {/* Preview & File Upload */}
                <div className="flex items-center gap-4 p-4 bg-neutral-950 border border-neutral-850 rounded-xl">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800" />
                  ) : (
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center font-black text-xs text-neutral-500">
                      NONE
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider mb-1.5">
                      Upload Logo Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("File is too large! Please choose an image smaller than 2MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-neutral-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Preset Library Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                    Or select a preset logo:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_LOGOS.map((p) => {
                      const isSelected = logoUrl === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setLogoUrl(p.url)}
                          className={`w-10 h-10 rounded-lg overflow-hidden border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                              : 'border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <img src={p.url} alt={p.id} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text input URL fallback */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                    Or paste logo image URL:
                  </span>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl transition text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition text-sm font-bold shadow-lg shadow-emerald-700/20"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
