import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { Card, Position } from '@/types/schema';
import { A4_WIDTH_PX, A4_HEIGHT_PX, GRID_SIZE, MIN_CARD_WIDTH, MIN_CARD_HEIGHT } from '@/types/schema';
import { TextCardComponent } from '@/components/cards/TextCard';
import { ImageCardComponent } from '@/components/cards/ImageCard';
import { TodoCardComponent } from '@/components/cards/TodoCard';
import { LinkCardComponent } from '@/components/cards/LinkCard';
import { CodeCardComponent } from '@/components/cards/CodeCard';
import { TableCardComponent } from '@/components/cards/TableCard';
import { GripVertical, Trash2, Lock, Unlock, Palette, Pin, PinOff, Link, Group, Ungroup, X, ChevronUp, ChevronDown } from 'lucide-react';

const CARD_COLORS = [
  { name: 'None', value: undefined, bg: 'transparent', border: 'hsl(var(--border))' },
  { name: 'Red', value: 'red', bg: 'hsl(0 85% 96%)', border: 'hsl(0 72% 60%)' },
  { name: 'Orange', value: 'orange', bg: 'hsl(30 90% 95%)', border: 'hsl(25 90% 58%)' },
  { name: 'Yellow', value: 'yellow', bg: 'hsl(48 95% 94%)', border: 'hsl(45 93% 50%)' },
  { name: 'Green', value: 'green', bg: 'hsl(142 65% 94%)', border: 'hsl(142 70% 42%)' },
  { name: 'Blue', value: 'blue', bg: 'hsl(215 85% 95%)', border: 'hsl(215 75% 55%)' },
  { name: 'Purple', value: 'purple', bg: 'hsl(270 70% 95%)', border: 'hsl(270 60% 58%)' },
  { name: 'Pink', value: 'pink', bg: 'hsl(330 80% 95%)', border: 'hsl(330 70% 60%)' },
];

const CARD_COLORS_DARK: Record<string, { bg: string; border: string }> = {
  red: { bg: 'hsl(0 40% 14%)', border: 'hsl(0 60% 45%)' },
  orange: { bg: 'hsl(25 40% 14%)', border: 'hsl(25 65% 48%)' },
  yellow: { bg: 'hsl(45 40% 14%)', border: 'hsl(45 70% 45%)' },
  green: { bg: 'hsl(142 30% 13%)', border: 'hsl(142 55% 38%)' },
  blue: { bg: 'hsl(215 35% 16%)', border: 'hsl(215 60% 50%)' },
  purple: { bg: 'hsl(270 30% 16%)', border: 'hsl(270 50% 52%)' },
  pink: { bg: 'hsl(330 30% 15%)', border: 'hsl(330 50% 50%)' },
};

function getCardColorStyles(colorLabel?: string): { bg: string; borderLeft: string } {
  if (!colorLabel) return { bg: '', borderLeft: '' };
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark && CARD_COLORS_DARK[colorLabel]) {
    return {
      bg: CARD_COLORS_DARK[colorLabel].bg,
      borderLeft: `3px solid ${CARD_COLORS_DARK[colorLabel].border}`,
    };
  }
  const color = CARD_COLORS.find((c) => c.value === colorLabel);
  if (!color) return { bg: '', borderLeft: '' };
  return {
    bg: color.bg,
    borderLeft: `3px solid ${color.border}`,
  };
}

function getCardTextContent(card: Card): string {
  const parts: string[] = [];
  if ('title' in card && card.title) parts.push(card.title);
  if (card.type === 'text' && card.body) parts.push(card.body);
  if (card.type === 'todo') parts.push(...card.items.map((i) => i.text));
  if (card.type === 'link') {
    if (card.url) parts.push(card.url);
    if (card.description) parts.push(card.description);
  }
  if (card.type === 'code' && card.code) parts.push(card.code);
  if (card.type === 'table') {
    card.rows.forEach((r) => r.cells.forEach((c) => { if (c.value) parts.push(c.value); }));
  }
  return parts.join(' ').toLowerCase();
}

