import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends VercelRequest {
  userId?: string;
  userPersona?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: VercelResponse): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return false;
  }

  try {
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    const clerkUserId = payload.sub as string;

    if (!clerkUserId) {
      res.status(401).json({ error: 'Invalid token: no subject' });
      return false;
    }

    req.userId = clerkUserId;
    req.userPersona = (payload as any).persona || 'executive';
    return true;
  } catch {
    res.status(401).json({ error: 'Invalid authentication token' });
    return false;
  }
}

export async function getUserPersona(clerkUserId: string): Promise<string> {
  try {
    const result = await db.select({ persona: users.persona }).from(users).where(eq(users.id, clerkUserId)).limit(1);
    return result[0]?.persona || 'executive';
  } catch {
    return 'executive';
  }
}
