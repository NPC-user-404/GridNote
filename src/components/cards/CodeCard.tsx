import React, { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import type { CodeCard } from '@/types/schema';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('java', java);

const LANGUAGES = [
  { value: 'javascript', label: 'JS' },
  { value: 'typescript', label: 'TS' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'MD' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
];

const HLJS_STYLE = `
.hljs { background: transparent; padding: 0; }
.hljs-keyword { color: hsl(280 80% 65%); }
.hljs-string { color: hsl(110 60% 55%); }
.hljs-comment { color: hsl(0 0% 50%); font-style: italic; }
.hljs-number { color: hsl(30 90% 60%); }
.hljs-built_in { color: hsl(200 80% 60%); }
.hljs-function { color: hsl(200 80% 65%); }
.hljs-title { color: hsl(50 90% 60%); }
.hljs-attr { color: hsl(200 80% 60%); }
.hljs-variable { color: hsl(0 0% 85%); }
.hljs-literal { color: hsl(30 90% 60%); }
.hljs-type { color: hsl(190 80% 60%); }
.hljs-operator { color: hsl(0 0% 75%); }
.hljs-punctuation { color: hsl(0 0% 70%); }
.hljs-tag { color: hsl(0 70% 65%); }
.hljs-name { color: hsl(130 60% 55%); }
.hljs-selector-class { color: hsl(50 90% 60%); }
.hljs-selector-id { color: hsl(30 90% 60%); }
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const el = document.createElement('style');
  el.textContent = HLJS_STYLE;
  document.head.appendChild(el);
}

export function CodeCardComponent({ card, isEditMode }: { card: CodeCard; isEditMode: boolean }) {
  const { updateCard } = useDocumentStore();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  useEffect(() => { injectStyle(); }, []);

  useEffect(() => {
    if (codeRef.current) {
      const codeToHighlight = card.code || (isEditMode ? '' : '// empty');
      if (codeToHighlight) {
        const highlighted = hljs.highlight(codeToHighlight + (codeToHighlight.endsWith('\n') ? ' ' : ''), { language: card.language }).value;
        codeRef.current.innerHTML = highlighted;
      } else {
        codeRef.current.innerHTML = '';
      }
    }
  }, [card.code, card.language, isEditMode]);

  useEffect(() => {
    if (!showLangMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showLangMenu]);

  const currentLang = LANGUAGES.find((l) => l.value === card.language) ?? LANGUAGES[0];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        {isEditMode ? (
          <input
            type="text"
            value={card.title}
            onChange={(e) => updateCard(card.id, { title: e.target.value })}
            placeholder="Code title..."
            className="bg-transparent text-[11px] font-semibold text-foreground outline-none placeholder:text-muted-foreground flex-1 mr-2"
          />
        ) : (
          card.title ? (
            <span className="text-[11px] font-semibold text-foreground truncate flex-1 mr-2">{card.title}</span>
          ) : <span className="flex-1" />
        )}

        {/* Language badge / selector */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); if (isEditMode) setShowLangMenu(!showLangMenu); }}
            className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-colors ${
              isEditMode
                ? 'border-border text-muted-foreground hover:text-primary hover:border-primary cursor-pointer'
                : 'border-transparent text-muted-foreground/60 cursor-default'
            }`}
          >
            {currentLang.label}
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-6 z-50 bg-popover border border-border rounded-lg shadow-lg p-1 grid grid-cols-2 gap-0.5 min-w-[120px] animate-in fade-in-0 zoom-in-95">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCard(card.id, { language: lang.value });
                    setShowLangMenu(false);
                  }}
                  className={`text-left text-[10px] px-2 py-1 rounded transition-colors ${
                    lang.value === card.language
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Code area */}
      <div className="relative flex-1 rounded bg-muted/40 dark:bg-black/30 min-h-0 overflow-hidden">
        {isEditMode ? (
          <>
            <pre 
              ref={preRef}
              className="absolute inset-0 p-2 m-0 text-[11px] leading-relaxed pointer-events-none overflow-hidden" 
              style={{ whiteSpace: 'pre', tabSize: 2 }}
              aria-hidden="true"
            >
              <code ref={codeRef} />
            </pre>
            <textarea
              value={card.code}
              onChange={(e) => updateCard(card.id, { code: e.target.value })}
              onScroll={handleScroll}
              placeholder={`// ${currentLang.label} code...`}
              spellCheck={false}
              className="absolute inset-0 p-2 m-0 w-full h-full resize-none border-none bg-transparent text-[11px] outline-none leading-relaxed"
              style={{ 
                fontFamily: "'JetBrains Mono', monospace", 
                tabSize: 2, 
                color: 'transparent', 
                caretColor: 'hsl(var(--foreground))',
                whiteSpace: 'pre',
              }}
            />
          </>
        ) : (
          <pre className="p-2 text-[11px] leading-relaxed overflow-auto h-full w-full m-0" style={{ whiteSpace: 'pre', tabSize: 2 }}>
            <code ref={codeRef} />
          </pre>
        )}
      </div>
    </div>
  );
}