function ColorPicker({ cardId, currentColor }: { cardId: string; currentColor?: string }) {
  const { setCardColor } = useDocumentStore();
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex h-7 w-7 items-center justify-center text-muted-foreground/50 hover:text-primary transition-all duration-150 rounded-md"
        title="Card color"
      >
        <Palette className="h-3 w-3" style={currentColor ? { color: CARD_COLORS.find(c => c.value === currentColor)?.border } : undefined} />
      </button>
      {isOpen && (
        <div
          className="absolute top-8 right-0 z-50 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{ minWidth: 'max-content' }}
        >
          {CARD_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={(e) => {
                e.stopPropagation();
                setCardColor(cardId, color.value);
                setIsOpen(false);
              }}
              className={`h-5 w-5 rounded-full border-2 transition-all duration-150 hover:scale-125 ${currentColor === color.value || (!currentColor && !color.value)
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-popover'
                : ''
                }`}
              style={{
                backgroundColor: color.value ? color.border : 'hsl(var(--muted))',
                borderColor: color.value ? color.border : 'hsl(var(--border))',
              }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ResizeDirection = 'e' | 'w' | 's' | 'se' | 'sw' | 'ne' | 'nw' | 'n';

function CardWrapper({ card, isEditMode, isLocked, isDimmed, isSelected }: { card: Card; isEditMode: boolean; isLocked: boolean; isDimmed: boolean; isSelected: boolean }) {
  const { moveCard, resizeCard, deleteCard, setDragging, toggleCardSelection, toggleCardPin, setSuggestedGroup, suggestedGroup, createGroup, startLinkMode, linkModeSourceId, toggleLink, setHoveredLinkSourceId } = useDocumentStore();
  const colorStyles = getCardColorStyles(card.colorLabel);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; cardX: number; cardY: number } | null>(null);
  const resizeStart = useRef<{
    mouseX: number; mouseY: number;
    cardX: number; cardY: number;
    cardW: number; cardH: number;
    dir: ResizeDirection;
  } | null>(null);

  const canInteract = isEditMode && !isLocked && !card.isPinned;
  const showHandles = isEditMode && !isLocked && (isHovered || isDragging || isResizing || isSelected);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canInteract) return;
      e.preventDefault();
      e.stopPropagation();
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cardX: card.position.x,
        cardY: card.position.y,
      };
      setIsDragging(true);
      setDragging(card.id);
    },
    [card.id, card.position, canInteract, setDragging]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, dir: ResizeDirection) => {
      if (!canInteract) return;
      e.preventDefault();
      e.stopPropagation();
      resizeStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cardX: card.position.x,
        cardY: card.position.y,
        cardW: card.size.width,
        cardH: card.size.height,
        dir,
      };
      setIsResizing(true);
    },
    [card.position, card.size, canInteract]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      const newX = Math.max(0, Math.min(A4_WIDTH_PX - card.size.width, dragStart.current.cardX + dx));
      const newY = Math.max(0, Math.min(A4_HEIGHT_PX - 40, dragStart.current.cardY + dy));
      moveCard(card.id, { x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragging(null);
      if (dragStart.current) {
        // Spatial detection
        if (['text', 'todo', 'link'].includes(card.type)) {
          const state = useDocumentStore.getState();
          const allCards = state.document.pages.flatMap(p => p.cards);
          const PROXIMITY_THRESHOLD = 32;

          const nearby = allCards.find(c => {
            if (c.id === card.id || c.type !== card.type || c.pageId !== card.pageId) return false;
            if (c.groupId && c.groupId === card.groupId) return false;

            const dx = Math.max(0, Math.max(card.position.x - (c.position.x + c.size.width), c.position.x - (card.position.x + card.size.width)));
            const dy = Math.max(0, Math.max(card.position.y - (c.position.y + c.size.height), c.position.y - (card.position.y + card.size.height)));
            return dx <= PROXIMITY_THRESHOLD && dy <= PROXIMITY_THRESHOLD;
          });

          if (nearby) {
            setSuggestedGroup([card.id, nearby.id]);
          } else {
            setSuggestedGroup(null);
          }
        }
      }
      dragStart.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, card.id, card.type, card.position, card.size, card.pageId, card.groupId, moveCard, setDragging, setSuggestedGroup]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStart.current) return;
      const r = resizeStart.current;
      const dx = e.clientX - r.mouseX;
      const dy = e.clientY - r.mouseY;

      let newW = r.cardW;
      let newH = r.cardH;
      let newX = r.cardX;
      let newY = r.cardY;

      if (r.dir.includes('e')) newW = Math.max(MIN_CARD_WIDTH, r.cardW + dx);
      if (r.dir.includes('w')) {
        newW = Math.max(MIN_CARD_WIDTH, r.cardW - dx);
        newX = r.cardX + (r.cardW - newW);
      }
      if (r.dir.includes('s')) newH = Math.max(MIN_CARD_HEIGHT, r.cardH + dy);
      if (r.dir.includes('n')) {
        newH = Math.max(MIN_CARD_HEIGHT, r.cardH - dy);
        newY = r.cardY + (r.cardH - newH);
      }

      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      newW = Math.min(newW, A4_WIDTH_PX - newX);

      resizeCard(card.id, { width: newW, height: newH });
      moveCard(card.id, { x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStart.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, card.id, resizeCard, moveCard]);

  const renderCard = () => {
    switch (card.type) {
      case 'text':
        return <TextCardComponent card={card} isEditMode={isEditMode} />;
      case 'image':
        return <ImageCardComponent card={card} isEditMode={isEditMode} />;
      case 'todo':
        return <TodoCardComponent card={card} isEditMode={isEditMode} />;
      case 'link':
        return <LinkCardComponent card={card} isEditMode={isEditMode} />;
      case 'code':
        return <CodeCardComponent card={card} isEditMode={isEditMode} />;
      case 'table':
        return <TableCardComponent card={card} isEditMode={isEditMode} />;
    }
  };

  return (
    <div
      id={`card-wrapper-${card.id}`}
      className={`absolute animate-card-spawn ${card.isPinned ? 'z-40' : isDragging || isResizing || isSelected ? 'z-50' : 'z-10'}`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: card.size.width,
        height: card.size.height,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease-out, opacity 0.25s ease, visibility 0.25s ease',
        opacity: isDimmed ? 0 : 1,
        visibility: isDimmed ? 'hidden' : 'visible',
        pointerEvents: isDimmed ? 'none' : 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!isDragging && !isResizing) setIsHovered(false); }}
      onClick={(e) => {
        if (linkModeSourceId && linkModeSourceId !== card.id) {
          e.stopPropagation();
          toggleLink(linkModeSourceId, card.id);
          return;
        }
        if (isEditMode) {
          e.stopPropagation();
          toggleCardSelection(card.id, e.shiftKey);
        }
      }}
    >
      {/* Group Suggestion Hint */}
      {suggestedGroup && suggestedGroup[0] === card.id && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              createGroup(suggestedGroup);
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all animate-in slide-in-from-bottom-2"
          >
            <Group className="h-3 w-3" />
            Group Cards
          </button>
        </div>
      )}

      {/* Selection outline — only in edit mode, hidden in print/PDF */}
      {isSelected && isEditMode && (
        <div className="no-print absolute -inset-1 z-0 rounded-xl border-2 border-primary/50 pointer-events-none" />
      )}

      <div
        className={`relative h-full rounded-lg border text-card-foreground transition-all duration-200 ${card.colorLabel ? '' : 'bg-card'} ${card.stylePreset ? `style-${card.stylePreset}` : ''
          } ${isDragging
            ? 'shadow-lg border-border'
            : isResizing || isSelected
              ? 'shadow-md border-border'
              : isHovered && !isLocked
                ? 'shadow-md border-border'
                : 'shadow-sm border-border'
          } ${isLocked ? 'opacity-90' : ''}`}
        style={{
          fontFamily: card.fontFamily,
          backgroundColor: card.colorLabel ? colorStyles.bg : undefined,
          ...(colorStyles.borderLeft ? { borderLeft: colorStyles.borderLeft } : {}),
        }}
      >
        {/* Card Top Menu */}
        {isEditMode && !isLocked && (
          <div className={`card-top-menu absolute top-0 left-0 right-0 flex h-7 items-center justify-between bg-muted/30 rounded-t-lg z-20 transition-opacity duration-150 ${showHandles ? 'opacity-100' : 'opacity-70'} px-1`}>
            <div className="flex items-center shrink-0">
              {!isMenuCollapsed && (
                <div
                  className="relative group/link"
                  onMouseEnter={() => setHoveredLinkSourceId(card.id)}
                  onMouseLeave={() => setHoveredLinkSourceId(null)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); startLinkMode(linkModeSourceId === card.id ? null : card.id); }}
                    className={`flex h-6 w-6 items-center justify-center transition-all duration-150 rounded-md ${linkModeSourceId === card.id ? 'bg-primary/20 text-primary' : card.links?.length ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary hover:bg-muted/50'}`}
                    title={linkModeSourceId === card.id ? 'Cancel link' : 'Link card'}
                  >
                    <Link className="h-3 w-3" />
                  </button>
                  {card.links && card.links.length > 0 && (
                    <div className="absolute top-full left-0 pt-1 hidden group-hover/link:block z-50">
                      <div className="flex flex-col gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg text-xs w-48 animate-in fade-in zoom-in-95">
                        <span className="text-muted-foreground font-semibold mb-1">Linked Cards:</span>
                        {card.links.map(id => {
                          const linkedCard = useDocumentStore.getState().document.pages.flatMap(p => p.cards).find(c => c.id === id);
                          if (!linkedCard) return null;
                          return (
                            <div key={id} className="group/linkitem flex items-center gap-1">
                              <button onClick={(e) => {
                                e.stopPropagation();
                                const el = document.getElementById(`card-wrapper-${id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  el.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
                                  setTimeout(() => el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'ring-offset-background'), 1500);
                                }
                              }} className="flex-1 text-left truncate hover:bg-muted p-1.5 rounded-md transition-colors cursor-pointer text-foreground/80 hover:text-foreground font-medium">
                                {('title' in linkedCard && linkedCard.title) ? linkedCard.title : (linkedCard.type.charAt(0).toUpperCase() + linkedCard.type.slice(1) + ' Card')}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); toggleLink(card.id, id); }} className="opacity-0 group-hover/linkitem:opacity-100 p-1 text-muted-foreground hover:text-destructive flex-shrink-0 transition-opacity" title="Remove link">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drag Handle */}
            <div
              onMouseDown={canInteract && !isMenuCollapsed ? handleMouseDown : undefined}
              className={`flex-1 flex h-full items-center justify-center min-w-0 ${canInteract && !isMenuCollapsed ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {canInteract && !isMenuCollapsed && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
            </div>

            {/* Right Controls */}
            <div className="flex items-center shrink-0">
              {!isMenuCollapsed && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCardPin(card.id); }}
                    className={`flex h-6 w-6 items-center justify-center transition-all duration-150 rounded-md hover:bg-muted/50 ${card.isPinned ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                    title={card.isPinned ? 'Unpin card' : 'Pin card'}
                  >
                    {card.isPinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
                  </button>
                  <div className="scale-90 origin-center">
                    <ColorPicker cardId={card.id} currentColor={card.colorLabel} />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                    className="card-delete-btn flex h-6 w-6 items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 rounded-md"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
              {/* Collapse toggle — always visible */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuCollapsed(!isMenuCollapsed); }}
                className="flex h-6 w-6 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-all duration-150 rounded-md hover:bg-muted/50"
                title={isMenuCollapsed ? 'Show controls' : 'Hide controls'}
              >
                {isMenuCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </div>
          </div>
        )}

        {/* Lock indicator */}
        {isEditMode && isLocked && (
          <div className="absolute top-1 left-1 z-20">
            <Lock className="h-3 w-3 text-muted-foreground/50" />
          </div>
        )}

        <div className={`${isEditMode && !isLocked && !isMenuCollapsed ? 'pt-7 p-3' : 'p-3'} h-full overflow-hidden`}>
          {renderCard()}
        </div>
      </div>

      {/* Figma-style resize handles — visible on hover */}
      {showHandles && canInteract && (
        <>
          {/* Edge handles — invisible wide hit areas */}
          <div onMouseDown={(e) => handleResizeStart(e, 'n')} className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize z-30" />
          <div onMouseDown={(e) => handleResizeStart(e, 's')} className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize z-30" />
          <div onMouseDown={(e) => handleResizeStart(e, 'e')} className="absolute top-3 -right-1 bottom-3 w-2 cursor-e-resize z-30" />
          <div onMouseDown={(e) => handleResizeStart(e, 'w')} className="absolute top-3 -left-1 bottom-3 w-2 cursor-w-resize z-30" />

          {/* Edge midpoint indicators — hidden */}
          <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-transparent pointer-events-none z-30" />
          <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-transparent pointer-events-none z-30" />
          <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 h-6 w-[2px] rounded-full bg-transparent pointer-events-none z-30" />
          <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 h-6 w-[2px] rounded-full bg-transparent pointer-events-none z-30" />

          {/* Corner handles — invisible, cursor preserved */}
          <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-transparent border-none rounded-[1px] cursor-nw-resize z-40" />
          <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-transparent border-none rounded-[1px] cursor-ne-resize z-40" />
          <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-transparent border-none rounded-[1px] cursor-sw-resize z-40" />
          <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-transparent border-none rounded-[1px] cursor-se-resize z-40" />
        </>
      )}
    </div>
  );
}

function A4Page({
  pageId,
  cards,
  pageIndex,
  isEditMode,
  isLocked,
  totalPages,
  searchQuery,
  searchMode,
  selectedCardIds,
}: {
  pageId: string;
  cards: Card[];
  pageIndex: number;
  isEditMode: boolean;
  isLocked: boolean;
  totalPages: number;
  searchQuery: string;
  searchMode: 'cards' | 'content';
  selectedCardIds: string[];
}) {
  const { removePage, togglePageLock, ungroup } = useDocumentStore();
  const query = searchQuery.trim().toLowerCase();

  const groupedCards = cards.reduce((acc, card) => {
    if (card.groupId) {
      if (!acc[card.groupId]) acc[card.groupId] = [];
      acc[card.groupId].push(card);
    }
    return acc;
  }, {} as Record<string, Card[]>);

  return (
    <div className="relative mb-10 flex flex-col items-center">
      <div className="no-print mb-2 flex items-center gap-3">
        <span className="text-[10px] font-medium text-muted-foreground tracking-widest">
          PAGE {pageIndex + 1}
        </span>
        {isEditMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => togglePageLock(pageId)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isLocked ? 'Unlock page' : 'Lock page'}
            >
              {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              {isLocked ? 'Locked' : 'Unlocked'}
            </button>
            {totalPages > 1 && (
              <button
                onClick={() => removePage(pageId)}
                className="flex items-center rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Delete page"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <div
        id={`page-${pageId}`}
        className="print-page relative bg-card rounded-sm shadow-[0_2px_24px_-6px_hsl(var(--page-shadow)/0.25)] dark:border-2 dark:border-white/10 dark:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
        style={{
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
        }}
      >
        {isEditMode && (
          <div
            className="grid-dots pointer-events-none absolute inset-0 rounded-sm"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--grid-dot)) 0.8px, transparent 0.8px)`,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              opacity: 0.45,
            }}
          />
        )}

        {cards.map((card) => {
          let isDimmed = false;
          if (query.length > 0) {
            if (searchMode === 'content') {
              isDimmed = !getCardTextContent(card).includes(query);
            } else {
              // 'cards' mode: match title or type label
              const titleMatch = ('title' in card && card.title.toLowerCase().includes(query));
              const typeMatch = card.type.toLowerCase().includes(query);
              isDimmed = !titleMatch && !typeMatch;
            }
          }
          const isSelected = selectedCardIds.includes(card.id);
          return (
            <CardWrapper key={card.id} card={card} isEditMode={isEditMode} isLocked={isLocked} isDimmed={isDimmed} isSelected={isSelected} />
          );
        })}

        {/* Group Boundaries */}
        {Object.entries(groupedCards).map(([groupId, groupCards]) => {
          if (groupCards.length === 0) return null;
          const minX = Math.min(...groupCards.map((c) => c.position.x));
          const minY = Math.min(...groupCards.map((c) => c.position.y));
          const maxX = Math.max(...groupCards.map((c) => c.position.x + c.size.width));
          const maxY = Math.max(...groupCards.map((c) => c.position.y + c.size.height));
          const padding = 16;
          return (
            <div
              key={groupId}
              className="absolute rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 pointer-events-none z-0 transition-all duration-300"
              style={{
                left: minX - padding,
                top: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2,
              }}
            >
              {isEditMode && !isLocked && (
                <div className="absolute -top-3 left-2 pointer-events-auto z-50">
                  <button
                    onClick={(e) => { e.stopPropagation(); ungroup(groupId); }}
                    className="flex items-center gap-1 rounded-md bg-background px-2 py-1 text-[10px] text-muted-foreground border shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                    title="Ungroup"
                  >
                    <Ungroup className="h-3 w-3" />
                    Ungroup
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {cards.length === 0 && isEditMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/40">Add cards from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkLinesOverlay() {
  const { document: doc, hoveredLinkSourceId, linkModeSourceId } = useDocumentStore();
  const sourceId = hoveredLinkSourceId || linkModeSourceId;
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!linkModeSourceId) {
      setMousePos(null);
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('canvas-container');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      setMousePos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top + container.scrollTop,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [linkModeSourceId]);

  if (!sourceId) return null;

  const allCards = doc.pages.flatMap((p, pageIndex) =>
    p.cards.map(c => ({
      ...c,
      globalY: pageIndex * (A4_HEIGHT_PX + 40) + 36 + c.position.y,
    }))
  );

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-hidden">
      <svg className="w-full h-full">
        {(() => {
          const sourceEl = document.getElementById(`card-wrapper-${sourceId}`);
          if (!sourceEl) return null;

          const containerRect = document.getElementById('canvas-container')?.getBoundingClientRect();
          if (!containerRect) return null;

          const sourceRect = sourceEl.getBoundingClientRect();
          const startX = sourceRect.left + sourceRect.width / 2 - containerRect.left;
          const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top + (document.getElementById('canvas-container')?.scrollTop || 0);

          const lines: React.ReactNode[] = [];

          const sourceCard = allCards.find(c => c.id === sourceId);
          if (sourceCard && sourceCard.links && sourceCard.links.length > 0) {
            sourceCard.links.forEach(targetId => {
              const targetEl = document.getElementById(`card-wrapper-${targetId}`);
              if (!targetEl) return;
              const targetRect = targetEl.getBoundingClientRect();
              const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
              const endY = targetRect.top + targetRect.height / 2 - containerRect.top + (document.getElementById('canvas-container')?.scrollTop || 0);

              lines.push(
                <line
                  key={targetId}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />
              );
            });
          }

          if (linkModeSourceId === sourceId && mousePos) {
            lines.push(
              <line
                key="active-link"
                x1={startX}
                y1={startY}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="8 8"
                opacity="0.8"
                className="animate-pulse"
              />
            );
          }

          return lines;
        })()}
      </svg>
    </div>
  );
}

export function Canvas() {
  const { document: doc, mode, searchQuery, searchMode, selectedCardIds, setSelectedCards, addCard } = useDocumentStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    import('@/store/documentStore').then((m) => {
      m.setLastCanvasCursorPos({ clientX: e.clientX, clientY: e.clientY });
    });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'edit') return;
    const isCardClick = (e.target as HTMLElement).closest('.relative.h-full.rounded-lg');
    if (!isCardClick && selectedCardIds.length > 0) {
      setSelectedCards([]);
    }
  }, [mode, selectedCardIds.length, setSelectedCards]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'edit') return;
    // Prevent adding if clicking inside an existing card or locked page
    // The event target will typically be the page background or grid-dots
    const isPageClick = (e.target as HTMLElement).closest('.print-page');
    const isCardClick = (e.target as HTMLElement).closest('.relative.h-full.rounded-lg');

    if (isPageClick && !isCardClick) {
      // Find which page we clicked
      const pageEl = (e.target as HTMLElement).closest('[id^="page-"]');
      if (pageEl) {
        const pageId = pageEl.id.replace('page-', '');
        addCard(pageId, 'text');
      } else if (doc.pages.length > 0) {
        addCard(doc.pages[0].id, 'text');
      }
    }
  }, [mode, doc.pages, addCard]);

  return (
    <div
      id="canvas-container"
      className="flex-1 overflow-auto bg-canvas py-10 relative"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex flex-col items-center px-4 relative min-h-full">
        <LinkLinesOverlay />
        {doc.pages.map((page) => (
          <A4Page
            key={page.id}
            pageId={page.id}
            cards={page.cards}
            pageIndex={page.index}
            isEditMode={mode === 'edit'}
            isLocked={page.locked}
            totalPages={doc.pages.length}
            searchQuery={searchQuery}
            searchMode={searchMode}
            selectedCardIds={selectedCardIds}
          />
        ))}
      </div>
    </div>
  );
}
