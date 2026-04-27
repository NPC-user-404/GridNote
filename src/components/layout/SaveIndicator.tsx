import React, { useEffect, useState, useRef } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useFolderStore } from '@/store/folderStore';
import { forceSyncDocument } from '@/lib/sync';
import { Save } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved';

export function SaveIndicator() {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRender = useRef(true);

  const doc = useDocumentStore((s) => s.document);
  const activeNoteId = useFolderStore((s) => s.activeNoteId);

  useEffect(() => {
    const unsub = useDocumentStore.subscribe(
      (s) => s.document.updatedAt,
      () => {
        // Skip the initial subscription trigger
        if (initialRender.current) {
          initialRender.current = false;
          return;
        }

        setStatus('saving');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Simulate brief save delay (localStorage is synchronous but this gives visual feedback)
        timeoutRef.current = setTimeout(() => {
          setStatus('saved');

          // Reset to idle after showing "Saved ✓"
          timeoutRef.current = setTimeout(() => {
            setStatus('idle');
          }, 2000);
        }, 400);
      }
    );

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleManualSave = async () => {
    if (!activeNoteId) return;
    setStatus('saving');
    
    useFolderStore.getState().saveNoteDocument(activeNoteId, doc);
    await forceSyncDocument(activeNoteId, doc.title, doc);
    
    setStatus('saved');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleManualSave}
        disabled={status === 'saving'}
        className="flex items-center justify-center rounded-md w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.95] transition-all disabled:opacity-50"
        title="Save document"
      >
        <Save className="h-4 w-4" />
      </button>
      <div className="w-16">
        {status !== 'idle' && (
          <span
            className={`text-[11px] font-medium transition-opacity duration-300 ${
              status === 'saving'
                ? 'text-muted-foreground animate-pulse'
                : 'text-emerald-500'
            }`}
          >
            {status === 'saving' ? 'Saving...' : 'Saved ✓'}
          </span>
        )}
      </div>
    </div>
  );
}
