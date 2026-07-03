import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL environment variable is not defined. Database connections will fail at runtime.');
}

// Fallback to a mock string at build time to prevent compile-time crashes
const sql = neon(databaseUrl || 'postgres://placeholder_user:placeholder_pwd@localhost:5432/placeholder_db');
export const db = drizzle(sql, { schema });
