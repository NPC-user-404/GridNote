import jsPDF from 'jspdf';
import type { GDocument, Card, TextCard, ImageCard, TodoCard, LinkCard } from '@/types/schema';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '@/types/schema';

// Convert pixels (96dpi) to mm
const PX_TO_MM = 25.4 / 96;
const A4_W_MM = 210;
const A4_H_MM = 297;

const CARD_PADDING = 4; // mm inside card
const TITLE_FONT_SIZE = 11;
const BODY_FONT_SIZE = 9;
const LINE_HEIGHT = 1.4;

function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function renderTextCard(doc: jsPDF, card: TextCard, x: number, y: number, w: number, h: number) {
  const innerW = w - CARD_PADDING * 2;
  let cursorY = y + CARD_PADDING + TITLE_FONT_SIZE * 0.35;

  if (card.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setTextColor(30, 30, 30);
    const titleLines = wrapText(doc, card.title, innerW, TITLE_FONT_SIZE);
    doc.text(titleLines, x + CARD_PADDING, cursorY);
    cursorY += titleLines.length * TITLE_FONT_SIZE * 0.35 * LINE_HEIGHT + 2;
  }

  if (card.body) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(60, 60, 60);
    const bodyLines = wrapText(doc, card.body, innerW, BODY_FONT_SIZE);
    // Clip to available height
    const maxLines = Math.floor((y + h - cursorY - CARD_PADDING) / (BODY_FONT_SIZE * 0.35 * LINE_HEIGHT));
    const clippedLines = bodyLines.slice(0, Math.max(1, maxLines));
    doc.text(clippedLines, x + CARD_PADDING, cursorY);
  }
}

function renderImageCard(doc: jsPDF, card: ImageCard, x: number, y: number, w: number, h: number) {
  const innerW = w - CARD_PADDING * 2;
  let cursorY = y + CARD_PADDING + TITLE_FONT_SIZE * 0.35;

  if (card.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setTextColor(30, 30, 30);
    const titleLines = wrapText(doc, card.title, innerW, TITLE_FONT_SIZE);
    doc.text(titleLines, x + CARD_PADDING, cursorY);
    cursorY += titleLines.length * TITLE_FONT_SIZE * 0.35 * LINE_HEIGHT + 2;
  }

  if (card.imageData) {
    const availH = y + h - cursorY - CARD_PADDING;
    if (availH > 2) {
      try {
        doc.addImage(card.imageData, 'JPEG', x + CARD_PADDING, cursorY, innerW, Math.min(availH, innerW * 0.75));
      } catch {
        // fallback: show placeholder text if image format unsupported
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(BODY_FONT_SIZE);
        doc.setTextColor(150, 150, 150);
        doc.text('[Image]', x + CARD_PADDING, cursorY);
      }
    }
  }
}

function renderTodoCard(doc: jsPDF, card: TodoCard, x: number, y: number, w: number, h: number) {
  const innerW = w - CARD_PADDING * 2;
  let cursorY = y + CARD_PADDING + TITLE_FONT_SIZE * 0.35;

  if (card.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setTextColor(30, 30, 30);
    const titleLines = wrapText(doc, card.title, innerW, TITLE_FONT_SIZE);
    doc.text(titleLines, x + CARD_PADDING, cursorY);
    cursorY += titleLines.length * TITLE_FONT_SIZE * 0.35 * LINE_HEIGHT + 2;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_FONT_SIZE);
  const itemLineH = BODY_FONT_SIZE * 0.35 * LINE_HEIGHT + 1;
  const maxY = y + h - CARD_PADDING;

  for (const item of card.items) {
    if (cursorY > maxY) break;

    const prefix = item.checked ? '[✓] ' : '[ ] ';
    const itemColor = item.checked ? 150 : 60;
    doc.setTextColor(itemColor, itemColor, itemColor);
    const fullText = `${prefix}${item.text}`;
    doc.text(fullText, x + CARD_PADDING, cursorY);

    // Draw strikethrough across task text for checked items
    if (item.checked) {
      const prefixWidth = doc.getTextWidth(prefix);
      const textWidth = doc.getTextWidth(item.text);
      const strikeY = cursorY - BODY_FONT_SIZE * 0.35 * 0.3; // vertically center on text
      doc.setDrawColor(itemColor, itemColor, itemColor);
      doc.setLineWidth(0.2);
      doc.line(x + CARD_PADDING + prefixWidth, strikeY, x + CARD_PADDING + prefixWidth + textWidth, strikeY);
    }

    cursorY += itemLineH;
  }
}

