import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const CLERK_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY || '';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const AppComponent = React.lazy(() => import('../../App'));

function AppFallback() {
  return (
    <div className="min-h-screen bg-art-cream flex items-center justify-center">
      <div className="text-xs font-mono text-art-ink/30">Loading application...</div>
    </div>
  );
}

export default function AppShell() {
  const wrapped = (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<AppFallback />}>
        <AppComponent />
      </React.Suspense>
    </QueryClientProvider>
  );

  if (!CLERK_PUBLISHABLE_KEY) return wrapped;

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {wrapped}
    </ClerkProvider>
  );
}
