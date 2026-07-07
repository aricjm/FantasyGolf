'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { adminUpdateTeamDetails } from './actions';

const PRESET_LOGOS = [
  { id: 'armadillo', url: '/images/team_logos/armadillo_approach_logo.png' },
  { id: 'badger', url: '/images/team_logos/badger_bunker_logo.png' },
  { id: 'bear', url: '/images/team_logos/bear_bogey_logo.png' },
  { id: 'beaver', url: '/images/team_logos/beaver_logo.jpg' },
  { id: 'chameleon', url: '/images/team_logos/chameleon_chip_logo.png' },
  { id: 'coyote', url: '/images/team_logos/coyote_cart_logo.png' },
  { id: 'eagle', url: '/images/team_logos/eagle_drive_logo.png' },
  { id: 'ferret', url: '/images/team_logos/ferret_fairway_logo.png' },
  { id: 'fox', url: '/images/team_logos/fox_fairway_logo.png' },
  { id: 'goat', url: '/images/team_logos/goat_gas_pedal_logo.png' },
  { id: 'gorilla', url: '/images/team_logos/gorilla_logo.jpg' },
  { id: 'hippo', url: '/images/team_logos/hippo_handicap_logo.png' },
  { id: 'jackrabbit', url: '/images/team_logos/jackrabbit_joyride_logo.png' },
  { id: 'koala', url: '/images/team_logos/koala_caddy_logo.png' },
  { id: 'octopus', url: '/images/team_logos/octopus_logo.jpg' },
  { id: 'owl', url: '/images/team_logos/owl_logo.jpg' },
  { id: 'parrot', url: '/images/team_logos/parrot_putter_logo.png' },
  { id: 'porcupine', url: '/images/team_logos/porcupine_putt_logo.png' },
  { id: 'ratcoon', url: '/images/team_logos/ratcoon_logo.jpg' },
  { id: 'rhino', url: '/images/team_logos/rhino_rough_logo.png' },
  { id: 'roadrunner', url: '/images/team_logos/roadrunner_logo.jpg' },
  { id: 'shark', url: '/images/team_logos/shark_logo.jpg' },
  { id: 'sloth', url: '/images/team_logos/sloth_logo.jpg' },
  { id: 'tiger', url: '/images/team_logos/tiger_tee_logo.png' },
  { id: 'turtle', url: '/images/team_logos/turtle_teeoff_logo.png' },
];

interface User {
  id: number;
  name: string;
  email: string;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
}

interface SettingsClientProps {
  isAdmin?: boolean;
  users?: User[];
}

export default function SettingsClient({ isAdmin, users = [] }: SettingsClientProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Load the initial theme on component mount
  useEffect(() => {
    const isLight = !document.documentElement.classList.contains('dark');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  // Theme toggle with localStorage persistence
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);

    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-bold text-white tracking-tight">App Preferences</h2>

      <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-5">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Theme Mode</span>
            <span className="text-xs text-neutral-500">Toggle between Light and Dark mode</span>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 border border-neutral-800 hover:border-emerald-800 bg-neutral-950 text-neutral-300 font-extrabold rounded-xl transition text-xs flex items-center gap-2"
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Dark Mode
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Light Mode
              </>
            )}
          </button>
        </div>

        <div className="border-t border-neutral-800 pt-5 text-xs text-neutral-500 space-y-1">
          <p>Theme preference is saved locally in your browser.</p>
          {!isAdmin && <p>To update team details (name, abbreviation, logo) go to <span className="text-emerald-400 font-semibold">My Team → Edit Profile</span>.</p>}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-12 space-y-6">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-xl font-black text-emerald-400 tracking-widest uppercase">Admin: Manage Teams</h2>
            <p className="text-xs text-neutral-400 mt-1">Edit profile details for any manager in the system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl">
                {editingUserId === user.id ? (
                  <form 
                    action={(formData) => {
                      startTransition(async () => {
                        const res = await adminUpdateTeamDetails(formData);
                        if (res.success) {
                          setEditingUserId(null);
                        } else {
                          alert(res.error);
                        }
                      });
                    }}
                    className="space-y-3"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Manager Name</label>
                      <input type="text" name="name" defaultValue={user.name} required className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Email</label>
                      <input type="email" name="email" defaultValue={user.email} required className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Team Name</label>
                      <input type="text" name="teamName" defaultValue={user.teamName || ''} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Team Abbr (Max 4)</label>
                      <input type="text" name="teamAbbr" defaultValue={user.teamAbbr || ''} maxLength={4} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white uppercase" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Logo URL</label>
                      <input 
                        type="text" 
                        name="logoUrl" 
                        value={editLogoUrl} 
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" 
                      />
                      <div className="mt-2 p-2 bg-neutral-950 border border-neutral-800 rounded-lg">
                        <span className="text-[9px] text-neutral-500 font-bold uppercase block mb-1.5">Or choose a preset</span>
                        <div className="grid grid-cols-8 gap-1">
                          {PRESET_LOGOS.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setEditLogoUrl(p.url)}
                              className={`w-full aspect-square rounded overflow-hidden border transition ${
                                editLogoUrl === p.url 
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/50 scale-105' 
                                  : 'border-neutral-800 hover:border-neutral-700'
                              }`}
                              title={p.id}
                            >
                              <img src={p.url} alt={p.id} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditingUserId(null)} className="px-3 py-1 text-xs text-neutral-400 hover:text-white">Cancel</button>
                      <button type="submit" disabled={isPending} className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition">Save</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.logoUrl ? (
                        <img src={user.logoUrl} alt="Logo" className="w-10 h-10 rounded-full bg-neutral-800 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-black text-sm">
                          {user.teamAbbr?.substring(0, 2) || user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white text-sm">{user.teamName || 'No Team Name'} <span className="text-emerald-500 ml-1">{user.teamAbbr ? `(${user.teamAbbr})` : ''}</span></div>
                        <div className="text-xs text-neutral-400">{user.name} • {user.email}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingUserId(user.id);
                        setEditLogoUrl(user.logoUrl || '');
                      }}
                      className="px-3 py-1.5 border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-bold rounded-lg transition"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
