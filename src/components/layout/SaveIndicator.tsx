import React, { useEffect, useState, useRef } from 'react';
import { useDocumentStore } from '@/store/documentStore';

type SaveStatus = 'idle' | 'saving' | 'saved';

export function SaveIndicator() {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRender = useRef(true);

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

  if (status === 'idle') return null;

  return (
    <span
      className={`text-[11px] font-medium transition-opacity duration-300 ${
        status === 'saving'
          ? 'text-muted-foreground animate-pulse'
          : 'text-emerald-500'
      }`}
    >
      {status === 'saving' ? 'Saving...' : 'Saved ✓'}
    </span>
  );
}
