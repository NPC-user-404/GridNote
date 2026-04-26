import React, { useRef } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { TodoCard, TodoItem } from '@/types/schema';
import { Plus, X } from 'lucide-react';

export function TodoCardComponent({ card, isEditMode }: { card: TodoCard; isEditMode: boolean }) {
  const { updateCard } = useDocumentStore();
  const focusNewItemId = useRef<string | null>(null);

  const toggleItem = (itemId: string) => {
    updateCard(card.id, {
      items: card.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
    });
  };

  const addItem = () => {
    const newItem: TodoItem = { id: crypto.randomUUID(), text: '', checked: false };
    focusNewItemId.current = newItem.id;
    updateCard(card.id, { items: [...card.items, newItem] });
  };

  const addItemAfter = (index: number) => {
    const newItem: TodoItem = { id: crypto.randomUUID(), text: '', checked: false };
    const newItems = [...card.items];
    newItems.splice(index + 1, 0, newItem);
    focusNewItemId.current = newItem.id;
    updateCard(card.id, { items: newItems });
  };

  const updateItemText = (itemId: string, text: string) => {
    updateCard(card.id, {
      items: card.items.map((i) => (i.id === itemId ? { ...i, text } : i)),
    });
  };

  const removeItem = (itemId: string) => {
    updateCard(card.id, { items: card.items.filter((i) => i.id !== itemId) });
  };

  const handleInputRef = (el: HTMLInputElement | null, itemId: string) => {
    if (el && focusNewItemId.current === itemId) {
      el.focus();
      focusNewItemId.current = null;
    }
  };

  return (
    <div className="space-y-2">
      {isEditMode ? (
        <input
          type="text"
          value={card.title}
          onChange={(e) => updateCard(card.id, { title: e.target.value })}
          placeholder="Checklist title"
          className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
      ) : (
        card.title && <p className="text-sm font-semibold text-foreground">{card.title}</p>
      )}

      <div className="space-y-1">
        {card.items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              className="h-3.5 w-3.5 rounded-sm border-border accent-primary"
            />
            {isEditMode ? (
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItemAfter(index);
                  }
                }}
                ref={(el) => handleInputRef(el, item.id)}
                placeholder="Todo item..."
                className={`flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground ${
                  item.checked ? 'line-through text-muted-foreground' : ''
                }`}
              />
            ) : (
              <span className={`text-xs ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.text}
              </span>
            )}
            {isEditMode && (
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditMode && (
        <button
          onClick={addItem}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add item
        </button>
      )}
    </div>
  );
}

