import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { comments, buildEvents } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const commentSchema = z.object({
  buildId: z.string().min(1),
  elementId: z.string().nullable().optional(),
  content: z.string().min(1),
  versionStamp: z.string().optional(),
});

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!await requireAuth(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const buildId = req.query.buildId as string;
        if (!buildId) return res.status(400).json({ error: 'buildId query param is required' });
        const result = await db.select().from(comments)
          .where(eq(comments.buildId, buildId))
          .orderBy(desc(comments.createdAt));
        return res.json(result);
      }
      case 'POST': {
        const parsed = commentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', detail: parsed.error.flatten() });
        }

        const [comment] = await db.insert(comments).values({
          buildId: parsed.data.buildId,
          elementId: parsed.data.elementId || null,
          authorId: req.userId!,
          authorName: req.body.authorName || 'Unknown',
          authorRole: req.body.authorRole || 'executive',
          content: parsed.data.content,
          versionStamp: parsed.data.versionStamp || null,
        }).returning();
        if (!comment) return res.status(500).json({ error: 'Failed to create comment' });

        await db.insert(buildEvents).values({
          buildId: parsed.data.buildId,
          actorId: req.userId!,
          eventType: 'commented',
          payload: { commentId: comment.id },
        });

        return res.status(201).json(comment);
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
