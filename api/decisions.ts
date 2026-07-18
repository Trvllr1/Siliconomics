import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { decisions, buildEvents } from '../db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const decisionSchema = z.object({
  buildIds: z.array(z.string()).min(1),
  outcome: z.enum(['Proceed', 'Proceed with Risk', 'Requires Investigation', 'Hold', 'Reject']),
  rationale: z.string().min(1),
  followUpActions: z.array(z.string()).optional(),
});

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!await requireAuth(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const result = await db.select().from(decisions).orderBy(desc(decisions.createdAt));
        return res.json(result);
      }
      case 'POST': {
        const parsed = decisionSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', detail: parsed.error.flatten() });
        }

        const { buildIds, outcome, rationale, followUpActions } = parsed.data;

        const [decision] = await db.insert(decisions).values({
          buildIds,
          outcome,
          approverId: req.userId!,
          approverName: req.body.approverName || 'Unknown',
          rationale,
          followUpActions: followUpActions || [],
        }).returning();
        if (!decision) return res.status(500).json({ error: 'Failed to create decision' });

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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
