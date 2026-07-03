import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/auth');

      if (!isLoggedIn && !isAuthPage) {
        // Redirect unauthenticated users to sign in page
        return Response.redirect(new URL('/auth/signin', nextUrl));
      }

      if (isLoggedIn && isAuthPage) {
        // Redirect logged-in users away from auth pages
        return Response.redirect(new URL('/my-team', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.teamName = (user as any).teamName;
        token.teamAbbr = (user as any).teamAbbr;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).teamName = token.teamName;
        (session.user as any).teamAbbr = token.teamAbbr;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
