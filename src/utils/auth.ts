/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clerk auth integration.
 * Isolated behind helpers so Clerk can be swapped for Auth.js or another provider
 * without touching the rest of the codebase.
 */

import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import type { PersonaType } from '../types';

const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@siliconomics.local',
  persona: 'executive' as PersonaType,
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  persona: PersonaType;
  /** Lazy fetch of the Clerk session JWT for Authorization: Bearer ... calls.
   * Returns null when not signed in / demo mode. Resolved per-request so the
   * token is always fresh (Clerk session JWTs expire in ~60s) — never cached. */
  getToken?: () => Promise<string | null>;
}

/** Clerk hooks throw when rendered outside <ClerkProvider>, which main.tsx only
 * mounts when a publishable key is configured. Select the hook implementation
 * once at module load so demo mode never touches Clerk. */
const CLERK_ENABLED = Boolean((import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY);

function useClerkAuthUser(): AuthUser {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();
  const { user } = useUser();

  if (!isLoaded || !isSignedIn || !user) {
    return DEMO_USER;
  }

  return {
    id: user.id,
    name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Unknown',
    email: user.primaryEmailAddress?.emailAddress || '',
    persona: (user.publicMetadata?.persona as PersonaType) || 'executive',
    // Expose the Clerk session token getter. The apiAdapter calls this lazily
    // so we never attach an expired JWT. Previously the adapter sent
    // `Bearer ${user.id}` (a public Clerk user ID, NOT a JWT), which the server
    // middleware tried (and failed) to decode as a JWT — auth was broken.
    getToken: () => getToken(),
  };
}

function useDemoAuthUser(): AuthUser {
  return DEMO_USER;
}

export const useAuthUser: () => AuthUser = CLERK_ENABLED ? useClerkAuthUser : useDemoAuthUser;

export function getDemoUser(): AuthUser {
  return DEMO_USER;
}

export async function buildAuthHeaders(user: AuthUser): Promise<Record<string, string>> {
  if (user.id === 'demo-user' || !user.getToken) return {};
  const token = await user.getToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    'X-User-Name': user.name,
    'X-User-Persona': user.persona,
  };
}
