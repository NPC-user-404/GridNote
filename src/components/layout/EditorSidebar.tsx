import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDocumentStore } from '@/store/documentStore';
import { useFolderStore } from '@/store/folderStore';
import { BUILT_IN_TEMPLATES, type NoteTemplate } from '@/store/templateStore';
import {
  Type, Image, CheckSquare, Link2, Trash2, Lock, Unlock, Plus,
  FolderOpen, Folder, ChevronRight, ChevronDown, Code2, Table2,
  FilePlus, FolderPlus, FileText, MoreHorizontal, Pencil, Check, X,
} from 'lucide-react';
import type { Card, GDocument } from '@/types/schema';
import { TemplatePickerModal } from './TemplatePickerModal';

const cardTypes: { type: Card['type']; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'text', label: 'Text', icon: Type, desc: 'Title + body' },
  { type: 'image', label: 'Image', icon: Image, desc: 'Upload image' },
  { type: 'todo', label: 'Todo', icon: CheckSquare, desc: 'Checklist' },
  { type: 'link', label: 'Link', icon: Link2, desc: 'URL + description' },
  { type: 'code', label: 'Code', icon: Code2, desc: 'Syntax highlighted' },
  { type: 'table', label: 'Table', icon: Table2, desc: 'Grid table' },
];

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: "'Lora', serif" },
  { label: 'Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Modern', value: "'Outfit', sans-serif" },
];

const STYLES = [
  { label: 'Default', value: 'default' },
  { label: 'Soft', value: 'soft-highlight' },
  { label: 'Border', value: 'border-emphasis' },
];

function generateId() { return crypto.randomUUID(); }

function createBlankDocument(title: string): GDocument {
  return {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [{ id: generateId(), index: 0, cards: [], locked: false }],
  };
}

function applyTemplate(doc: GDocument, template: NoteTemplate): GDocument {
  if (template.cards.length === 0) return doc;
  const pageId = doc.pages[0].id;
  const cards = template.cards.map((c) => ({
    ...c,
    id: generateId(),
    pageId,
  })) as Card[];
  return { ...doc, pages: [{ ...doc.pages[0], cards }] };
}

