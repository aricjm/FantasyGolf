import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">League Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Adjust your preferences and review official scoring rules.
        </p>
      </div>

      <SettingsClient />

    </div>
  );
}
