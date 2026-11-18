import React, { useEffect, useRef } from 'react';
import { BookOpen, Search, X } from 'lucide-react';

/**
 * Renders the collapsible Left Source Inspector Pane with click-to-highlight
 * verbatim quote matching so users can visually audit every citation in context.
 */
export default function SourceViewerPane({
  sections,
  activeQuote,
  onClearActiveQuote,
  onCollapse
}) {
  const highlightRef = useRef(null);

  useEffect(() => {
    if (activeQuote && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeQuote]);

  function renderHighlightedText(text, quoteObj) {
    if (!quoteObj || !quoteObj.verbatimQuote) {
      return text;
    }
    const q = quoteObj.verbatimQuote.trim();
    if (!q) return text;

    // Escape regex special chars and allow flexible whitespace/newlines between words
    const escapedWords = q
      .split(/\s+/)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedWords.join('\\s+')})`, 'i');
    const parts = text.split(pattern);

    if (parts.length === 1) {
      return text;
    }

    let matchedOnce = false;
    return parts.map((part, i) => {
      if (!matchedOnce && pattern.test(part)) {
        matchedOnce = true;
        return (
          <mark
            key={i}
            ref={highlightRef}
            style={{
              background: '#fde047',
              color: '#0f172a',
              padding: '0.1rem 0.25rem',
              borderRadius: '4px',
              boxShadow: '0 0 0 2px #eab308',
              fontWeight: 600
            }}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }

  return (
    <aside className="card source-pane-column" aria-label="Annotated source document viewer">
      <div className="card-header" style={{ padding: '0.9rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} />
          <h3 style={{ fontSize: '1rem' }}>Source Document Text</h3>
        </div>
        <button
          id="btn-collapse-source-pane"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onCollapse}
          title="Collapse source reader pane"
        >
          Hide Source
        </button>
      </div>

      {activeQuote && (
        <div
          style={{
            background: '#fef9c3',
            borderBottom: '1px solid #facc15',
            padding: '0.6rem 1rem',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={14} />
            Highlighting citation: <strong>{activeQuote.sectionRef}</strong> ({activeQuote.pageRef})
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
            onClick={onClearActiveQuote}
          >
            <X size={13} /> Clear
          </button>
        </div>
      )}

      <div
        className="card-body"
        style={{
          padding: '1rem',
          maxHeight: '78vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {sections.map((sec) => (
          <div
            key={sec.id}
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: sec.selected ? 'var(--bg-elevated)' : 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              opacity: sec.selected ? 1 : 0.6
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                paddingBottom: '0.4rem',
                borderBottom: '1px dashed var(--border-subtle)'
              }}
            >
              <strong style={{ fontSize: '0.88rem', color: 'var(--ink-primary)' }}>{sec.title}</strong>
              <span className="badge badge-neutral">Page {sec.pageStart}</span>
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '0.96rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                color: 'var(--ink-primary)'
              }}
            >
              {renderHighlightedText(sec.rawText, activeQuote)}
            </pre>
          </div>
        ))}
      </div>
    </aside>
  );
}
