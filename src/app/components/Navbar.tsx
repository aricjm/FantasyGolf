'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface Opponent {
  id: number;
  name: string | null;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
}

interface NavbarProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string;
      teamName?: string;
      teamAbbr?: string;
      logoUrl?: string;
      role?: string;
    };
  } | null;
  opponents?: Opponent[];
}

export default function Navbar({ session, opponents = [] }: NavbarProps) {
  const pathname = usePathname();
  const [leagueOpen, setLeagueOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [opponentsOpen, setOpponentsOpen] = useState(false);
  
  const leagueRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const opponentsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (leagueRef.current && !leagueRef.current.contains(event.target as Node)) {
        setLeagueOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (opponentsRef.current && !opponentsRef.current.contains(event.target as Node)) {
        setOpponentsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/recaps') {
      return pathname.startsWith('/recaps');
    }
    return pathname === path;
  };

  const linkClass = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 ${
      active
        ? 'bg-emerald-800/40 text-emerald-300 border border-emerald-700/50'
        : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
    }`;

  const dropdownItemClass = (active: boolean) =>
    `block px-4 py-2 text-sm transition-all ${
      active
        ? 'bg-emerald-900/40 text-emerald-300 font-semibold'
        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
    }`;

  const user = session?.user;

  return (
    <nav className="bg-neutral-950/80 backdrop-blur-xl border-b border-emerald-900/30 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/my-team" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 p-1.5">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="32" cy="32" r="20" stroke="white" strokeWidth="2" fill="none"></circle>
                <circle cx="32" cy="32" r="12" stroke="white" strokeWidth="2" fill="none"></circle>
                <circle cx="32" cy="32" r="4" fill="white"></circle>
                <line x1="32" y1="32" x2="32" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"></line>
                <path d="M32 12 L32 20 L42 16 L32 12Z" fill="white"></path>
              </svg>
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight leading-none block">
                BLUDADS
              </span>
              <span className="text-[10px] text-emerald-500 font-bold tracking-widest leading-none block mt-0.5">
                FANTASY GOLF
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/my-team" className={linkClass(isActive('/my-team'))}>
            My Team
          </Link>

          {/* League Dropdown */}
          <div className="relative" ref={leagueRef}>
            <button
              onClick={() => setLeagueOpen(!leagueOpen)}
              className={`flex items-center gap-1 ${linkClass(
                isActive('/standings') || isActive('/settings') || isActive('/scoring') || isActive('/recaps')
              )}`}
            >
              League
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${leagueOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {leagueOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link href="/standings" className={dropdownItemClass(isActive('/standings'))} onClick={() => setLeagueOpen(false)}>
                  Standings
                </Link>
                <Link href="/scoring" className={dropdownItemClass(isActive('/scoring'))} onClick={() => setLeagueOpen(false)}>
                  Scoring Rules
                </Link>
                <Link href="/settings" className={dropdownItemClass(isActive('/settings'))} onClick={() => setLeagueOpen(false)}>
                  Settings
                </Link>
                <div className="h-px bg-neutral-800 my-1"></div>
                <Link href="/recaps?tab=drafts" className={dropdownItemClass(pathname.startsWith('/recaps') && pathname.includes('tab=drafts'))} onClick={() => setLeagueOpen(false)}>
                  Draft Recaps
                </Link>
                <Link href="/recaps?tab=trades" className={dropdownItemClass(pathname.startsWith('/recaps') && pathname.includes('tab=trades'))} onClick={() => setLeagueOpen(false)}>
                  Trade Recaps
                </Link>
                <Link href="/recaps?tab=transactions" className={dropdownItemClass(pathname.startsWith('/recaps') && pathname.includes('tab=transactions'))} onClick={() => setLeagueOpen(false)}>
                  Free Agency Recap
                </Link>
              </div>
            )}
          </div>

          <Link href="/free-agents" className={linkClass(isActive('/free-agents'))}>
            Free Agents
          </Link>

          <Link href="/fantasycast" className={linkClass(isActive('/fantasycast'))}>
            FantasyCast
          </Link>

          <Link href="/drafts" className={linkClass(isActive('/drafts') || pathname.startsWith('/drafts/'))}>
            Drafts
          </Link>

          <Link href="/standings" className={linkClass(isActive('/standings'))}>
            Standings
          </Link>

          <Link href="/majors" className={linkClass(isActive('/majors'))}>
            Majors
          </Link>

          {/* Opponents Dropdown */}
          {opponents.length > 0 && (
            <div className="relative" ref={opponentsRef}>
              <button
                onClick={() => setOpponentsOpen(!opponentsOpen)}
                className={`flex items-center gap-1 ${linkClass(
                  pathname.startsWith('/opposing-teams')
                )}`}
              >
                Opponents
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${opponentsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {opponentsOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-850">
                  {opponents.map((opp) => {
                    const isOppActive = pathname === `/opposing-teams/${opp.id}`;
                    return (
                      <Link
                        key={opp.id}
                        href={`/opposing-teams/${opp.id}`}
                        className={dropdownItemClass(isOppActive)}
                        onClick={() => setOpponentsOpen(false)}
                      >
                        <div className="flex items-center gap-2.5">
                          {opp.logoUrl ? (
                            <img src={opp.logoUrl} alt="Logo" className="w-5 h-5 rounded object-cover border border-white/10" />
                          ) : (
                            <div className="w-5 h-5 bg-emerald-950 border border-emerald-700/50 rounded flex items-center justify-center font-bold text-[9px] text-emerald-300 uppercase">
                              {opp.teamAbbr || 'OP'}
                            </div>
                          )}
                          <span className="truncate">{opp.teamName || opp.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-emerald-800/40 bg-neutral-900/40 hover:bg-neutral-800/40 transition-all duration-200"
          >
            {user?.logoUrl ? (
              <img src={user.logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 bg-emerald-950 border border-emerald-700/50 rounded-lg flex items-center justify-center font-bold text-xs text-emerald-300">
                {user?.teamAbbr || 'TD'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-white block leading-none">
                {user?.teamName || 'Team Name'}
              </span>
              <span className="text-[9px] text-emerald-500 font-extrabold tracking-wider uppercase block mt-0.5">
                {user?.teamAbbr || 'PTD'}
              </span>
            </div>
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-neutral-800">
                <span className="text-xs text-neutral-400 block">Logged in as</span>
                <span className="text-sm font-bold text-white block truncate">{user?.name}</span>
                <span className="text-xs text-emerald-400 font-semibold uppercase">{user?.role}</span>
              </div>
              
              <Link href="/my-team" className={dropdownItemClass(false)} onClick={() => setProfileOpen(false)}>
                My Team Profile
              </Link>
              <Link href="/settings" className={dropdownItemClass(false)} onClick={() => setProfileOpen(false)}>
                Roster Settings
              </Link>
              
              <div className="h-px bg-neutral-800 my-1"></div>
              
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 font-semibold transition-all"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Nav Links - Toggled from top bar */}
      <div className="lg:hidden flex items-center justify-center gap-1 mt-3 border-t border-neutral-900 pt-2 flex-wrap">
        <Link href="/my-team" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          My Team
        </Link>
        <Link href="/free-agents" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Free Agents
        </Link>
        <Link href="/fantasycast" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          FantasyCast
        </Link>
        <Link href="/drafts" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Drafts
        </Link>
        <Link href="/standings" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Standings
        </Link>
        <Link href="/majors" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Majors
        </Link>
        <Link href="/opposing-teams" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Opponents
        </Link>
        <Link href="/scoring" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Scoring
        </Link>
        <Link href="/settings" className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white">
          Settings
        </Link>
      </div>
    </nav>
  );
}
