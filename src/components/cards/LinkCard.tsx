import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { LinkCard } from '@/types/schema';
import { ExternalLink } from 'lucide-react';

export function LinkCardComponent({ card, isEditMode }: { card: LinkCard; isEditMode: boolean }) {
  const { updateCard } = useDocumentStore();

  return (
    <div className="h-full space-y-2 overflow-hidden">
      {isEditMode ? (
        <>
          <input
            type="text"
            value={card.title}
            onChange={(e) => updateCard(card.id, { title: e.target.value })}
            placeholder="Link title"
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          />
          <input
            type="url"
            value={card.url}
            onChange={(e) => updateCard(card.id, { url: e.target.value })}
            placeholder="https://..."
            className="w-full bg-transparent text-xs text-primary outline-none placeholder:text-muted-foreground"
          />
          <textarea
            value={card.description}
            onChange={(e) => updateCard(card.id, { description: e.target.value })}
            placeholder="Description..."
            rows={2}
            className="w-full resize-none bg-transparent text-xs text-foreground outline-none overflow-hidden placeholder:text-muted-foreground leading-relaxed"
          />
        </>
      ) : (
        <>
          {card.title && <p className="text-sm font-semibold text-foreground">{card.title}</p>}
          {card.url && (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {card.url}
            </a>
          )}
          {card.description && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{card.description}</p>
          )}
        </>
      )}
    </div>
  );
}
