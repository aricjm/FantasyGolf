'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';

export async function signUpUser(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const teamName = formData.get('teamName') as string;
    const teamAbbr = formData.get('teamAbbr') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const leaguePassword = formData.get('leaguePassword') as string;

    if (!name || !email || !password || !teamName || !teamAbbr || !leaguePassword) {
      return { error: 'Please fill in all required fields' };
    }

    // Verify league passcode
    if (leaguePassword.trim() !== 'pgadads') {
      return { error: 'Invalid league registration passphrase' };
    }

    // Check abbreviation length
    if (teamAbbr.length > 4) {
      return { error: 'Team abbreviation must be 4 characters or less' };
    }

    // Check if email already registered
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return { error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into database
    await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      teamName,
      teamAbbr: teamAbbr.toUpperCase(),
      logoUrl: logoUrl || null,
      role: 'user', // Default role
    });

    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: error.message || 'Something went wrong during registration' };
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { error: 'Please enter both email and password' };
    }

    await signIn('credentials', {
      email,
      password,
      redirectTo: '/my-team',
    });

    return { success: true };
  } catch (error: any) {
    // NextAuth uses redirect errors, we need to let them pass through
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return { error: 'Invalid credentials or user does not exist' };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const leaguePassword = formData.get('leaguePassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!email || !leaguePassword || !newPassword) {
      return { error: 'All fields are required' };
    }

    // Verify league passphrase
    if (leaguePassword.trim() !== 'pgadads') {
      return { error: 'Invalid league passphrase' };
    }

    if (newPassword.length < 8) {
      return { error: 'New password must be at least 8 characters' };
    }

    // Check user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return { error: 'No account found with that email address' };
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.email, email));

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { error: error.message || 'Something went wrong. Please try again.' };
  }
}
