import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal, type HistoryState } from './historyMiddleware';
import type { GDocument, Card, Page, AppMode, Position, Size, SearchMode, SoftDeletedCard, CardSizePreset, CompositeLayout } from '@/types/schema';
import { syncDocument } from '@/lib/sync';
import { useFolderStore } from '@/store/folderStore';
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  GRID_SIZE,
  MIN_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  CARD_SIZE_PRESETS,
} from '@/types/schema';

const STORAGE_KEY = 'gridnote_document';

function generateId(): string {
  return crypto.randomUUID();
}

function createDefaultDocument(): GDocument {
  return {
    id: generateId(),
    title: 'Untitled Document',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [{ id: generateId(), index: 0, cards: [], locked: false }],
  };
}

function loadDocument(): GDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const doc = JSON.parse(raw) as GDocument;
      doc.pages = doc.pages.map((p) => ({ ...p, locked: p.locked ?? false }));
      return doc;
    }
  } catch { /* ignore */ }
  return createDefaultDocument();
}

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

interface DocumentState {
  document: GDocument;
  mode: AppMode;
  draggingCardId: string | null;
  searchQuery: string;
  searchMode: SearchMode;
  selectedCardIds: string[];
  linkModeSourceId: string | null;
  hoveredLinkSourceId: string | null;
  suggestedGroup: string[] | null;
  softDeletedCards: SoftDeletedCard[];
  undoToastVisible: boolean;

  startLinkMode: (cardId: string | null) => void;
  setHoveredLinkSourceId: (cardId: string | null) => void;
  toggleLink: (sourceId: string, targetId: string) => void;
  setSuggestedGroup: (cardIds: string[] | null) => void;
  createGroup: (cardIds: string[]) => void;
  ungroup: (groupId: string) => void;

  setMode: (mode: AppMode) => void;
  setSelectedCards: (cardIds: string[]) => void;
  toggleCardSelection: (cardId: string, multi?: boolean) => void;
  toggleCardPin: (cardId: string) => void;
  setCardFont: (cardId: string, fontFamily?: string) => void;
  setCardStyle: (cardId: string, stylePreset?: Card['stylePreset']) => void;
  duplicateCards: (cardIds: string[]) => void;

