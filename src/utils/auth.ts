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
}

export function useAuthUser(): AuthUser {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();

  if (!isLoaded || !isSignedIn || !user) {
    return DEMO_USER;
  }

  return {
    id: user.id,
    name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Unknown',
    email: user.primaryEmailAddress?.emailAddress || '',
    persona: (user.publicMetadata?.persona as PersonaType) || 'executive',
  };
}

export function getDemoUser(): AuthUser {
  return DEMO_USER;
}

export function buildAuthHeaders(user: AuthUser): Record<string, string> {
  if (user.id === 'demo-user') return {};
  return {
    Authorization: `Bearer ${user.id}`,
    'X-User-Name': user.name,
    'X-User-Persona': user.persona,
  };
}
