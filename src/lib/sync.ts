import { supabase } from './supabase';
import { useAuthStore } from '@/store/authStore';
import type { GDocument } from '@/types/schema';

let syncTimeout: any;

export async function syncDocument(id: string, title: string, doc: GDocument) {
  const user = useAuthStore.getState().user;
  if (!user) return;

  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await supabase.from('documents').upsert({
        id,
        user_id: user.id,
        title,
        data: doc,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to sync document', e);
    }
  }, 1000);
}

export async function deleteDocumentSync(id: string) {
  const user = useAuthStore.getState().user;
  if (!user) return;

  try {
    await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);
  } catch (e) {
    console.error('Failed to delete document', e);
  }
}
