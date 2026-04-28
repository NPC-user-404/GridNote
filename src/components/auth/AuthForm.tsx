import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface AuthFormProps {
  initialIsLogin?: boolean;
  onSuccess?: () => void;
  onToggleMode?: (isLogin: boolean) => void;
  hideHeader?: boolean;
}

export function AuthForm({ initialIsLogin = true, onSuccess, onToggleMode, hideHeader = false }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const handleToggle = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    setError(null);
    if (onToggleMode) onToggleMode(newIsLogin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Login error:", error);
          throw error;
        }

        // Ensure profile is loaded into state before navigating
        await refreshProfile();
        
        toast.success("Login successful");
        if (onSuccess) onSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { username }
          }
        });
        if (error) {
          console.error("Signup error:", error);
          throw error;
        }
        
        toast.success("Account created successfully. Please log in.");
        handleToggle(true);
      }
    } catch (err: any) {
      console.error("Auth error caught:", err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {!hideHeader && (
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="you@example.com"
          />
        </div>
        {!isLogin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="Username"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => handleToggle(!isLogin)}
          className="font-medium text-primary hover:underline"
        >
          {isLogin ? 'Sign up' : 'Log in'}
        </button>
      </div>
    </div>
  );
}
