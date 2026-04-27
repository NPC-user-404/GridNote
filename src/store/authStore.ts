import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isGuest: false,

  initialize: async () => {
    try {
      const isGuest = localStorage.getItem('gridnote_guest_mode') === 'true';
      const { data: { session } } = await supabase.auth.getSession();
      
      let profile = null;
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        profile = data;
      }
      
      set({ 
        session, 
        user: session?.user ?? null, 
        profile,
        isGuest,
        isLoading: false 
      });

      supabase.auth.onAuthStateChange(async (_event, session) => {
        let profile = null;
        if (session?.user) {
           const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
           profile = data;
        }
        set({ session, user: session?.user ?? null, profile });
      });
    } catch (error) {
      console.error('Failed to initialize auth', error);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('gridnote_guest_mode');
    set({ user: null, session: null, profile: null, isGuest: false });
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    if (data) {
      set({ profile: data });
    }
  },

  continueAsGuest: () => {
    localStorage.setItem('gridnote_guest_mode', 'true');
    set({ isGuest: true });
  },
}));