// ─── Inline Rename Component ────────────────────────────────
function InlineRename({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  React.useEffect(() => { ref.current?.select(); }, []);

  return (
    <input
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') onSave(text.trim() || value);
        if (e.key === 'Escape') onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 min-w-0 bg-muted rounded px-1 text-xs text-foreground outline-none border border-primary/50"
      autoFocus
    />
  );
}

// ─── Note Row ───────────────────────────────────────────────
function NoteRow({ noteId, indent = 0, draggedNoteId, onDragStart, onDrop, onDelete, onActivate }: {
  noteId: string;
  indent?: number;
  draggedNoteId: React.MutableRefObject<string | null>;
  onDragStart: (id: string) => void;
  onDrop: (targetFolderId: string | null) => void;
  onDelete: (noteId: string) => void;
  onActivate: (noteId: string) => void;
}) {
  const { notes, activeNoteId, renameNote } = useFolderStore();
  const note = notes.find((n) => n.id === noteId);
  const [renaming, setRenaming] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!menuPos) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setMenuPos(null);
      }
    };
    const handleScroll = () => setMenuPos(null);
    window.addEventListener('mousedown', h);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', h);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuPos]);

  if (!note) return null;
  const isActive = activeNoteId === noteId;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(noteId); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(note.folderId); }}
      onClick={() => onActivate(noteId)}
      className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors select-none ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
        }`}
      style={{ paddingLeft: `${8 + indent * 12}px` }}
    >
      <FileText className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      {renaming ? (
        <InlineRename
          value={note.title}
          onSave={(v) => { renameNote(noteId, v); setRenaming(false); }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-xs">{note.title}</span>
      )}

      {/* Context menu */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            if (menuPos) setMenuPos(null);
            else {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPos({ top: rect.top, left: rect.right + 4 });
            }
          }}
          className={`flex items-center justify-center h-4 w-4 rounded transition-opacity ${menuPos ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} text-muted-foreground hover:text-foreground`}
        >
          <MoreHorizontal className="h-3 w-3" />
        </button>
        {menuPos && createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] bg-popover border border-border rounded-lg shadow-xl p-1 min-w-[120px] animate-in fade-in-0 zoom-in-95"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true); setMenuPos(null); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded transition-colors"
            >
              <Pencil className="h-3 w-3" /> Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(noteId); setMenuPos(null); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

// ─── Folder Row ─────────────────────────────────────────────
function FolderRow({ folderId, depth = 0, draggedNoteId, onDrop, onDeleteNote, onActivateNote }: {
  folderId: string;
  depth?: number;
  draggedNoteId: React.MutableRefObject<string | null>;
  onDrop: (folderId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onActivateNote: (noteId: string) => void;
}) {
  const { folders, notes, toggleFolder, renameFolder, deleteFolder } = useFolderStore();
  const folder = folders.find((f) => f.id === folderId);
  const [renaming, setRenaming] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!menuPos) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setMenuPos(null);
      }
    };
    const handleScroll = () => setMenuPos(null);
    window.addEventListener('mousedown', h);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', h);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuPos]);

  if (!folder) return null;

  const childFolders = folders.filter((f) => f.parentId === folderId);
  const childNotes = notes.filter((n) => n.folderId === folderId);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(folderId); }}
        className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors select-none ${dragOver ? 'bg-primary/10 border border-primary/30' : 'text-foreground hover:bg-muted'
          }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => toggleFolder(folderId)}
      >
        {folder.isOpen
          ? <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          : <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        }
        {folder.isOpen
          ? <FolderOpen className="h-3 w-3 flex-shrink-0 text-primary/70" />
          : <Folder className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        }
        {renaming ? (
          <InlineRename
            value={folder.name}
            onSave={(v) => { renameFolder(folderId, v); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs font-medium">{folder.name}</span>
        )}

        <div className="relative">
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (menuPos) setMenuPos(null);
              else {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ top: rect.top, left: rect.right + 4 });
              }
            }}
            className={`flex items-center justify-center h-4 w-4 rounded transition-opacity ${menuPos ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} text-muted-foreground hover:text-foreground`}
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
          {menuPos && createPortal(
            <div
              ref={menuRef}
              className="fixed z-[100] bg-popover border border-border rounded-lg shadow-xl p-1 min-w-[120px] animate-in fade-in-0 zoom-in-95"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setRenaming(true); setMenuPos(null); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded transition-colors"
              >
                <Pencil className="h-3 w-3" /> Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFolder(folderId); setMenuPos(null); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>

      {folder.isOpen && (
        <div>
          {childFolders.map((cf) => (
            <FolderRow key={cf.id} folderId={cf.id} depth={depth + 1} draggedNoteId={draggedNoteId} onDrop={onDrop} onDeleteNote={onDeleteNote} onActivateNote={onActivateNote} />
          ))}
          {childNotes.map((n) => (
            <NoteRow key={n.id} noteId={n.id} indent={depth + 1} draggedNoteId={draggedNoteId} onDragStart={(id) => { draggedNoteId.current = id; }} onDrop={onDrop} onDelete={onDeleteNote} onActivate={onActivateNote} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ────────────────────────────────────────────
export function EditorSidebar() {
  const {
    document: doc, addCard, addPage, removePage, togglePageLock,
    reorderPages, mode, selectedCardIds, setCardFont, setCardStyle,
  } = useDocumentStore();

  const {
    folders, notes, activeNoteId, createNote, createFolder,
    moveNote, saveNoteDocument, loadNoteDocument: loadFromStore,
    setActiveNote, deleteNote,
  } = useFolderStore();
  const { loadNoteDocument: loadDoc } = useDocumentStore();

  const dragPageIdx = useRef<number | null>(null);
  const draggedNoteId = useRef<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddCardOpen, setIsAddCardOpen] = useState(true);

  if (mode === 'view') return null;

  const currentPageId = doc.pages[0]?.id;

  // Root-level folders and notes (no parent folder)
  const rootFolders = folders.filter((f) => f.parentId === null);
  const rootNotes = notes.filter((n) => n.folderId === null);

  const handleDropToRoot = (targetFolderId: string | null) => {
    if (draggedNoteId.current) {
      moveNote(draggedNoteId.current, targetFolderId ?? null);
    }
    draggedNoteId.current = null;
  };

  /** Switch canvas to a different note, saving the current one first */
  const handleActivateNote = (noteId: string) => {
    if (noteId === activeNoteId) return;
    // Save current doc before leaving
    saveNoteDocument(activeNoteId, doc);
    // Set active note first to prevent auto-save race condition
    setActiveNote(noteId);
    
    // Load the target note
    const savedDoc = loadFromStore(noteId);
    const targetNote = notes.find((n) => n.id === noteId);
    if (savedDoc) {
      loadDoc(savedDoc);
    } else {
      const newDoc = createBlankDocument(targetNote?.title ?? 'Untitled Note');
      saveNoteDocument(noteId, newDoc);
      loadDoc(newDoc);
    }
  };

  /** Delete a note, letting folderStore handle active note fallback. */
  const handleDeleteNote = (noteId: string) => {
    // deleteNote returns the new activeNoteId (either the same one, a fallback, or a brand new one if all were deleted)
    const newActiveId = deleteNote(noteId);

    // If the active note changed (because we deleted the active one), update the canvas
    if (newActiveId !== activeNoteId) {
      const targetNote = useFolderStore.getState().notes.find((n) => n.id === newActiveId);
      const nextDoc = loadFromStore(newActiveId);
      if (nextDoc) {
        loadDoc(nextDoc);
      } else {
        const blank = createBlankDocument(targetNote?.title ?? 'Untitled Note');
        saveNoteDocument(newActiveId, blank);
        loadDoc(blank);
      }
    }
  };

  const handleCreateNote = (template: NoteTemplate, title: string) => {
    // Save current document first
    saveNoteDocument(activeNoteId, doc);
    // Create new note
    const noteId = createNote(title, null);
    setActiveNote(noteId); // Set active note first to prevent auto-save race condition

    let newDoc = createBlankDocument(title);
    newDoc = applyTemplate(newDoc, template);
    saveNoteDocument(noteId, newDoc);
    loadDoc(newDoc);
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) { setAddingFolder(false); return; }
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setAddingFolder(false);
  };

  return (
    <aside className="no-print flex w-56 flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* ── NOTES / FOLDERS SECTION ── */}
      <div className="flex flex-col flex-shrink-0 max-h-[45%] overflow-hidden border-b border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Notes</p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="New note"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setAddingFolder(true)}
              className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* New folder input */}
        {addingFolder && (
          <div className="px-3 pb-2 flex items-center gap-1 flex-shrink-0">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
              }}
              placeholder="Folder name..."
              className="flex-1 min-w-0 h-6 rounded border border-border bg-muted/40 px-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <button onClick={handleAddFolder} className="text-primary hover:text-primary/80 transition-colors">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setAddingFolder(false); setNewFolderName(''); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tree */}
        <div
          className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => { e.preventDefault(); handleDropToRoot(null); }}
        >
          {rootFolders.map((f) => (
            <FolderRow key={f.id} folderId={f.id} draggedNoteId={draggedNoteId} onDrop={handleDropToRoot} onDeleteNote={handleDeleteNote} onActivateNote={handleActivateNote} />
          ))}
          {rootNotes.map((n) => (
            <NoteRow
              key={n.id}
              noteId={n.id}
              draggedNoteId={draggedNoteId}
              onDragStart={(id) => { draggedNoteId.current = id; }}
              onDrop={handleDropToRoot}
              onDelete={handleDeleteNote}
              onActivate={handleActivateNote}
            />
          ))}
          {rootFolders.length === 0 && rootNotes.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 px-2 py-2">No notes yet</p>
          )}
        </div>
      </div>

      {/* ── CARDS SECTION ── */}
      <div className="flex flex-col flex-1 overflow-y-auto p-4 min-h-0">
        <button 
          onClick={() => setIsAddCardOpen(!isAddCardOpen)}
          className="mb-3 flex items-center justify-between group flex-shrink-0 w-full"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
            Add Card
          </p>
          {isAddCardOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>
        {isAddCardOpen && (
          <div className="flex flex-col gap-2 flex-shrink-0 animate-in fade-in slide-in-from-top-2">
            {cardTypes.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                onClick={() => currentPageId && addCard(currentPageId, type)}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-muted hover:shadow-sm active:scale-[0.97]"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selection Properties */}
        {selectedCardIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
            <p className="mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-primary">
              Selection ({selectedCardIds.length})
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Type className="h-3 w-3" /> Font
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {FONTS.map((font) => (
                    <button
                      key={font.label}
                      onClick={() => selectedCardIds.forEach((id) => setCardFont(id, font.value))}
                      className="rounded-md border border-border bg-card px-2 py-1 text-[10px] text-foreground hover:bg-muted hover:border-primary/50 transition-colors"
                      style={{ fontFamily: font.value || undefined }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <div className="h-3 w-3 border border-current rounded-[2px]" /> Style
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => selectedCardIds.forEach((id) => setCardStyle(id, style.value as Card['stylePreset']))}
                      className="rounded-md border border-border bg-card px-2 py-1.5 text-[10px] text-foreground hover:bg-muted hover:border-primary/50 transition-colors text-left"
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Overview */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Pages</p>
            <button
              onClick={() => addPage()}
              className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Add page"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {doc.pages.map((page, idx) => (
              <div
                key={page.id}
                draggable
                onClick={() => {
                  const el = document.getElementById(`page-${page.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                onDragStart={(e) => {
                  dragPageIdx.current = idx;
                  e.dataTransfer.effectAllowed = 'move';
                  (e.currentTarget as HTMLElement).style.opacity = '0.4';
                }}
                onDragEnd={(e) => {
                  dragPageIdx.current = null;
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  (e.currentTarget as HTMLElement).style.borderTop = '2px solid hsl(var(--primary))';
                }}
                onDragLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderTop = '';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).style.borderTop = '';
                  if (dragPageIdx.current !== null && dragPageIdx.current !== idx) {
                    reorderPages(dragPageIdx.current, idx);
                  }
                  dragPageIdx.current = null;
                }}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground transition-colors cursor-grab active:cursor-grabbing ${page.id === currentPageId ? 'bg-muted font-semibold' : 'hover:bg-muted'
                  }`}
              >
                <span className="font-medium">Page {page.index + 1}</span>
                <div className="flex items-center gap-1">
                  {doc.pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                      className="flex items-center justify-center rounded-md p-1 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete page"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePageLock(page.id); }}
                    className="flex items-center justify-center rounded-md p-1 text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
                    title={page.locked ? 'Unlock page' : 'Lock page'}
                  >
                    {page.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            {doc.pages.length} page{doc.pages.length !== 1 ? 's' : ''} · {doc.pages.reduce((n, p) => n + p.cards.length, 0)} cards
          </p>
        </div>
      </div>

      <TemplatePickerModal
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onCreate={handleCreateNote}
      />
    </aside>
  );
}
