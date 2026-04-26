import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FileText, Layout, Square, X } from 'lucide-react';
import { BUILT_IN_TEMPLATES, type NoteTemplate } from '@/store/templateStore';

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (template: NoteTemplate, title: string) => void;
}

const TEMPLATE_ICONS = {
  blank: Square,
  notes: FileText,
  visual: Layout,
};

const TEMPLATE_PREVIEW: Record<string, React.ReactNode> = {
  blank: (
    <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
      <rect width="100" height="80" rx="4" fill="hsl(var(--muted))" />
      <text x="50" y="44" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif">Empty</text>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
      <rect width="100" height="80" rx="4" fill="hsl(var(--muted))" />
      <rect x="12" y="12" width="76" height="56" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      <rect x="20" y="20" width="40" height="5" rx="2" fill="hsl(var(--primary) / 0.5)" />
      <rect x="20" y="30" width="60" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.3)" />
      <rect x="20" y="37" width="50" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.3)" />
      <rect x="20" y="44" width="55" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.3)" />
    </svg>
  ),
  visual: (
    <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
      <rect width="100" height="80" rx="4" fill="hsl(var(--muted))" />
      <rect x="6" y="8" width="54" height="28" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      <rect x="64" y="8" width="30" height="34" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      <rect x="6" y="42" width="88" height="30" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      <rect x="12" y="14" width="28" height="4" rx="2" fill="hsl(var(--primary) / 0.4)" />
      <rect x="12" y="22" width="40" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.25)" />
      <rect x="70" y="14" width="18" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.3)" />
      <rect x="70" y="21" width="14" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.2)" />
      <rect x="70" y="28" width="16" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.2)" />
    </svg>
  ),
};

export function TemplatePickerModal({ open, onClose, onCreate }: TemplatePickerModalProps) {
  const [selected, setSelected] = useState<string>('blank');
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    const template = BUILT_IN_TEMPLATES.find((t) => t.id === selected) ?? BUILT_IN_TEMPLATES[0];
    onCreate(template, title.trim() || 'Untitled Note');
    setTitle('');
    setSelected('blank');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[90vw] rounded-xl border border-border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <Dialog.Title className="text-sm font-semibold text-foreground">New Note</Dialog.Title>
            <Dialog.Close asChild>
              <button className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-5">
            {/* Title input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                Note Name
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="Untitled Note"
                className="w-full h-9 rounded-md border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Template selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                Template
              </label>
              <div className="grid grid-cols-3 gap-3">
                {BUILT_IN_TEMPLATES.map((template) => {
                  const Icon = TEMPLATE_ICONS[template.type];
                  const isActive = selected === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelected(template.id)}
                      className={`relative flex flex-col rounded-lg border-2 overflow-hidden transition-all duration-150 ${
                        isActive
                          ? 'border-primary shadow-sm shadow-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {/* Preview */}
                      <div className="h-20 w-full overflow-hidden">
                        {TEMPLATE_PREVIEW[template.id]}
                      </div>
                      {/* Label */}
                      <div className={`px-3 py-2 flex items-center gap-1.5 border-t border-border transition-colors ${isActive ? 'bg-primary/5' : 'bg-card'}`}>
                        <Icon className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-left">
                          <p className={`text-[11px] font-medium leading-none ${isActive ? 'text-primary' : 'text-foreground'}`}>{template.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-md text-xs font-medium text-foreground border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="h-8 px-4 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              Create Note
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
