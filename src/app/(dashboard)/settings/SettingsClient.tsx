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
          <p>To update team details (name, abbreviation, logo) go to <span className="text-emerald-400 font-semibold">My Team → Edit Profile</span>.</p>
        </div>
      </div>
    </div>
  );
}
