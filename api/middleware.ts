import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '@clerk/backend';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { PersonaType } from '../src/types';

export interface AuthenticatedRequest extends VercelRequest {
  userId?: string;
  userPersona?: PersonaType;
}

const DEMO_PERSONA: PersonaType = 'executive';

/**
 * Verify the Clerk session JWT from the Authorization header.
 *
 * Previously this decoder unsafely base64-decoded the JWT payload and trusted
 * the `sub` and `persona` claims from the client without signature verification.
 * That allowed any caller to mint identities/personas by hand-crafting a three-
 * part base64url token. We now verify the signature against Clerk's JWKS
 * (network call, cached internally by the SDK) or, when CLERK_JWT_KEY is set,
 * verify networklessly with the PEM public key from the Clerk dashboard.
 *
 * Persona is NEVER trusted from the token. It is loaded from the `users`
 * table (authoritative server-side state) and falls back to `executive` only
 * when the user row is absent — never from a client claim.
 */
export async function requireAuth(req: AuthenticatedRequest, res: VercelResponse): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return false;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Missing authentication token' });
    return false;
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  const jwtKey = process.env.CLERK_JWT_KEY;
  if (!secretKey && !jwtKey) {
    console.error('[auth] CLERK_SECRET_KEY (or CLERK_JWT_KEY) is not configured — cannot verify tokens.');
    res.status(500).json({ error: 'Authentication is not configured on the server.' });
    return false;
  }

  try {
    const payload = await verifyToken(token, {
      ...(secretKey ? { secretKey } : {}),
      ...(jwtKey ? { jwtKey } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      res.status(401).json({ error: 'Invalid token: no subject' });
      return false;
    }
    req.userId = clerkUserId;
    req.userPersona = await getUserPersona(clerkUserId);
    return true;
  } catch (err) {
    // Log the verifiable detail server-side only; never surface it to the client.
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[auth] token verification failed: ${reason}`);
    res.status(401).json({ error: 'Invalid or expired authentication token' });
    return false;
  }
}

/**
 * Load the user's persona from the `users` table.
 * Returns 'executive' (the least-privileged persona) only when the lookup
 * fails or the row is missing — never a client-supplied value.
 */
export async function getUserPersona(clerkUserId: string): Promise<PersonaType> {
  try {
    const result = await db
      .select({ persona: users.persona })
      .from(users)
      .where(eq(users.id, clerkUserId))
      .limit(1);
    const persona = result[0]?.persona;
    // Schema enum already restricts to valid PersonaType values; guard against
    // any drift so we never propagate an unknown string to persona-gated logic.
    const valid: PersonaType[] = ['architect', 'manufacturing', 'finance', 'program', 'executive'];
    return persona && (valid as string[]).includes(persona) ? (persona as PersonaType) : DEMO_PERSONA;
  } catch (err) {
    console.warn(`[auth] persona lookup failed for ${clerkUserId}:`, err instanceof Error ? err.message : err);
    return DEMO_PERSONA;
  }
}
