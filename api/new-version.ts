import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, requireAuth } from './middleware';
import { db } from '../db';
import { builds, buildEvents } from '../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAuth(req, res)) return;

  try {
    const { sourceBuildId, newName, changes } = req.body;
    if (!sourceBuildId) return res.status(400).json({ error: 'sourceBuildId is required' });

    const existing = await db.select().from(builds).where(eq(builds.id, sourceBuildId)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'Source build not found' });

    const source = existing[0];
    const verParts = source.version.match(/^v?(\d+)\.(\d+)$/);
    const newVersion = verParts ? `v${verParts[1]}.${parseInt(verParts[2]) + 1}` : 'v1.1';

    const [newBuild] = await db.insert(builds).values({
      name: newName || `Copy of ${source.name}`,
      description: source.description,
      creatorId: req.userId!,
      creatorName: source.creatorName,
      organization: source.organization,
      parentId: source.id,
      status: 'Draft',
      version: newVersion,
      owner: source.owner,
      portfolio: source.portfolio,
      referenceModel: source.referenceModel,
      formulaVersion: source.formulaVersion,
      designModel: changes?.designModel || source.designModel,
      architecture: changes?.architecture !== undefined ? changes.architecture : source.architecture,
      dataVintage: source.dataVintage,
    }).returning();

    await db.insert(buildEvents).values({
      buildId: newBuild.id,
      actorId: req.userId!,
      eventType: 'new_version',
      payload: { sourceBuildId, sourceVersion: source.version, newVersion },
    });

    return res.status(201).json(newBuild);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
