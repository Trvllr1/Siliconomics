import { useMemo } from 'react';
import { useAuthUser, AuthUser } from '../../utils/auth';
import { localStorageAdapter } from './localStorageAdapter';
import { createApiAdapter } from './apiAdapter';
import type { StorageAdapter } from './storageAdapter';

export function useStorageAdapter(): StorageAdapter {
  const user: AuthUser = useAuthUser();
  const isDemo = user.id === 'demo-user';

  return useMemo(() => {
    if (isDemo) return localStorageAdapter;
    return createApiAdapter(user);
  }, [isDemo, user.id]);
}
