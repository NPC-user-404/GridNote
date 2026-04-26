import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Folder, FolderNote, GDocument } from '@/types/schema';
import { supabase } from '@/lib/supabase';
import { deleteDocumentSync } from '@/lib/sync';

const FOLDER_STORE_KEY = 'gridnote_folders';
const NOTES_INDEX_KEY = 'gridnote_notes_index';
const LEGACY_DOC_KEY = 'gridnote_document';

function generateId(): string {
  return crypto.randomUUID();
}

function docStorageKey(noteId: string): string {
  return `gridnote_doc_${noteId}`;
}

function loadFolderState(): { folders: Folder[]; notes: FolderNote[]; activeNoteId: string } {
  try {
    const raw = localStorage.getItem(FOLDER_STORE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }

  // Migrate legacy single-document
  const legacyRaw = localStorage.getItem(LEGACY_DOC_KEY);
  const noteId = generateId();
  let title = 'Untitled Note';
  if (legacyRaw) {
    try {
      const doc = JSON.parse(legacyRaw) as GDocument;
      title = doc.title || 'Untitled Note';
      localStorage.setItem(docStorageKey(noteId), legacyRaw);
    } catch { /* ignore */ }
  }

  const defaultNote: FolderNote = {
    id: noteId,
    title,
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    folders: [],
    notes: [defaultNote],
    activeNoteId: noteId,
  };
}

interface FolderState {
  folders: Folder[];
  notes: FolderNote[];
  activeNoteId: string;

  // Folder actions
  createFolder: (name: string, parentId?: string | null) => string;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;

  // Note actions
  createNote: (title: string, folderId?: string | null) => string;
  renameNote: (noteId: string, title: string) => void;
  deleteNote: (noteId: string) => string;
  moveNote: (noteId: string, folderId: string | null) => void;
  setActiveNote: (noteId: string) => void;
  updateNoteTimestamp: (noteId: string) => void;

  // Persistence helpers
  saveNoteDocument: (noteId: string, doc: GDocument) => void;
  loadNoteDocument: (noteId: string) => GDocument | null;
  loadUserDocuments: (userId: string) => Promise<void>;
}

const initialState = loadFolderState();

export const useFolderStore = create<FolderState>()(
  subscribeWithSelector((set, get) => ({
    folders: initialState.folders,
    notes: initialState.notes,
    activeNoteId: initialState.activeNoteId,

    createFolder: (name, parentId = null) => {
      const id = generateId();
      const folder: Folder = {
        id,
        name,
        parentId: parentId ?? null,
        isOpen: true,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ folders: [...s.folders, folder] }));
      return id;
    },

    renameFolder: (folderId, name) =>
      set((s) => ({
        folders: s.folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
      })),

    deleteFolder: (folderId) => {
      const state = get();
      // Collect all descendant folder ids
      const toDelete = new Set<string>();
      const queue = [folderId];
      while (queue.length) {
        const id = queue.pop()!;
        toDelete.add(id);
        state.folders.filter((f) => f.parentId === id).forEach((f) => queue.push(f.id));
      }
      // Move notes from deleted folders to root
      set((s) => ({
        folders: s.folders.filter((f) => !toDelete.has(f.id)),
        notes: s.notes.map((n) =>
          n.folderId && toDelete.has(n.folderId) ? { ...n, folderId: null } : n
        ),
      }));
    },

    toggleFolder: (folderId) =>
      set((s) => ({
        folders: s.folders.map((f) => (f.id === folderId ? { ...f, isOpen: !f.isOpen } : f)),
      })),

    createNote: (title, folderId = null) => {
      const id = generateId();
      const note: FolderNote = {
        id,
        title,
        folderId: folderId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({ notes: [...s.notes, note] }));
      return id;
    },

    renameNote: (noteId, title) =>
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, title, updatedAt: new Date().toISOString() } : n
        ),
      })),

    deleteNote: (noteId) => {
      const state = get();
      // Remove document from localStorage
      localStorage.removeItem(docStorageKey(noteId));
      
      // Sync delete
      deleteDocumentSync(noteId);

      const remaining = state.notes.filter((n) => n.id !== noteId);
      let activeNoteId = state.activeNoteId;
      if (activeNoteId === noteId) {
        activeNoteId = remaining[0]?.id ?? '';
        if (!activeNoteId) {
          // Create a new note if all deleted
          const newId = generateId();
          const newNote: FolderNote = {
            id: newId,
            title: 'Untitled Note',
            folderId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ notes: [newNote], activeNoteId: newId });
          return newId;
        }
      }
      set({ notes: remaining, activeNoteId });
      return activeNoteId;
    },

    moveNote: (noteId, folderId) =>
      set((s) => ({
        notes: s.notes.map((n) => (n.id === noteId ? { ...n, folderId } : n)),
      })),

    setActiveNote: (noteId) => set({ activeNoteId: noteId }),

    updateNoteTimestamp: (noteId) =>
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, updatedAt: new Date().toISOString() } : n
        ),
      })),

    saveNoteDocument: (noteId, doc) => {
      localStorage.setItem(docStorageKey(noteId), JSON.stringify(doc));
    },

    loadNoteDocument: (noteId) => {
      try {
        const raw = localStorage.getItem(docStorageKey(noteId));
        if (raw) return JSON.parse(raw) as GDocument;
      } catch { /* ignore */ }
      return null;
    },

    loadUserDocuments: async (userId: string) => {
      try {
        const { data, error } = await supabase.from('documents').select('*').eq('user_id', userId);
        if (error) throw error;
        
        if (data && data.length > 0) {
          const notes: FolderNote[] = data.map((doc: any) => {
            // Cache locally
            localStorage.setItem(docStorageKey(doc.id), JSON.stringify(doc.data));
            return {
              id: doc.id,
              title: doc.title || 'Untitled Note',
              folderId: null, // Keep folders flat by default or extend schema later
              createdAt: doc.created_at,
              updatedAt: doc.updated_at
            };
          });
          
          set({ notes, folders: [], activeNoteId: notes[0].id });
          
          // Try to load the active note into the documentStore
          const { useDocumentStore } = await import('@/store/documentStore');
          useDocumentStore.getState().loadNoteDocument(data[0].data);
        }
      } catch (e) {
        console.error('Failed to load user documents:', e);
      }
    },
  }))
);

// Auto-save folder state
useFolderStore.subscribe(
  (s) => ({ folders: s.folders, notes: s.notes, activeNoteId: s.activeNoteId }),
  (state) => {
    localStorage.setItem(FOLDER_STORE_KEY, JSON.stringify(state));
  }
);

// Listen for auth changes to load data
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
    useFolderStore.getState().loadUserDocuments(session.user.id);
  }
});

export { docStorageKey };
