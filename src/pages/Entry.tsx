import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthForm } from '@/components/auth/AuthForm';
import { FileText, ArrowRight } from 'lucide-react';

export default function Entry() {
  const { continueAsGuest } = useAuthStore();
  const [view, setView] = useState<'options' | 'login' | 'signup'>('options');

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome to GridNote</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            A flexible, canvas-based workspace for your ideas.
          </p>
        </div>

        {view === 'options' && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => setView('signup')}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign Up
            </button>
            <button
              onClick={() => setView('login')}
              className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Log In
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <button
              onClick={continueAsGuest}
              className="group flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              Continue as Guest
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {view !== 'options' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => setView('options')}
              className="mb-4 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              &larr; Back
            </button>
            <AuthForm 
              initialIsLogin={view === 'login'} 
              onToggleMode={(isLogin) => setView(isLogin ? 'login' : 'signup')} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