  setTitle: (title: string) => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  togglePageLock: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  addCard: (pageId: string, type: Card['type']) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  moveCard: (cardId: string, position: Position) => void;
  resizeCard: (cardId: string, size: Size) => void;
  deleteCard: (cardId: string) => void;
  softDeleteCard: (cardId: string) => void;
  undoDelete: () => void;
  permanentlyDeleteSoftDeleted: () => void;
  setCardColor: (cardId: string, color: string | undefined) => void;
  setCardSizePreset: (cardId: string, preset: CardSizePreset) => void;
  mergeCards: (cardIds: string[], layout: CompositeLayout) => void;
  unmergeCard: (compositeCardId: string) => void;
  setDragging: (cardId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  loadNoteDocument: (doc: GDocument) => void;

  isPageLocked: (pageId: string) => boolean;
}

export let lastCanvasCursorPos: { clientX: number, clientY: number } | null = null;
export const setLastCanvasCursorPos = (pos: { clientX: number, clientY: number } | null) => {
  lastCanvasCursorPos = pos;
};

export const useDocumentStore = create<DocumentState & HistoryState>()(
  subscribeWithSelector(
    temporal(
      (set, get) => ({
        document: loadDocument(),
        mode: 'edit' as AppMode,
        draggingCardId: null,
        searchQuery: '',
        searchMode: 'content',
        selectedCardIds: [],
        linkModeSourceId: null,
        hoveredLinkSourceId: null,
        suggestedGroup: null,
        softDeletedCards: [],
        undoToastVisible: false,

        setSelectedCards: (cardIds) => set({ selectedCardIds: cardIds }),
        setMode: (mode) => set((s) => ({ mode, selectedCardIds: mode !== 'edit' ? [] : s.selectedCardIds })),
        startLinkMode: (cardId) => set({ linkModeSourceId: cardId }),
        setHoveredLinkSourceId: (cardId) => set({ hoveredLinkSourceId: cardId }),
        toggleLink: (sourceId, targetId) => set((s) => {
          if (sourceId === targetId) return s;
          let updated = false;
          const pages = s.document.pages.map((p) => {
            const newCards = p.cards.map((c) => {
              if (c.id === sourceId) {
                const links = c.links || [];
                const newLinks = links.includes(targetId) ? links.filter((id) => id !== targetId) : [...links, targetId];
                updated = true;
                return { ...c, links: newLinks };
              }
              if (c.id === targetId) {
                const links = c.links || [];
                const newLinks = links.includes(sourceId) ? links.filter((id) => id !== sourceId) : [...links, sourceId];
                updated = true;
                return { ...c, links: newLinks };
              }
              return c;
            });
            return { ...p, cards: newCards };
          });
          if (!updated) return { linkModeSourceId: null };
          return { document: { ...s.document, pages, updatedAt: new Date().toISOString() }, linkModeSourceId: null };
        }),
        setSuggestedGroup: (cardIds) => set({ suggestedGroup: cardIds }),
        createGroup: (cardIds) => set((s) => {
          if (cardIds.length < 2) return s;
          const groupId = generateId();
          const pages = s.document.pages.map((p) => {
            const newCards = p.cards.map((c) => {
              if (cardIds.includes(c.id)) {
                return { ...c, groupId };
              }
              return c;
            });
            return { ...p, cards: newCards };
          });
          return { document: { ...s.document, pages, updatedAt: new Date().toISOString() }, suggestedGroup: null };
        }),
        ungroup: (groupId) => set((s) => {
          const pages = s.document.pages.map((p) => {
            const newCards = p.cards.map((c) => {
              if (c.groupId === groupId) {
                const { groupId: _, ...rest } = c;
                return rest as Card;
              }
              return c;
            });
            return { ...p, cards: newCards };
          });
          return { document: { ...s.document, pages, updatedAt: new Date().toISOString() } };
        }),
        toggleCardSelection: (cardId, multi) => set((s) => {
          if (multi) {
            if (s.selectedCardIds.includes(cardId)) {
              return { selectedCardIds: s.selectedCardIds.filter((id) => id !== cardId) };
            } else {
              return { selectedCardIds: [...s.selectedCardIds, cardId] };
            }
          }
          return { selectedCardIds: s.selectedCardIds.includes(cardId) && s.selectedCardIds.length === 1 ? [] : [cardId] };
        }),
        toggleCardPin: (cardId) => set((s) => ({
          document: {
            ...s.document,
            pages: s.document.pages.map((p) => ({
              ...p,
              cards: p.cards.map((c) => c.id === cardId ? { ...c, isPinned: !c.isPinned } : c),
            })),
            updatedAt: new Date().toISOString(),
          },
        })),
        setCardFont: (cardId, fontFamily) => set((s) => ({
          document: {
            ...s.document,
            pages: s.document.pages.map((p) => ({
              ...p,
              cards: p.cards.map((c) => c.id === cardId ? { ...c, fontFamily } : c),
            })),
            updatedAt: new Date().toISOString(),
          },
        })),
        setCardStyle: (cardId, stylePreset) => set((s) => ({
          document: {
            ...s.document,
            pages: s.document.pages.map((p) => ({
              ...p,
              cards: p.cards.map((c) => c.id === cardId ? { ...c, stylePreset } : c),
            })),
            updatedAt: new Date().toISOString(),
          },
        })),
        duplicateCards: (cardIds) => set((s) => {
          const newCardsMap = new Map<string, Card>();
          const newPages = s.document.pages.map((p) => {
            const pageCards = [...p.cards];
            const duplicated: Card[] = [];
            p.cards.forEach((c) => {
              if (cardIds.includes(c.id)) {
                const newId = generateId();
                const duplicatedCard = {
                  ...c,
                  id: newId,
                  position: { x: c.position.x + GRID_SIZE * 2, y: c.position.y + GRID_SIZE * 2 },
                };
                duplicated.push(duplicatedCard);
                newCardsMap.set(c.id, duplicatedCard);
              }
            });
            return { ...p, cards: [...pageCards, ...duplicated] };
          });
          
          if (newCardsMap.size === 0) return s;

          return {
            document: { ...s.document, pages: newPages, updatedAt: new Date().toISOString() },
            selectedCardIds: Array.from(newCardsMap.values()).map(c => c.id)
          };
        }),

        setTitle: (title) =>
          set((s) => ({
            document: { ...s.document, title, updatedAt: new Date().toISOString() },
          })),

        addPage: () =>
          set((s) => {
            const newPage: Page = {
              id: generateId(),
              index: s.document.pages.length,
              cards: [],
              locked: false,
            };
            return {
              document: {
                ...s.document,
                pages: [...s.document.pages, newPage],
                updatedAt: new Date().toISOString(),
              },
            };
          }),

        removePage: (pageId) =>
          set((s) => {
            if (s.document.pages.length <= 1) return s;
            return {
              document: {
                ...s.document,
                pages: s.document.pages
                  .filter((p) => p.id !== pageId)
                  .map((p, i) => ({ ...p, index: i })),
                updatedAt: new Date().toISOString(),
              },
            };
          }),

        togglePageLock: (pageId) =>
          set((s) => ({
            document: {
              ...s.document,
              pages: s.document.pages.map((p) =>
                p.id === pageId ? { ...p, locked: !p.locked } : p
              ),
              updatedAt: new Date().toISOString(),
            },
          })),

        reorderPages: (fromIndex, toIndex) =>
          set((s) => {
            const pages = [...s.document.pages];
            const [moved] = pages.splice(fromIndex, 1);
            pages.splice(toIndex, 0, moved);
            return {
              document: {
                ...s.document,
                pages: pages.map((p, i) => ({ ...p, index: i })),
                updatedAt: new Date().toISOString(),
              },
            };
          }),

        addCard: (pageId, type) =>
          set((s) => {
            let targetX: number;
            let targetY: number;
            
            const pageEl = typeof document !== 'undefined' ? document.getElementById(`page-${pageId}`) : null;
            
            if (lastCanvasCursorPos && pageEl) {
              const rect = pageEl.getBoundingClientRect();
              
              // Calculate zoom/scale of the page
              const scaleX = rect.width / A4_WIDTH_PX;
              const scaleY = rect.height / A4_HEIGHT_PX;

              // Calculate local unscaled coordinate
              const localX = (lastCanvasCursorPos.clientX - rect.left) / scaleX;
              const localY = (lastCanvasCursorPos.clientY - rect.top) / scaleY;
              
              // Center the card around the cursor
              const rawX = localX - (DEFAULT_CARD_WIDTH / 2);
              const rawY = localY - (DEFAULT_CARD_HEIGHT / 2);

              const maxX = A4_WIDTH_PX - DEFAULT_CARD_WIDTH;
              const maxY = A4_HEIGHT_PX - DEFAULT_CARD_HEIGHT;
              
              targetX = snapToGrid(Math.max(0, Math.min(rawX, maxX)));
              targetY = snapToGrid(Math.max(0, Math.min(rawY, maxY)));
            } else if (pageEl) {
              const rect = pageEl.getBoundingClientRect();
              
              const scaleX = rect.width / A4_WIDTH_PX;
              const scaleY = rect.height / A4_HEIGHT_PX;

              const cx = window.innerWidth / 2;
              const cy = window.innerHeight / 2;
              const localX = (cx - rect.left) / scaleX;
              const localY = (cy - rect.top) / scaleY;
              
              const rawX = localX - (DEFAULT_CARD_WIDTH / 2);
              const rawY = localY - (DEFAULT_CARD_HEIGHT / 2);

              const maxX = A4_WIDTH_PX - DEFAULT_CARD_WIDTH;
              const maxY = A4_HEIGHT_PX - DEFAULT_CARD_HEIGHT;
              
              targetX = snapToGrid(Math.max(0, Math.min(rawX, maxX)));
              targetY = snapToGrid(Math.max(0, Math.min(rawY, maxY)));
            } else {
              targetX = snapToGrid((A4_WIDTH_PX - DEFAULT_CARD_WIDTH) / 2);
              const page = s.document.pages.find((p) => p.id === pageId);
              targetY = snapToGrid(
                page ? Math.min(page.cards.length * 180 + 80, A4_HEIGHT_PX - 200) : 80
              );
            }

            const base = {
              id: generateId(),
              pageId,
              position: { x: targetX, y: targetY },
              size: { width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT },
            };

            let card: Card;
            switch (type) {
              case 'text':
                card = { ...base, type: 'text', title: '', body: '' };
                break;
              case 'image':
                card = { ...base, type: 'image', title: '', imageData: '' };
                break;
              case 'todo':
                card = { ...base, type: 'todo', title: '', items: [] };
                break;
              case 'link':
                card = { ...base, type: 'link', title: '', url: '', description: '' };
                break;
              case 'code':
                card = { ...base, type: 'code', title: '', code: '', language: 'javascript', size: { width: 320, height: 180 } };
                break;
              case 'table': {
                const mkCell = () => ({ id: generateId(), value: '' });
                const mkRow = () => ({ id: generateId(), cells: [mkCell(), mkCell(), mkCell()] });
                card = { ...base, type: 'table', title: '', tableStyle: 'default', size: { width: 360, height: 200 }, rows: [mkRow(), mkRow(), mkRow()] };
                break;
              }
            }

            return {
              document: {
                ...s.document,
                pages: s.document.pages.map((p) =>
                  p.id === pageId ? { ...p, cards: [...p.cards, card] } : p
                ),
                updatedAt: new Date().toISOString(),
              },
            };
          }),

        updateCard: (cardId, updates) =>
          set((s) => ({
            document: {
              ...s.document,
              pages: s.document.pages.map((p) => ({
                ...p,
                cards: p.cards.map((c) =>
                  c.id === cardId ? ({ ...c, ...updates } as Card) : c
                ),
              })),
              updatedAt: new Date().toISOString(),
            },
          })),

        moveCard: (cardId, position) =>
          set((s) => ({
            document: {
              ...s.document,
              pages: s.document.pages.map((p) => ({
                ...p,
                cards: p.cards.map((c) =>
                  c.id === cardId
                    ? { ...c, position: { x: snapToGrid(position.x), y: snapToGrid(position.y) } }
                    : c
                ),
              })),
              updatedAt: new Date().toISOString(),
            },
          })),

        resizeCard: (cardId, size) =>
          set((s) => ({
            document: {
              ...s.document,
              pages: s.document.pages.map((p) => ({
                ...p,
                cards: p.cards.map((c) =>
                  c.id === cardId
                    ? {
                        ...c,
                        size: {
                          width: snapToGrid(Math.max(MIN_CARD_WIDTH, size.width)),
                          height: snapToGrid(Math.max(MIN_CARD_HEIGHT, size.height)),
                        },
                      }
                    : c
                ),
              })),
              updatedAt: new Date().toISOString(),
            },
          })),

        deleteCard: (cardId) =>
          set((s) => ({
            document: {
              ...s.document,
              pages: s.document.pages.map((p) => ({
                ...p,
                cards: p.cards.filter((c) => c.id !== cardId),
              })),
              updatedAt: new Date().toISOString(),
            },
            selectedCardIds: s.selectedCardIds.filter(id => id !== cardId),
          })),

        softDeleteCard: (cardId) =>
          set((s) => {
            let deletedCard: Card | undefined;
            let foundPageId = '';
            for (const p of s.document.pages) {
              const c = p.cards.find((c) => c.id === cardId);
              if (c) { deletedCard = c; foundPageId = p.id; break; }
            }
            if (!deletedCard) return s;
            return {
              document: {
                ...s.document,
                pages: s.document.pages.map((p) => ({
                  ...p,
                  cards: p.cards.filter((c) => c.id !== cardId),
                })),
                updatedAt: new Date().toISOString(),
              },
              selectedCardIds: s.selectedCardIds.filter(id => id !== cardId),
              softDeletedCards: [...s.softDeletedCards, { card: deletedCard, pageId: foundPageId, deletedAt: Date.now() }],
              undoToastVisible: true,
            };
          }),

        undoDelete: () =>
          set((s) => {
            if (s.softDeletedCards.length === 0) return s;
            const last = s.softDeletedCards[s.softDeletedCards.length - 1];
            return {
              document: {
                ...s.document,
                pages: s.document.pages.map((p) =>
                  p.id === last.pageId ? { ...p, cards: [...p.cards, last.card] } : p
                ),
                updatedAt: new Date().toISOString(),
              },
              softDeletedCards: s.softDeletedCards.slice(0, -1),
              undoToastVisible: s.softDeletedCards.length > 1,
            };
          }),

        permanentlyDeleteSoftDeleted: () =>
          set({ softDeletedCards: [], undoToastVisible: false }),

        setCardColor: (cardId, color) =>
          set((s) => ({
            document: {
              ...s.document,
              pages: s.document.pages.map((p) => ({
                ...p,
                cards: p.cards.map((c) =>
                  c.id === cardId ? { ...c, colorLabel: color } as Card : c
                ),
              })),
              updatedAt: new Date().toISOString(),
            },
          })),

        setCardSizePreset: (cardId, preset) =>
          set((s) => {
            const dims = CARD_SIZE_PRESETS[preset];
            return {
              document: {
                ...s.document,
                pages: s.document.pages.map((p) => ({
                  ...p,
                  cards: p.cards.map((c) =>
                    c.id === cardId
                      ? { ...c, sizePreset: preset, size: { width: dims.width, height: dims.height } }
                      : c
                  ),
                })),
                updatedAt: new Date().toISOString(),
              },
            };
          }),

        mergeCards: (cardIds, layout) =>
          set((s) => {
            if (cardIds.length < 2) return s;
            // Find all the text cards to merge
            const allCards = s.document.pages.flatMap(p => p.cards);
            const textCards = cardIds.map(id => allCards.find(c => c.id === id)).filter((c): c is Card => !!c && c.type === 'text');
            if (textCards.length < 2) return s;

            // Use position of first card as composite position
            const minX = Math.min(...textCards.map(c => c.position.x));
            const minY = Math.min(...textCards.map(c => c.position.y));
            const maxX = Math.max(...textCards.map(c => c.position.x + c.size.width));
            const maxY = Math.max(...textCards.map(c => c.position.y + c.size.height));
            const pageId = textCards[0].pageId;

            const compositeCard: Card = {
              id: generateId(),
              type: 'composite',
              title: 'Merged Cards',
              pageId,
              position: { x: minX, y: minY },
              size: {
                width: layout === 'side-by-side' ? maxX - minX : Math.max(...textCards.map(c => c.size.width)),
                height: layout === 'stacked' ? maxY - minY : Math.max(...textCards.map(c => c.size.height)),
              },
              childCardIds: cardIds,
              layout,
            };

            // Hide original cards (keep them but mark as part of composite)
            const pages = s.document.pages.map((p) => {
              if (p.id !== pageId) return p;
              const updatedCards = p.cards.map(c =>
                cardIds.includes(c.id) ? { ...c, isDeleted: true } as Card : c
              );
              return { ...p, cards: [...updatedCards, compositeCard] };
            });

            return {
              document: { ...s.document, pages, updatedAt: new Date().toISOString() },
              selectedCardIds: [compositeCard.id],
            };
          }),

        unmergeCard: (compositeCardId) =>
          set((s) => {
            const allCards = s.document.pages.flatMap(p => p.cards);
            const composite = allCards.find(c => c.id === compositeCardId);
            if (!composite || composite.type !== 'composite') return s;

            const childIds = composite.childCardIds;
            const pages = s.document.pages.map((p) => {
              // Restore child cards, remove composite
              const restoredCards = p.cards
                .filter(c => c.id !== compositeCardId)
                .map(c => childIds.includes(c.id) ? { ...c, isDeleted: undefined } as Card : c);
              return { ...p, cards: restoredCards };
            });

            return {
              document: { ...s.document, pages, updatedAt: new Date().toISOString() },
              selectedCardIds: childIds,
            };
          }),

        setDragging: (cardId) => set({ draggingCardId: cardId }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSearchMode: (mode) => set({ searchMode: mode }),
        loadNoteDocument: (doc) => set({ document: doc, selectedCardIds: [] }),

        isPageLocked: (pageId) => {
          return get().document.pages.find((p) => p.id === pageId)?.locked ?? false;
        },
      }),
      { select: (s) => ({ document: s.document }) }
    )
  )
);

// Auto-save to localStorage and Supabase
useDocumentStore.subscribe(
  (s) => s.document,
  (doc) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    const activeNoteId = useFolderStore.getState().activeNoteId;
    if (activeNoteId) {
      useFolderStore.getState().saveNoteDocument(activeNoteId, doc);
      syncDocument(activeNoteId, doc.title, doc);
    }
  }
);

// Keyboard shortcuts for undo/redo
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    const state = useDocumentStore.getState();
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    const isEditable = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

