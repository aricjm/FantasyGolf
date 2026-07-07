import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = (session.user as any).role === 'admin';
  let allUsers: any[] = [];
  
  if (isAdmin) {
    allUsers = await db.select().from(users).orderBy(users.id);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Adjust your app preferences and display options.
        </p>
      </div>

      <SettingsClient isAdmin={isAdmin} users={allUsers} />

    </div>
  );
}
