import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// If running in Vercel Serverless environment and using SQLite
if (process.env.VERCEL) {
  const tmpDb = '/tmp/dev.db';
  if (!fs.existsSync(tmpDb)) {
    const candidatePaths = [
      path.join(process.cwd(), 'backend', 'prisma', 'dev.db'),
      path.join(process.cwd(), 'prisma', 'dev.db'),
      path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
      path.join(__dirname, '..', 'prisma', 'dev.db')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          fs.copyFileSync(p, tmpDb);
          console.log(`[Vercel DB] Copied initial database from ${p} to ${tmpDb}`);
          break;
        } catch (e) {
          console.error(`[Vercel DB] Failed to copy database from ${p}:`, e);
        }
      }
    }
  }

  // If DATABASE_URL is not set or points to local file, use /tmp
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    process.env.DATABASE_URL = `file:${tmpDb}`;
  }
}

export const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL ? {
    db: { url: process.env.DATABASE_URL }
  } : undefined
});