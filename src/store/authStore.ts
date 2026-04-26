import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isGuest: false,

  initialize: async () => {
    try {
      const isGuest = localStorage.getItem('gridnote_guest_mode') === 'true';
      const { data: { session } } = await supabase.auth.getSession();
      
      set({ 
        session, 
        user: session?.user ?? null, 
        isGuest,
        isLoading: false 
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (error) {
      console.error('Failed to initialize auth', error);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('gridnote_guest_mode');
    set({ user: null, session: null, isGuest: false });
  },

  continueAsGuest: () => {
    localStorage.setItem('gridnote_guest_mode', 'true');
    set({ isGuest: true });
  },
}));
