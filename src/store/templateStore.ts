import type { Card } from '@/types/schema';
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT, A4_WIDTH_PX } from '@/types/schema';

export type TemplateType = 'blank' | 'notes' | 'visual';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  cards: Omit<Card, 'id' | 'pageId'>[];
}

const CENTER_X = Math.round((A4_WIDTH_PX - DEFAULT_CARD_WIDTH) / 2 / 16) * 16;

export const BUILT_IN_TEMPLATES: NoteTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start fresh with an empty canvas',
    type: 'blank',
    cards: [],
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Text-focused layout for writing',
    type: 'notes',
    cards: [
      {
        type: 'text',
        title: 'Note Title',
        body: '',
        position: { x: CENTER_X, y: 80 },
        size: { width: 400, height: 160 },
      } as Omit<Card, 'id' | 'pageId'>,
    ],
  },
  {
    id: 'visual',
    name: 'Visual',
    description: 'Pre-arranged multi-card layout',
    type: 'visual',
    cards: [
      {
        type: 'text',
        title: 'Overview',
        body: 'Add your key points here...',
        position: { x: 48, y: 80 },
        size: { width: 320, height: 140 },
      } as Omit<Card, 'id' | 'pageId'>,
      {
        type: 'todo',
        title: 'Action Items',
        items: [
          { id: crypto.randomUUID(), text: 'First task', checked: false },
          { id: crypto.randomUUID(), text: 'Second task', checked: false },
        ],
        position: { x: 400, y: 80 },
        size: { width: 280, height: 160 },
      } as Omit<Card, 'id' | 'pageId'>,
      {
        type: 'text',
        title: 'Notes',
        body: '',
        position: { x: 48, y: 256 },
        size: { width: 632, height: 120 },
      } as Omit<Card, 'id' | 'pageId'>,
    ],
  },
];
