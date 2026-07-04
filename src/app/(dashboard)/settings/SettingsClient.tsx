'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsClient() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      {/* Prefs Panel (Col 1) */}
      <div className="xl:col-span-1 space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">App Preferences</h2>
        
        <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Theme Mode</span>
              <span className="text-xs text-neutral-500">Toggle between Light and Dark mode</span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="px-4 py-2 border border-neutral-800 hover:border-emerald-800 bg-neutral-950 text-neutral-300 font-extrabold rounded-xl transition text-xs flex items-center gap-1.5"
            >
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scoring Rules Panel (Col 2 & 3) */}
      <div className="xl:col-span-2 space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Scoring System</h2>
        
        <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-sm font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
              Hole-by-Hole Points
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Points are awarded for every hole played during the tournament based on the golfer's score relative to par:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Eagle</span>
                  <span className="font-bold text-white">+8 points</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Birdie</span>
                  <span className="font-bold text-emerald-400">+4 points</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Par</span>
                  <span className="font-bold text-white">+1 point</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Bogey</span>
                  <span className="font-bold text-red-400">-4 points</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Double Bogey</span>
                  <span className="font-bold text-red-500">-8 points</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Triple Bogey or worse</span>
                  <span className="font-bold text-red-600">-12 points</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Albatross</span>
                  <span className="font-bold text-white">+20 points</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                  <span>Hole in One</span>
                  <span className="font-bold text-white">+12 points</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black tracking-widest text-emerald-400 uppercase border-b border-neutral-800 pb-2 mb-3">
              Tournament Placement Points
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Upon conclusion of each tournament, golfers who made the cut earn finishing position points:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-neutral-300">
              <div className="bg-neutral-950/40 p-3 border border-neutral-850 rounded-xl text-center">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold mb-1">1st Place</span>
                <span className="text-base font-black text-emerald-400">+30 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-3 border border-neutral-850 rounded-xl text-center">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold mb-1">2nd Place</span>
                <span className="text-base font-black text-white">+28 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-3 border border-neutral-850 rounded-xl text-center">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold mb-1">3rd Place</span>
                <span className="text-base font-black text-white">+26 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-3 border border-neutral-850 rounded-xl text-center">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold mb-1">4th Place</span>
                <span className="text-base font-black text-white">+24 pts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-3 text-xs text-neutral-300">
              <div className="bg-neutral-950/40 p-2.5 border border-neutral-850 rounded-lg text-center">
                <span className="text-[9px] text-neutral-500 block">5th</span>
                <span className="font-bold text-white">+22 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-2.5 border border-neutral-850 rounded-lg text-center">
                <span className="text-[9px] text-neutral-500 block">6th</span>
                <span className="font-bold text-white">+20 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-2.5 border border-neutral-850 rounded-lg text-center">
                <span className="text-[9px] text-neutral-500 block">7th</span>
                <span className="font-bold text-white">+18 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-2.5 border border-neutral-850 rounded-lg text-center">
                <span className="text-[9px] text-neutral-500 block">8th</span>
                <span className="font-bold text-white">+16 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-2.5 border border-neutral-850 rounded-lg text-center">
                <span className="text-[9px] text-neutral-500 block">9th</span>
                <span className="font-bold text-white">+14 pts</span>
              </div>
              <div className="bg-neutral-950/40 p-2.5 border border-neutral-850 rounded-lg text-center">
                <span className="text-[9px] text-neutral-500 block">10th</span>
                <span className="font-bold text-white">+12 pts</span>
              </div>
            </div>

            <div className="mt-4 p-4 border border-neutral-900 bg-neutral-950/40 rounded-xl text-xs text-neutral-400 space-y-1">
              <p>• 11th - 15th Position: 10 points</p>
              <p>• 16th - 20th Position: 8 points</p>
              <p>• 21st - 25th Position: 6 points</p>
              <p>• 26th - 30th Position: 4 points</p>
              <p>• 30th place and below (who made the cut): 2 points</p>
              <p className="text-[10px] text-red-400 mt-2 font-bold">Missed Cut / DQ / WD: Golfers who miss the cut or do not finish the event receive 0 placement points.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
