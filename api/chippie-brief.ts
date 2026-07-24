import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChippieBriefing } from './_lib/chippieCore.js';
// TODO: Add requireAuth gate — currently unauthenticated; anyone can call the Chippie briefing endpoint.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  const { status, body } = await handleChippieBriefing(req.body);
  res.status(status).json(body);
}
