import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { TextCard } from '@/types/schema';

export function TextCardComponent({ card, isEditMode }: { card: TextCard; isEditMode: boolean }) {
  const { updateCard } = useDocumentStore();

  return (
    <div className="h-full space-y-2 overflow-hidden">
      {isEditMode ? (
        <>
          <input
            type="text"
            value={card.title}
            onChange={(e) => updateCard(card.id, { title: e.target.value })}
            placeholder="Title"
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          />
          <textarea
            value={card.body}
            onChange={(e) => updateCard(card.id, { body: e.target.value })}
            placeholder="Write something..."
            rows={3}
            className="w-full resize-none bg-transparent text-xs text-foreground outline-none overflow-hidden placeholder:text-muted-foreground leading-relaxed"
          />
        </>
      ) : (
        <>
          {card.title && <p className="text-sm font-semibold text-foreground">{card.title}</p>}
          {card.body && <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{card.body}</p>}
        </>
      )}
    </div>
  );
}
