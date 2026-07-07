'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { autoDraftGolfer } from '@/app/(dashboard)/drafts/[id]/actions';

interface User {
  id: number;
  name: string;
  teamName: string | null;
  teamAbbr: string | null;
  logoUrl: string | null;
}

interface DraftPick {
  id: number;
  userId: number;
  golferId: number;
  round: number;
  pickNumber: number;
  golferName: string;
  golferRank: number;
  userName: string;
  userTeamName: string | null;
  createdAt: string | Date;
}

interface Draft {
  id: number;
  type: string;
  status: string;
  currentRound: number;
  currentPick: number;
  pickOrder: string;
  tournamentName: string | null;
  createdAt: string | Date;
  startTime: string | Date | null;
  lastActionAt: string | Date | null;
  autoDraftUsers: string;
}

interface DraftTrackerBarProps {
  draft: Draft;
  users: User[];
  picks: DraftPick[];
  userId: number;
  onSelectUser?: (userId: number) => void;
}

export default function DraftTrackerBar({ draft, users, picks, userId, onSelectUser }: DraftTrackerBarProps) {
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [scheduledStartLeft, setScheduledStartLeft] = useState<number>(0);
  const isAutoDraftingRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  
  const pickOrder: number[] = JSON.parse(draft.pickOrder);
  const maxRounds = draft.type === 'long' ? 8 : 2;
  const totalPicksExpected = maxRounds * 10;
  
  let autoDraftUsers: number[] = [];
  try {
    autoDraftUsers = JSON.parse(draft.autoDraftUsers);
  } catch(e) {}

  const currentPick = draft.currentPick;
  const currentRound = draft.currentRound;
  const roundPickIndex = (currentPick - 1) % 10;
  const isEvenRound = currentRound % 2 === 0;
  const activePickerIndex = isEvenRound ? 9 - roundPickIndex : roundPickIndex;
  const activePickerId = pickOrder[activePickerIndex];
  
  const lastPickTime = draft.lastActionAt 
    ? new Date(draft.lastActionAt).getTime()
    : (draft.startTime ? new Date(draft.startTime).getTime() : new Date(draft.createdAt).getTime());

  useEffect(() => {
    if (draft.status === 'completed' || draft.status === 'paused') {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      const isScheduledToStart = draft.status === 'pending' && draft.startTime;
      const sTime = isScheduledToStart ? new Date(draft.startTime!).getTime() : null;
      const isEffectivelyActive = draft.status === 'active' || (isScheduledToStart && sTime !== null && sTime <= now);
      
      if (draft.status === 'pending' && !isEffectivelyActive) {
        if (sTime) {
          const diff = Math.floor((sTime - now) / 1000);
          setScheduledStartLeft(Math.max(0, diff));
        }
        setTimeLeft(60);
        return;
      }
      
      // If we are here, the draft is effectively active!
      // If lastActionAt isn't set yet (because no one has picked and no admin forced it),
      // but the scheduled time passed, we use the scheduled time as the base!
      const baseTime = draft.lastActionAt ? new Date(draft.lastActionAt).getTime() : (sTime || lastPickTime);
      const diffInSeconds = Math.floor((now - baseTime) / 1000);
      let remaining = Math.max(0, 60 - diffInSeconds);
      
      if (autoDraftUsers.includes(activePickerId)) {
        remaining = 0;
      }
      
      if (remaining === 0 && isEffectivelyActive && !isAutoDraftingRef.current) {
        isAutoDraftingRef.current = true;
        startTransition(async () => {
          await autoDraftGolfer(draft.id);
          // Wait for the server to revalidate, next poll will pick up the changes
          setTimeout(() => { isAutoDraftingRef.current = false; }, 3000);
        });
      }
      
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [lastPickTime, draft.status, draft.startTime, draft.lastActionAt, activePickerId, autoDraftUsers.join(',')]);

  if (draft.status === 'completed') {
    return (
      <div className="w-full bg-emerald-900 text-white p-2 text-center font-bold rounded-xl text-sm border border-emerald-700">
        DRAFT COMPLETED
      </div>
    );
  }

  // Determine Upcoming Picks
  const getUpcomingPicks = () => {
    const list = [];
    let p = draft.currentPick;
    let r = draft.currentRound;
    
    // We'll show the active pick + next 10 picks/separators
    while (list.length < 15 && p <= totalPicksExpected) {
      const idx = (p - 1) % 10;
      const isEven = r % 2 === 0;
      const uIndex = isEven ? 9 - idx : idx;
      const uId = pickOrder[uIndex];
      const uObj = users.find((u) => Number(u.id) === Number(uId));
      
      list.push({
        pickNumber: p,
        round: r,
        userId: Number(uId),
        userName: uObj?.teamName || uObj?.name || `Manager #${uId}`,
        logoUrl: uObj?.logoUrl,
        teamAbbr: uObj?.teamAbbr || 'TBD',
        isMe: Number(uId) === Number(userId),
        isAutoDraft: autoDraftUsers.includes(Number(uId)),
      });

      p++;
      r = Math.ceil(p / 10);
    }
    return list;
  };

  const upcoming = getUpcomingPicks();
  const isLowTime = timeLeft <= 10;
  const timerColor = isLowTime ? 'bg-red-600' : 'bg-emerald-600';
  const progressPercent = (timeLeft / 60) * 100;

  return (
    <div className="flex overflow-hidden whitespace-nowrap text-white font-sans uppercase tracking-wider text-sm select-none items-stretch rounded-xl border border-zinc-700 bg-zinc-900 h-[56px] shadow-lg">
      
      {/* Timer Section */}
      <div className="flex flex-col min-w-[90px] border-r border-zinc-700 bg-zinc-950 shrink-0">
        {draft.status === 'paused' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-2">
            <div className="text-amber-500 font-black text-sm tracking-widest animate-pulse">PAUSED</div>
          </div>
        ) : draft.status === 'pending' && draft.startTime && new Date(draft.startTime).getTime() > new Date().getTime() && scheduledStartLeft > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 border-r border-zinc-700 px-2 min-w-[120px]">
            <div className="text-zinc-400 text-[8px] font-bold">STARTS IN</div>
            <div className="text-emerald-400 font-black text-lg">
              {Math.floor(scheduledStartLeft / 3600).toString().padStart(2, '0')}:
              {Math.floor((scheduledStartLeft % 3600) / 60).toString().padStart(2, '0')}:
              {(scheduledStartLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ) : (
          <>
            <div className="text-zinc-400 text-[9px] text-center py-0.5 font-bold">
              RND {draft.currentRound} OF {maxRounds}
            </div>
            <div className={`flex-1 flex items-center justify-center text-xl font-black tabular-nums transition-colors ${isLowTime ? 'text-red-500' : 'text-emerald-400'}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
            <div className="h-1 w-full bg-zinc-800">
              <div 
                className={`h-full ${timerColor} transition-all duration-1000 ease-linear`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Picks Strip */}
      <div className="flex items-stretch">
        {upcoming.map((pick, i) => {
          const isActive = pick.pickNumber === draft.currentPick;
          const isRoundTransition = i > 0 && pick.round !== upcoming[i - 1].round;
          
          return (
            <React.Fragment key={pick.pickNumber}>
              {isRoundTransition && (
                <div className="flex items-center justify-center px-4 bg-zinc-950 border-r border-zinc-700 font-black text-zinc-500 text-[10px]">
                  RND {pick.round}
                </div>
              )}
              
              <div 
                onClick={() => onSelectUser && onSelectUser(pick.userId)}
                className={`relative flex items-center px-3 border-r border-zinc-700 transition-colors cursor-pointer hover:bg-emerald-800/60
                  ${isActive ? (timeLeft <= 10 ? 'bg-red-700 min-w-[180px]' : 'bg-emerald-700 min-w-[180px]') : (pick.isAutoDraft ? 'bg-neutral-900 opacity-60 grayscale' : 'bg-emerald-900/30 hover:bg-emerald-800/40')}
                  ${pick.isMe && !isActive && !pick.isAutoDraft ? 'ring-inset ring-2 ring-emerald-500 z-10 bg-emerald-900/50' : ''}
                `}
              >
                {/* Indicators */}
                {pick.isAutoDraft && !isActive ? (
                  <div className="absolute top-0 right-0 bg-red-600/90 text-white text-[8px] tracking-widest font-black px-1.5 rounded-bl shadow-sm z-20">
                    AUTO
                  </div>
                ) : pick.isMe && !isActive ? (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[8px] font-bold px-1 rounded-bl-sm">
                    YOU
                  </div>
                ) : null}
                
                <div className={`flex items-center gap-2 ${isActive ? 'w-full' : ''}`}>
                  <div className="relative flex items-center justify-center shrink-0">
                    {pick.logoUrl && pick.logoUrl.trim() !== '' ? (
                      <img src={pick.logoUrl} alt="Logo" className={`shrink-0 rounded-full object-cover border border-white/20 shadow-sm ${isActive ? 'w-8 h-8' : 'w-8 h-8 opacity-90'}`} />
                    ) : (
                      <div className={`shrink-0 rounded-full flex items-center justify-center font-black border border-white/20 shadow-sm
                        ${isActive ? 'w-8 h-8 bg-red-800 text-red-200 text-xs' : 'w-8 h-8 bg-emerald-950 text-emerald-400 text-xs opacity-90'}`}>
                        {pick.teamAbbr?.substring(0, 2) || 'TBD'}
                      </div>
                    )}
                  </div>
                  
                  {isActive ? (
                    <div className="flex flex-col justify-center">
                      <div className="text-[8px] font-bold text-red-200">
                        ON THE CLOCK: PICK {pick.pickNumber}
                      </div>
                      <div className="font-bold truncate max-w-[120px] text-xs">
                        {pick.userName}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center">
                      <div className="text-[8px] font-bold text-emerald-400/80 leading-none mb-0.5">
                        R{pick.round}P{pick.pickNumber}
                      </div>
                      <div className="text-[10px] font-bold text-white truncate max-w-[60px] leading-none uppercase">
                        {pick.teamAbbr?.substring(0, 4) || 'TBD'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
