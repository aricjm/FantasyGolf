import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const proxy = NextAuth(authConfig).auth;

export const config = {
  // Protect all routes except static assets, favicon, public files, and API endpoints
  // Note: We also allow /api/auth paths to bypass auth middleware so NextAuth can communicate.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
};