    if (!isEditable) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          state.redo();
        } else {
          state.undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        state.redo();
      }

      if (state.mode === 'edit') {
        // Deletion (soft delete with undo)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (state.selectedCardIds.length > 0) {
            e.preventDefault();
            state.selectedCardIds.forEach(id => state.softDeleteCard(id));
          }
        }

        // Duplication
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
          if (state.selectedCardIds.length > 0) {
            e.preventDefault();
            state.duplicateCards(state.selectedCardIds);
          }
        }

        // Movement via Arrows
        if (state.selectedCardIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? GRID_SIZE * 2 : GRID_SIZE;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          
          state.selectedCardIds.forEach(id => {
            const card = state.document.pages.flatMap(p => p.cards).find(c => c.id === id);
            if (card) {
              const newX = Math.max(0, Math.min(A4_WIDTH_PX - card.size.width, card.position.x + dx));
              const newY = Math.max(0, Math.min(A4_HEIGHT_PX - card.size.height, card.position.y + dy));
              state.moveCard(id, { x: newX, y: newY });
            }
          });
        }

        // Card creation shortcuts: T, I, L
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          const pageId = state.document.pages[0]?.id;
          if (pageId) {
            const shortcutMap: Record<string, Card['type']> = { t: 'text', i: 'image', l: 'link' };
            const cardType = shortcutMap[e.key.toLowerCase()];
            if (cardType) {
              e.preventDefault();
              state.addCard(pageId, cardType);
            }
          }
        }
      }
    }
  });
}
