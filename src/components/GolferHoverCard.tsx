'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GolferDetails {
  age: number | null;
  country: string | null;
  injury: {
    status: string;
    details: string | null;
  };
  news: {
    headline: string;
    description: string;
    published: string;
  } | null;
  historicalResults?: Array<{ tournament: string; points: number; date: string }>;
}

interface GolferHoverCardProps {
  espnId?: string | null;
  name: string;
  children: React.ReactNode;
}

export default function GolferHoverCard({ espnId, name, children }: GolferHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<GolferDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, isTop: true });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    
    if (triggerRef.current) {
      // Intentionally left blank, position is always centered via CSS now
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      if (espnId && !details && !loading) {
        fetchDetails();
      }
    }, 300); // 300ms delay before showing
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // slight delay before closing so user can move mouse into popup
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/golfers/${espnId}/details`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
      }
    } catch (e) {
      console.error('Failed to fetch details', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {mounted && isOpen && createPortal(
        <div 
          className={`fixed z-[9999] w-72 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header section with enlarged picture */}
          <div className="bg-neutral-950 p-4 flex flex-col items-center justify-center border-b border-neutral-800 relative">
            {espnId ? (
              <img
                src={`https://a.espncdn.com/i/headshots/golf/players/full/${espnId}.png`}
                alt={name}
                className="w-20 h-20 rounded-full bg-neutral-800 object-cover object-top border-2 border-neutral-700 shadow-lg z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-3xl text-neutral-500 font-bold z-10">
                {name.charAt(0)}
              </div>
            )}
            
            <h3 className="mt-3 text-lg font-black text-white text-center leading-tight">
              {name}
            </h3>
            
            <div className="flex items-center justify-center gap-3 mt-1 text-xs text-neutral-400 font-medium">
              {loading ? (
                <div className="h-4 w-20 bg-neutral-800 rounded animate-pulse"></div>
              ) : (
                <>
                  <span>{details?.country || 'Unknown Country'}</span>
                  {details?.age && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                      <span>Age {details.age}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-neutral-900 flex flex-col gap-4">
            
            {/* News Section */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b border-neutral-800 pb-1">
                Latest News
              </h4>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-neutral-800 rounded w-full animate-pulse"></div>
                </div>
              ) : details?.news ? (
                <div>
                  <p className="text-xs font-bold text-neutral-200 leading-tight mb-1">
                    {details.news.headline}
                  </p>
                  <p className="text-[10px] text-neutral-400 line-clamp-3 leading-relaxed">
                    {details.news.description}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 italic">No recent news available.</p>
              )}
            </div>

            {/* Injury Section */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 border-b border-neutral-800 pb-1">
                Injury Report
              </h4>
              {loading ? (
                <div className="h-3 bg-neutral-800 rounded w-1/2 animate-pulse"></div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${details?.injury?.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-bold text-neutral-300">
                      Status: {details?.injury?.status || 'Unknown'}
                    </span>
                  </div>
                  {details?.injury?.status !== 'Active' && details?.injury?.details && (
                    <p className="text-[10px] text-neutral-400 bg-red-950/20 p-2 rounded border border-red-900/30">
                      {details.injury.details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 2025 Results Section */}
            <div className="space-y-1.5 mt-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border-b border-neutral-800 pb-1">
                2025 Results
              </h4>
              {loading ? (
                <div className="space-y-1 mt-1">
                  <div className="h-4 bg-neutral-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-neutral-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                </div>
              ) : details?.historicalResults && details.historicalResults.length > 0 ? (
                <div className="max-h-32 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                  {details.historicalResults.map((result, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800/50">
                      <span className="text-neutral-300 truncate pr-2">{result.tournament}</span>
                      <span className="font-bold text-emerald-400 whitespace-nowrap">{result.points} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 italic mt-1">No historical results available.</p>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
