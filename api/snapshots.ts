import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { builds, snapshots } from '../db/schema';
import { and, desc, eq } from 'drizzle-orm';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAuth(req, res)) return;

  try {
    const buildId = req.query.buildId as string;
    if (!buildId) return res.status(400).json({ error: 'buildId query param is required' });

    const result = await db.select({ snapshot: snapshots })
      .from(snapshots)
      .innerJoin(builds, eq(snapshots.buildId, builds.id))
      .where(and(eq(snapshots.buildId, buildId), eq(builds.creatorId, req.userId!)))
      .orderBy(desc(snapshots.createdAt));

    return res.json(result.map(({ snapshot }) => snapshot));
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
