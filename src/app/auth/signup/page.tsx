'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpUser } from '../actions';

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

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamAbbr, setTeamAbbr] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [leaguePassword, setLeaguePassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (teamAbbr.length > 4) {
      setError('Team abbreviation must be 4 characters or less');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('teamName', teamName);
    formData.append('teamAbbr', teamAbbr);
    formData.append('logoUrl', logoUrl);
    formData.append('leaguePassword', leaguePassword);

    try {
      const res = await signUpUser(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        // Redirect to sign in after successful sign up
        router.push('/auth/signin?registered=true');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-emerald-950 to-neutral-950 py-12 px-4">
      {/* Glassmorphic card */}
      <div className="w-full max-w-xl bg-neutral-900/60 backdrop-blur-xl border border-emerald-800/30 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 p-2">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="32" cy="32" r="20" stroke="white" strokeWidth="2" fill="none"></circle>
              <circle cx="32" cy="32" r="12" stroke="white" strokeWidth="2" fill="none"></circle>
              <circle cx="32" cy="32" r="4" fill="white"></circle>
              <line x1="32" y1="32" x2="32" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"></line>
              <path d="M32 12 L32 20 L42 16 L32 12Z" fill="white"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">BluDads</h1>
          <p className="text-xs text-emerald-500/80 mt-0.5">Create League Account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Your Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Fantasy Team Name *
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
                Abbreviation *
              </label>
              <input
                type="text"
                value={teamAbbr}
                onChange={(e) => setTeamAbbr(e.target.value.toUpperCase())}
                required
                maxLength={4}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm text-center font-bold tracking-widest"
                placeholder="PTD"
              />
            </div>
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

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-4 pr-12 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-455 hover:text-white transition focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              League Password (Required to Sign Up) *
            </label>
            <input
              type="text"
              value={leaguePassword}
              onChange={(e) => setLeaguePassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-950 border border-amber-800/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-sm font-semibold text-center"
              placeholder="Enter the passphrase provided by league commissioner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-700/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
