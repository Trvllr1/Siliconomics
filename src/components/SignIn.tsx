import React from 'react';
import { SignIn as ClerkSignIn, SignedOut, SignedIn, UserButton } from '@clerk/clerk-react';
import { Cpu, Monitor } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-art-cream flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border-2 border-art-ink/10 rounded-2xl shadow-xl p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-xl bg-art-rust flex items-center justify-center mx-auto">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-serif font-black text-art-ink">Siliconomics</h1>
              <p className="text-sm text-art-ink/60 italic">
                Board-level semiconductor cost intelligence
              </p>
              <div className="bg-art-cream/50 border border-art-ink/10 rounded-lg p-3 text-[11px] text-art-ink/50 font-mono text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-art-rust" />
                  <span className="font-bold text-art-ink/70">F100 Audits Active</span>
                </div>
                <p>Sign in to persist builds, decisions, and audit history. Authentication required for peer review and status transitions.</p>
              </div>
            </div>

            <div className="border-t border-art-ink/10 pt-6">
              <ClerkSignIn
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border-0 p-0',
                    headerTitle: 'text-lg font-serif font-black text-art-ink',
                    headerSubtitle: 'text-xs text-art-ink/60 italic',
                    formButtonPrimary: 'bg-art-rust hover:bg-art-rust/90 text-white font-bold text-xs py-2.5 rounded-lg',
                    formFieldInput: 'border-art-ink/10 rounded-lg text-xs py-2',
                    footerActionLink: 'text-art-rust text-xs',
                    dividerLine: 'bg-art-ink/10',
                    dividerText: 'text-art-ink/40 text-[10px]',
                    socialButtonsBlockButton: 'border-art-ink/10 rounded-lg text-xs py-2 hover:bg-art-cream/30',
                  },
                }}
              />
            </div>

            <div className="border-t border-art-ink/10 pt-4 text-center">
              <p className="text-[10px] text-art-ink/40 font-mono">
                Manhattan Standard v1.0 — ISO 26262 Compliant
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}

export function UserMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          userButtonAvatarBox: 'w-6 h-6',
          userButtonTrigger: 'hover:opacity-80 transition-opacity',
        },
      }}
    />
  );
}
