import type { VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { portfolios } from '../db/schema';
import { AuthenticatedRequest, requireAuth } from './middleware';

const portfolioSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2_000),
  buildIds: z.array(z.string().uuid()).max(200),
  tags: z.array(z.string().trim().min(1).max(64)).max(20),
  createdDate: z.string().date(),
});

const savePortfoliosSchema = z.object({
  portfolios: z.array(portfolioSchema).max(100),
});

function toPortfolio(portfolio: typeof portfolios.$inferSelect) {
  return {
    id: portfolio.id,
    name: portfolio.name,
    description: portfolio.description,
    buildIds: portfolio.buildIds as string[],
    tags: portfolio.tags as string[],
    createdDate: portfolio.createdAt.toISOString().slice(0, 10),
  };
}

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!await requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const result = await db.select().from(portfolios).where(eq(portfolios.ownerId, req.userId!));
      return res.json(result.map(toPortfolio));
    }

    if (req.method === 'PUT') {
      const parsed = savePortfoliosSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', detail: parsed.error.flatten() });
      }

      const existing = await db.select({ id: portfolios.id }).from(portfolios).where(eq(portfolios.ownerId, req.userId!));
      const existingIds = new Set(existing.map((portfolio) => portfolio.id));
      const incoming = parsed.data.portfolios;

      await db.delete(portfolios).where(eq(portfolios.ownerId, req.userId!));
      if (incoming.length === 0) return res.json([]);

      const saved = await db.insert(portfolios).values(incoming.map((portfolio) => ({
        ...(portfolio.id && existingIds.has(portfolio.id) ? { id: portfolio.id } : {}),
        name: portfolio.name,
        description: portfolio.description,
        ownerId: req.userId!,
        buildIds: portfolio.buildIds,
        tags: portfolio.tags,
        createdAt: new Date(`${portfolio.createdDate}T00:00:00.000Z`),
      }))).returning();

      return res.json(saved.map(toPortfolio));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}