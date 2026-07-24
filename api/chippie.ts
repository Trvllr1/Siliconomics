import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChippieRequest } from './_lib/chippieCore.js';
// TODO: Add requireAuth gate — currently unauthenticated; anyone can call the Chippie chat endpoint.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  const { status, body } = await handleChippieRequest(req.body);
  res.status(status).json(body);
}
