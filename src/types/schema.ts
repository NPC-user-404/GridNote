export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface TableCell {
  id: string;
  value: string;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
}

export type CardSizePreset = 'small' | 'medium' | 'large';

interface CardBase {
  id: string;
  type: string;
  position: Position;
  size: Size;
  pageId: string;
  colorLabel?: string;
  isPinned?: boolean;
  fontFamily?: string;
  stylePreset?: 'default' | 'soft-highlight' | 'border-emphasis';
  groupId?: string;
  links?: string[];
  sizePreset?: CardSizePreset;
  isDeleted?: boolean;
}

export interface TextCard extends CardBase {
  type: 'text';
  title: string;
  body: string;
}

export interface ImageCard extends CardBase {
  type: 'image';
  title: string;
  imageData: string; // base64
  description?: string;
}

export interface TodoCard extends CardBase {
  type: 'todo';
  title: string;
  items: TodoItem[];
}

export interface LinkCard extends CardBase {
  type: 'link';
  title: string;
  url: string;
  description: string;
}

export interface CodeCard extends CardBase {
  type: 'code';
  title: string;
  code: string;
  language: string;
}

export interface TableCard extends CardBase {
  type: 'table';
  title: string;
  rows: TableRow[];
  tableStyle: 'default' | 'bold-outer' | 'bold-all';
}

export type CompositeLayout = 'stacked' | 'side-by-side' | 'l-shape';

export interface CompositeCard extends CardBase {
  type: 'composite';
  title: string;
  childCardIds: string[];
  layout: CompositeLayout;
}

export type Card = TextCard | ImageCard | TodoCard | LinkCard | CodeCard | TableCard | CompositeCard;

export interface SoftDeletedCard {
  card: Card;
  pageId: string;
  deletedAt: number;
}

// Card size preset dimensions
export const CARD_SIZE_PRESETS: Record<CardSizePreset, { width: number; height: number }> = {
  small: { width: 180, height: 90 },
  medium: { width: 280, height: 120 },
  large: { width: 420, height: 220 },
};

export interface Page {
  id: string;
  index: number;
  cards: Card[];
  locked: boolean;
}

export interface GDocument {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pages: Page[];
}

export type AppMode = 'edit' | 'view';
export type SearchMode = 'cards' | 'content';

// A4 dimensions in pixels at 96dpi
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

// Canvas configuration
export const GRID_SIZE = 16;
export const GRID_GAP = 8; // gap between page elements
export const PAGE_PADDING = 20; // mm equivalent ~75px

// Card constraints
export const MIN_CARD_WIDTH = 120;
export const MIN_CARD_HEIGHT = 60;
export const DEFAULT_CARD_WIDTH = 280;
export const DEFAULT_CARD_HEIGHT = 120;

// Folder system types
export interface FolderNote {
  id: string;
  title: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  isOpen: boolean;
  createdAt: string;
}
