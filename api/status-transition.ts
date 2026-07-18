import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { builds, buildEvents, snapshots } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import { computeBuildMetrics } from '../src/utils/mathEngine';

const STATUS_FLOW: Record<string, string> = {
  Draft: 'TechnicalReview',
  TechnicalReview: 'FinancialReview',
  FinancialReview: 'ProgramReview',
  ProgramReview: 'Approved',
};

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAuth(req, res)) return;

  try {
    const { buildId } = req.body;
    if (!buildId) return res.status(400).json({ error: 'buildId is required' });

    const existing = await db.select().from(builds).where(eq(builds.id, buildId)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'Build not found' });

    const build = existing[0]!;
    const nextStatus = STATUS_FLOW[build.status];

    if (!nextStatus) {
      return res.status(400).json({ error: `No transition available from status "${build.status}"` });
    }

    const now = new Date();
    let contentHash: string | undefined;

    const updateData: Record<string, any> = {
      status: nextStatus,
      updatedDate: now,
    };

    if (build.status === 'Draft' && nextStatus === 'TechnicalReview') {
      const designModelStr = JSON.stringify(build.designModel);
      contentHash = createHash('sha256').update(designModelStr).digest('hex');

      updateData.frozenAt = now;
      updateData.contentHash = contentHash;

      const buildSnapshot = computeBuildMetrics({
        ...build,
        designModel: build.designModel as any,
        architecture: build.architecture as any,
      } as any);

      await db.insert(snapshots).values({
        buildId: build.id,
        snapshot: buildSnapshot.snapshot as any,
        contentHash,
      });
    }

    const [updated] = await db.update(builds)
      .set(updateData)
      .where(eq(builds.id, buildId))
      .returning();

    await db.insert(buildEvents).values({
      buildId,
      actorId: req.userId!,
      eventType: 'status_transition',
      payload: { from: build.status, to: nextStatus, contentHash },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