function renderLinkCard(doc: jsPDF, card: LinkCard, x: number, y: number, w: number, h: number) {
  const innerW = w - CARD_PADDING * 2;
  let cursorY = y + CARD_PADDING + TITLE_FONT_SIZE * 0.35;

  if (card.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setTextColor(30, 30, 30);
    const titleLines = wrapText(doc, card.title, innerW, TITLE_FONT_SIZE);
    doc.text(titleLines, x + CARD_PADDING, cursorY);
    cursorY += titleLines.length * TITLE_FONT_SIZE * 0.35 * LINE_HEIGHT + 2;
  }

  if (card.url) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(37, 99, 235); // blue
    const urlLines = wrapText(doc, card.url, innerW, BODY_FONT_SIZE);
    const urlText = urlLines[0] || card.url;
    doc.textWithLink(urlText, x + CARD_PADDING, cursorY, { url: card.url });
    cursorY += BODY_FONT_SIZE * 0.35 * LINE_HEIGHT + 2;
  }

  if (card.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(100, 100, 100);
    const descLines = wrapText(doc, card.description, innerW, BODY_FONT_SIZE);
    const maxLines = Math.floor((y + h - cursorY - CARD_PADDING) / (BODY_FONT_SIZE * 0.35 * LINE_HEIGHT));
    const clippedLines = descLines.slice(0, Math.max(1, maxLines));
    doc.text(clippedLines, x + CARD_PADDING, cursorY);
  }
}

function getCardPdfColors(colorLabel?: string): { bg: [number, number, number], border: [number, number, number] } {
  switch (colorLabel) {
    case 'red': return { bg: [253, 236, 236], border: [235, 71, 71] };
    case 'orange': return { bg: [254, 240, 231], border: [243, 115, 53] };
    case 'yellow': return { bg: [254, 248, 225], border: [246, 187, 9] };
    case 'green': return { bg: [228, 251, 236], border: [32, 182, 87] };
    case 'blue': return { bg: [231, 241, 253], border: [45, 126, 236] };
    case 'purple': return { bg: [245, 235, 252], border: [164, 88, 231] };
    case 'pink': return { bg: [253, 232, 242], border: [230, 76, 153] };
    default: return { bg: [255, 255, 255], border: [200, 200, 200] };
  }
}

function renderCard(doc: jsPDF, card: Card, x: number, y: number, w: number, h: number) {
  // Card background & border
  const colors = getCardPdfColors(card.colorLabel);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  switch (card.type) {
    case 'text':
      renderTextCard(doc, card, x, y, w, h);
      break;
    case 'image':
      renderImageCard(doc, card, x, y, w, h);
      break;
    case 'todo':
      renderTodoCard(doc, card, x, y, w, h);
      break;
    case 'link':
      renderLinkCard(doc, card, x, y, w, h);
      break;
  }
}

export function exportDocumentPdf(gdoc: GDocument) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  gdoc.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    // Sort cards top-to-bottom, left-to-right
    const sortedCards = [...page.cards].sort((a, b) => {
      if (Math.abs(a.position.y - b.position.y) < 10) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

    for (const card of sortedCards) {
      const x = pxToMm(card.position.x);
      const y = pxToMm(card.position.y);
      const w = pxToMm(card.size.width);
      const h = pxToMm(card.size.height);

      // Clamp to page bounds
      const clampedW = Math.min(w, A4_W_MM - x);
      const clampedH = Math.min(h, A4_H_MM - y);

      if (clampedW > 0 && clampedH > 0) {
        renderCard(doc, card, x, y, clampedW, clampedH);
      }
    }
  });

  const filename = gdoc.title ? `${gdoc.title}.pdf` : 'gridnote-export.pdf';
  doc.save(filename);
}
