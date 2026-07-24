import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { builds, buildEvents } from '../db/schema';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';

const FREEZE_STATUSES = ['TechnicalReview', 'FinancialReview', 'ProgramReview', 'Approved', 'Alert'];

const updateBuildSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  designModel: z.record(z.string(), z.any()).optional(),
  architecture: z.record(z.string(), z.any()).nullable().optional(),
  dataVintage: z.record(z.string(), z.any()).nullable().optional(),
  referenceModel: z.string().optional(),
  formulaVersion: z.string().optional(),
  portfolio: z.string().optional(),
  owner: z.string().optional(),
  organization: z.string().optional(),
});

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!await requireAuth(req, res)) return;

  try {
    switch (req.method) {
      case 'GET':
        return getBuilds(req, res);
      case 'POST':
        return createBuild(req, res);
      case 'PATCH':
        return updateBuild(req, res);
      case 'DELETE':
        return deleteBuild(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

async function getBuilds(req: AuthenticatedRequest, res: VercelResponse) {
  const id = req.query.id as string | undefined;
  const includeFrozen = req.query.includeFrozen === 'true';

  if (id) {
    const build = await db.select().from(builds).where(and(eq(builds.id, id), isNull(builds.deletedAt))).limit(1);
    if (!build.length) return res.status(404).json({ error: 'Build not found' });
    return res.json(build[0]);
  }

  let query = db.select().from(builds).where(isNull(builds.deletedAt)).orderBy(desc(builds.updatedDate));

  if (!includeFrozen) {
    query = db.select().from(builds).where(and(isNull(builds.deletedAt), isNull(builds.frozenAt))).orderBy(desc(builds.updatedDate)) as any;
  }

  const result = await query;
  return res.json(result);
}

async function createBuild(req: AuthenticatedRequest, res: VercelResponse) {
  const body = req.body;
  if (!body.name || !body.designModel) {
    return res.status(400).json({ error: 'name and designModel are required' });
  }

  const [build] = await db.insert(builds).values({
    name: body.name,
    description: body.description || '',
    creatorId: req.userId!,
    creatorName: body.creatorName || 'Unknown',
    organization: body.organization || '',
    parentId: body.parentId || null,
    status: 'Draft',
    version: body.version || 'v1.0',
    owner: body.owner || '',
    portfolio: body.portfolio || '',
    referenceModel: body.referenceModel || '',
    formulaVersion: body.formulaVersion || 'Murphy-SIA-v4.2',
    designModel: body.designModel,
    architecture: body.architecture || null,
    dataVintage: body.dataVintage || null,
  }).returning();
  if (!build) return res.status(500).json({ error: 'Failed to create build' });

  await db.insert(buildEvents).values({
    buildId: build.id,
    actorId: req.userId!,
    eventType: 'created',
    payload: { name: build.name },
  });

  return res.status(201).json(build);
}

async function updateBuild(req: AuthenticatedRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'id query param is required' });

  const existing = await db.select().from(builds).where(and(eq(builds.id, id), isNull(builds.deletedAt))).limit(1);
  if (!existing.length) return res.status(404).json({ error: 'Build not found' });

  const build = existing[0]!;

  if (build.frozenAt) {
    return res.status(409).json({
      error: 'Build is frozen',
      detail: `This build was frozen on ${build.frozenAt} and cannot be modified. Create a new version instead.`,
      frozenAt: build.frozenAt,
      contentHash: build.contentHash,
    });
  }

  if (FREEZE_STATUSES.includes(build.status)) {
    return res.status(409).json({
      error: 'Build is under review',
      detail: `Build status is "${build.status}". Create a new version to make changes.`,
    });
  }

  const parsed = updateBuildSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', detail: parsed.error.flatten() });
  }

  const [updated] = await db.update(builds)
    .set({
      ...parsed.data,
      updatedDate: new Date(),
    })
    .where(eq(builds.id, id))
    .returning();
  if (!updated) return res.status(500).json({ error: 'Failed to update build' });

  await db.insert(buildEvents).values({
    buildId: id,
    actorId: req.userId!,
    eventType: 'updated',
    payload: { fields: Object.keys(parsed.data) },
  });

  return res.json(updated);
}

async function deleteBuild(req: AuthenticatedRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'id query param is required' });

  const existing = await db.select().from(builds).where(and(eq(builds.id, id), isNull(builds.deletedAt))).limit(1);
  if (!existing.length) return res.status(404).json({ error: 'Build not found' });

  const build = existing[0]!;
  if (build.frozenAt || FREEZE_STATUSES.includes(build.status)) {
    return res.status(409).json({
      error: 'Build is frozen',
      detail: 'Frozen or review Builds cannot be deleted. Create a new version instead.',
    });
  }

  const deletedAt = new Date();
  const [deleted] = await db.update(builds)
    .set({ deletedAt, updatedDate: deletedAt })
    .where(and(eq(builds.id, id), isNull(builds.deletedAt)))
    .returning();
  if (!deleted) return res.status(404).json({ error: 'Build not found' });

  await db.insert(buildEvents).values({
    buildId: id,
    actorId: req.userId!,
    eventType: 'deleted',
    payload: { name: build.name, deletedAt: deletedAt.toISOString() },
  });

  return res.status(204).end();
}
