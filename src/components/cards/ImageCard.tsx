import React, { useRef, useState, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { ImageCard } from '@/types/schema';
import { Upload } from 'lucide-react';

export function ImageCardComponent({ card, isEditMode }: { card: ImageCard; isEditMode: boolean }) {
  const { updateCard } = useDocumentStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [intrinsicSize, setIntrinsicSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCard(card.id, { imageData: reader.result as string });
      setIntrinsicSize(null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [card.imageData, isEditMode]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setIntrinsicSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  let renderWidth;
  let renderHeight;

  if (intrinsicSize && containerSize) {
    const iW = intrinsicSize.width;
    const iH = intrinsicSize.height;
    const cW = containerSize.width;
    const cH = containerSize.height;

    if (iW > cW || iH > cH) {
      // Scale DOWN proportionally using a SINGLE uniform scale factor
      const scale = Math.min(cW / iW, cH / iH);
      // Floor the size to avoid fractional pixels / distorted pixels
      renderWidth = Math.floor(iW * scale);
      renderHeight = Math.floor(iH * scale);
    } else {
      // DO NOT upscale, keep original size
      renderWidth = iW;
      renderHeight = iH;
    }
  }

  return (
    <div className="h-full flex flex-col space-y-2 overflow-hidden">
      {isEditMode && (
        <input
          type="text"
          value={card.title}
          onChange={(e) => updateCard(card.id, { title: e.target.value })}
          placeholder="Image title"
          className="w-full shrink-0 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
      )}
      {!isEditMode && card.title && (
        <p className="shrink-0 text-sm font-semibold text-foreground">{card.title}</p>
      )}

      {card.imageData ? (
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-hidden flex items-center justify-center"
        >
          <img
            src={card.imageData}
            alt={card.title || 'Image'}
            onLoad={handleImageLoad}
            className="rounded-sm"
            style={{
              width: renderWidth ? `${renderWidth}px` : undefined,
              height: renderHeight ? `${renderHeight}px` : undefined,
              visibility: (intrinsicSize && containerSize) ? 'visible' : 'hidden',
              display: 'block'
            }}
          />
        </div>
      ) : isEditMode ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-1 min-h-0 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-muted/30 py-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Upload className="h-5 w-5" />
          <span className="text-[10px] font-medium">Upload image</span>
        </button>
      ) : null}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {/* Description field */}
      {isEditMode ? (
        <textarea
          value={card.description || ''}
          onChange={(e) => updateCard(card.id, { description: e.target.value })}
          placeholder="Add a description..."
          rows={2}
          className="w-full shrink-0 resize-none bg-muted/20 rounded-md px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 leading-relaxed border border-transparent focus:border-border/50 transition-colors"
        />
      ) : (
        card.description && (
          <div className="shrink-0 border-t border-border/30 pt-1.5 mt-1">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{card.description}</p>
          </div>
        )
      )}

      {isEditMode && card.imageData && (
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 text-[10px] text-muted-foreground hover:text-primary transition-colors text-left"
        >
          Replace image
        </button>
      )}
    </div>
  );
}
