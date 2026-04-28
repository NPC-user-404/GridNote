import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { CompositeCard, TextCard, CompositeLayout } from '@/types/schema';
import { Columns2, Rows3, LayoutPanelLeft, Ungroup } from 'lucide-react';

const LAYOUT_OPTIONS: { value: CompositeLayout; label: string; icon: React.ReactNode }[] = [
  { value: 'stacked', label: 'Stacked', icon: <Rows3 className="h-3 w-3" /> },
  { value: 'side-by-side', label: 'Side by Side', icon: <Columns2 className="h-3 w-3" /> },
  { value: 'l-shape', label: 'L-Shape', icon: <LayoutPanelLeft className="h-3 w-3" /> },
];

export function CompositeCardComponent({ card, isEditMode }: { card: CompositeCard; isEditMode: boolean }) {
  const { updateCard, unmergeCard } = useDocumentStore();
  const allCards = useDocumentStore((s) => s.document.pages.flatMap((p) => p.cards));

  const childCards = card.childCardIds
    .map((id) => allCards.find((c) => c.id === id))
    .filter((c): c is TextCard => !!c && c.type === 'text');

  const layoutClass =
    card.layout === 'side-by-side'
      ? 'flex flex-row gap-2'
      : card.layout === 'l-shape'
        ? 'grid grid-cols-2 grid-rows-2 gap-2'
        : 'flex flex-col gap-2';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Layout controls - edit mode */}
      {isEditMode && (
        <div className="flex items-center gap-1.5 mb-2 shrink-0">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                updateCard(card.id, { layout: opt.value } as Partial<CompositeCard>);
              }}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-150 ${
                card.layout === opt.value
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              }`}
              title={opt.label}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              unmergeCard(card.id);
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
            title="Unmerge cards"
          >
            <Ungroup className="h-3 w-3" />
            Unmerge
          </button>
        </div>
      )}

      {/* Child cards rendered in chosen layout */}
      <div className={`flex-1 min-h-0 overflow-auto ${layoutClass}`}>
        {childCards.map((child, index) => (
          <div
            key={child.id}
            className={`rounded-md border border-border/50 bg-muted/20 p-2.5 overflow-hidden transition-all duration-200 hover:bg-muted/30 ${
              card.layout === 'l-shape' && index === 0
                ? 'col-span-2'
                : card.layout === 'side-by-side'
                  ? 'flex-1 min-w-0'
                  : ''
            }`}
          >
            {child.title && (
              <p className="text-xs font-semibold text-foreground mb-1 truncate">{child.title}</p>
            )}
            {child.body && (
              <p className="text-[11px] text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-6">
                {child.body}
              </p>
            )}
            {!child.title && !child.body && (
              <p className="text-[10px] text-muted-foreground/50 italic">Empty card</p>
            )}
          </div>
        ))}
        {childCards.length === 0 && (
          <div className="flex items-center justify-center flex-1 text-[10px] text-muted-foreground/40">
            No child cards found
          </div>
        )}
      </div>
    </div>
  );
}
