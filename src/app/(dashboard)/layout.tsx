import React from 'react';
import { auth } from '@/auth';
import Navbar from '@/app/components/Navbar';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  let navbarSession = session;
  if (session?.user?.id) {
    const userId = parseInt(session.user.id, 10);
    const [user] = await db
      .select({
        logoUrl: users.logoUrl,
        teamAbbr: users.teamAbbr,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      navbarSession = {
        ...session,
        user: {
          ...session.user,
          logoUrl: user.logoUrl || undefined,
          teamAbbr: user.teamAbbr || undefined,
        } as any,
      };
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Main navigation */}
      <Navbar session={navbarSession} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/40 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} BluDads Fantasy Golf League. All rights reserved.</p>
      </footer>
    </div>
  );
}
