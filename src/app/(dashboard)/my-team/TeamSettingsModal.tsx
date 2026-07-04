'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { updateTeamDetails } from './actions';

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
  const [mounted, setMounted] = useState(false);
  const [hoveredLogo, setHoveredLogo] = useState<{ id: string; url: string } | null>(null);

  // Set mounted on client side to enable React Portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state values when modal is opened or user prop changes from parent revalidation
  useEffect(() => {
    if (isOpen) {
      setTeamName(user.teamName || '');
      setTeamAbbr(user.teamAbbr || '');
      setLogoUrl(user.logoUrl || '');
      setError(null);
    }
  }, [isOpen, user]);

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

  const modalContent = isOpen ? (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] grid place-items-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 text-left">
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
                      onMouseEnter={() => setHoveredLogo(p)}
                      onMouseLeave={() => setHoveredLogo(null)}
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

              {/* Large Hover/Selection Preview Card */}
              <div className="mt-4 p-3 bg-neutral-950/40 border border-neutral-850/60 rounded-xl flex items-center gap-4 transition duration-200">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-850 flex-shrink-0 flex items-center justify-center shadow-md">
                  {logoUrl || hoveredLogo ? (
                    <img 
                      src={hoveredLogo ? hoveredLogo.url : logoUrl} 
                      alt="Large Preview" 
                      className="w-full h-full object-cover animate-in fade-in duration-200" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-bold">
                      NONE
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">
                    {hoveredLogo ? 'Hovering Preset' : 'Selected Logo'}
                  </span>
                  <span className="text-xs font-black text-white capitalize mt-0.5 block tracking-wide">
                    {(() => {
                      const currentUrl = hoveredLogo ? hoveredLogo.url : logoUrl;
                      if (!currentUrl) return 'No Logo Selected';
                      const match = PRESET_LOGOS.find(p => p.url === currentUrl);
                      if (match) return match.id.replace(/_logo/g, '').replace(/_/g, ' ');
                      return currentUrl.startsWith('data:') ? 'Custom Uploaded Image' : 'Custom Web URL';
                    })()}
                  </span>
                </div>
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
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border border-neutral-800 hover:border-emerald-800/40 bg-neutral-950/50 hover:bg-neutral-800/40 text-neutral-300 hover:text-white font-bold rounded-xl transition text-sm flex items-center gap-1.5"
      >
        Edit Profile
      </button>

      {mounted && isOpen && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
