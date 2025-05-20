
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Format: postgres://username:password@host:port/database",
  );
}

// Clean and validate database URL
const cleanDatabaseUrl = process.env.DATABASE_URL.trim();
// Properly encode special characters in the URL
const encodedUrl = cleanDatabaseUrl.replace(/#/g, '%23');

export const pool = new Pool({ 
  connectionString: encodedUrl,
  // Make SSL configuration conditional based on environment and connection string
  ...(process.env.NODE_ENV === 'production' && !encodedUrl.includes('localhost') ? {
    ssl: {
      rejectUnauthorized: false
    }
  } : {}),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });
