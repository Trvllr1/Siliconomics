import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { snapshots } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAuth(req, res)) return;

  try {
    const buildId = req.query.buildId as string;
    if (!buildId) return res.status(400).json({ error: 'buildId query param is required' });

    const result = await db.select()
      .from(snapshots)
      .where(eq(snapshots.buildId, buildId))
      .orderBy(desc(snapshots.createdAt));

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
