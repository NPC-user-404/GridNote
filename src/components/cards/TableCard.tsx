import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { TableCard, TableRow, TableCell } from '@/types/schema';
import { Plus, Minus } from 'lucide-react';

function generateId() { return crypto.randomUUID(); }

const STYLE_LABELS: Record<TableCard['tableStyle'], string> = {
  default: 'Default',
  'bold-outer': 'Bold Outer',
  'bold-all': 'Bold All',
};

function getTableStyles(style: TableCard['tableStyle']): {
  table: React.CSSProperties;
  cell: React.CSSProperties;
} {
  const base: React.CSSProperties = {
    borderCollapse: 'collapse',
    width: '100%',
    tableLayout: 'fixed',
  };
  switch (style) {
    case 'bold-outer':
      return {
        table: { ...base, border: '2px solid hsl(var(--foreground) / 0.5)' },
        cell: { border: '1px solid hsl(var(--border))', padding: '3px 6px', fontSize: '11px' },
      };
    case 'bold-all':
      return {
        table: { ...base, border: '2px solid hsl(var(--foreground) / 0.5)' },
        cell: { border: '2px solid hsl(var(--foreground) / 0.3)', padding: '3px 6px', fontSize: '11px' },
      };
    default:
      return {
        table: { ...base, border: '1px solid hsl(var(--border))' },
        cell: { border: '1px solid hsl(var(--border))', padding: '3px 6px', fontSize: '11px' },
      };
  }
}

export function TableCardComponent({ card, isEditMode }: { card: TableCard; isEditMode: boolean }) {
  const { updateCard } = useDocumentStore();

  const updateRows = (rows: TableRow[]) => updateCard(card.id, { rows });

  const addRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const colCount = card.rows[0]?.cells.length ?? 3;
    const newRow: TableRow = {
      id: generateId(),
      cells: Array.from({ length: colCount }, () => ({ id: generateId(), value: '' })),
    };
    updateRows([...card.rows, newRow]);
  };

  const removeRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.rows.length <= 1) return;
    updateRows(card.rows.slice(0, -1));
  };

  const addCol = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateRows(card.rows.map((r) => ({
      ...r,
      cells: [...r.cells, { id: generateId(), value: '' }],
    })));
  };

  const removeCol = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((card.rows[0]?.cells.length ?? 0) <= 1) return;
    updateRows(card.rows.map((r) => ({ ...r, cells: r.cells.slice(0, -1) })));
  };

  const updateCell = (rowId: string, cellId: string, value: string) => {
    updateRows(
      card.rows.map((r) =>
        r.id === rowId
          ? { ...r, cells: r.cells.map((c) => (c.id === cellId ? { ...c, value } : c)) }
          : r
      )
    );
  };

  const cycleStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const styles: TableCard['tableStyle'][] = ['default', 'bold-outer', 'bold-all'];
    const idx = styles.indexOf(card.tableStyle);
    updateCard(card.id, { tableStyle: styles[(idx + 1) % styles.length] });
  };

  const { table: tableStyle, cell: cellStyle } = getTableStyles(card.tableStyle);

  return (
    <div className="h-full flex flex-col overflow-hidden gap-1">
      {/* Title */}
      {isEditMode ? (
        <input
          type="text"
          value={card.title}
          onChange={(e) => updateCard(card.id, { title: e.target.value })}
          placeholder="Table title..."
          className="bg-transparent text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground flex-shrink-0 w-full"
        />
      ) : (
        card.title && (
          <p className="text-xs font-semibold text-foreground flex-shrink-0 truncate">{card.title}</p>
        )
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table style={tableStyle}>
          <tbody>
            {card.rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell) => (
                  <td key={cell.id} style={cellStyle}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={cell.value}
                        onChange={(e) => updateCell(row.id, cell.id, e.target.value)}
                        className="w-full bg-transparent text-foreground outline-none"
                        style={{ fontSize: '11px', minWidth: 0 }}
                      />
                    ) : (
                      <span className="text-foreground" style={{ fontSize: '11px' }}>{cell.value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controls — only in edit mode */}
      {isEditMode && (
        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest mr-1">Rows</span>
          <button
            onClick={addRow}
            className="flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title="Add row"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={removeRow}
            className="flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            title="Remove last row"
            disabled={card.rows.length <= 1}
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest ml-2 mr-1">Cols</span>
          <button
            onClick={addCol}
            className="flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title="Add column"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={removeCol}
            className="flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            title="Remove last column"
            disabled={(card.rows[0]?.cells.length ?? 0) <= 1}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={cycleStyle}
            className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors uppercase tracking-widest"
            title="Cycle border style"
          >
            {STYLE_LABELS[card.tableStyle]}
          </button>
        </div>
      )}
    </div>
  );
}
