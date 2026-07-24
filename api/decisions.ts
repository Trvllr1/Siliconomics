import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { decisions, builds, buildEvents } from '../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

const decisionSchema = z.object({
  buildIds: z.array(z.string().uuid()).min(1),
  outcome: z.enum(['Proceed', 'Proceed with Risk', 'Requires Investigation', 'Hold', 'Reject']),
  rationale: z.string().min(1),
  followUpActions: z.array(z.string()).optional(),
});

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!await requireAuth(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const result = await db.select().from(decisions)
          .where(eq(decisions.approverId, req.userId!))
          .orderBy(desc(decisions.createdAt));
        return res.json(result);
      }
      case 'POST': {
        const parsed = decisionSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', detail: parsed.error.flatten() });
        }

        const { buildIds, outcome, rationale, followUpActions } = parsed.data;

        // Ensure all buildIds belong to the requesting user
        const userBuilds = await db.select({ id: builds.id }).from(builds)
          .where(and(eq(builds.creatorId, req.userId!), inArray(builds.id, buildIds)));
        if (userBuilds.length !== buildIds.length) {
          return res.status(403).json({ error: 'One or more builds not accessible' });
        }

        const [decision] = await db.insert(decisions).values({
          buildIds,
          outcome,
          approverId: req.userId!,
          approverName: req.body.approverName || 'Unknown',
          rationale,
          followUpActions: followUpActions || [],
        }).returning();
        if (!decision) return res.status(500).json({ error: 'Internal server error' });

        for (const buildId of buildIds) {
          await db.insert(buildEvents).values({
            buildId,
            actorId: req.userId!,
            eventType: 'decision_recorded',
            payload: { decisionId: decision.id, outcome },
          });
        }

        return res.status(201).json(decision);
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
