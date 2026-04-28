import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { FileText, Eye, Edit3, Printer, Plus, Undo2, Redo2, Search, Sun, Moon } from 'lucide-react';
import { exportDocumentPdf } from '@/utils/exportPdf';
import { SaveIndicator } from './SaveIndicator';
import { useTheme } from '@/components/theme-provider';
import { useFolderStore } from '@/store/folderStore';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

export function Topbar() {
  const { document: doc, mode, setMode, setTitle, addPage, undo, redo, canUndo, canRedo, searchQuery, setSearchQuery, searchMode, setSearchMode } = useDocumentStore();
  const { activeNoteId, saveNoteDocument } = useFolderStore();
  const { theme, setTheme } = useTheme();
  const { user, profile, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showProfileMenu]);

  const handleExport = () => {
    saveNoteDocument(activeNoteId, doc);
    exportDocumentPdf(doc);
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="no-print flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-primary">
          <FileText className="h-5 w-5" />
          <span className="text-xs font-bold tracking-widest uppercase">GridNote</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <input
          type="text"
          value={doc.title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground w-48 focus:border-b focus:border-primary"
          placeholder="Untitled Document"
        />
        <SaveIndicator />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center mr-2">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-64 rounded-md border border-border bg-muted/50 pl-8 pr-[90px] text-xs placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {/* Cards / Content toggle inside search bar */}
          <div className="absolute right-1 flex items-center h-6 rounded border border-border bg-background overflow-hidden text-[9px] font-medium">
            <button
              onClick={() => setSearchMode('cards')}
              className={`px-1.5 h-full transition-colors ${
                searchMode === 'cards'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Search card titles and types"
            >
              Cards
            </button>
            <button
              onClick={() => setSearchMode('content')}
              className={`px-1.5 h-full transition-colors ${
                searchMode === 'content'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Search inside card content"
            >
              Content
            </button>
          </div>
        </div>

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="flex items-center justify-center rounded-md w-8 h-8 text-foreground hover:bg-muted active:scale-[0.95] transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Undo (⌘Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="flex items-center justify-center rounded-md w-8 h-8 text-foreground hover:bg-muted active:scale-[0.95] transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-center rounded-md w-8 h-8 text-foreground hover:bg-muted active:scale-[0.95] transition-all"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all"
        >
          {mode === 'edit' ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              View
            </>
          ) : (
            <>
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </>
          )}
        </button>

        <button
          onClick={addPage}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Page
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          <Printer className="h-3.5 w-3.5" />
          Export PDF
        </button>
        <div className="h-5 w-px bg-border mx-1" />

        {user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-md hover:bg-muted p-1 pr-2 transition-colors active:scale-[0.97]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-[10px] font-bold">{initial}</span>
              </div>
              <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">
                {displayName}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95 z-50">
                <div className="px-2 py-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
                >
                  <User className="h-3.5 w-3.5" />
                  Profile / Settings
                </button>
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/90 active:scale-[0.97] transition-all"
          >
            Log In
          </button>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}
