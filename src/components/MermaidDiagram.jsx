import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitBranch, Code2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'strict',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 14
  }
});

export default function MermaidDiagram({ chartCode, fallbackChartCode }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [showRawCode, setShowRawCode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      const primaryCode = (chartCode || '').trim();
      const backupCode = (fallbackChartCode || '').trim();
      if (!primaryCode && !backupCode) return;

      const uniqueId = `mermaid-svg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      try {
        const { svg } = await mermaid.render(uniqueId, primaryCode || backupCode);
        if (!cancelled) {
          setSvgContent(svg);
          setUsedFallback(false);
        }
      } catch {
        // Fallback to deterministic synthesized Mermaid flowchart if LLM output had syntax issues
        if (backupCode) {
          try {
            const fallbackId = `mermaid-fallback-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const { svg } = await mermaid.render(fallbackId, backupCode);
            if (!cancelled) {
              setSvgContent(svg);
              setUsedFallback(true);
            }
          } catch {
            // Fallback also failed; leave SVG empty
          }
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [chartCode, fallbackChartCode]);

  return (
    <div className="card" style={{ border: '1px solid var(--border-strong)' }}>
      <div className="card-header" style={{ padding: '0.85rem 1.15rem', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitBranch size={18} style={{ color: 'var(--accent-blue)' }} />
          <h4 style={{ fontSize: '1rem' }}>
            Procedure Decision &amp; Escalation Flowchart (Mermaid)
          </h4>
          {usedFallback && (
            <span className="badge badge-neutral">Auto-Sanitized Syntax</span>
          )}
        </div>

        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
            title="Zoom out diagram"
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', minWidth: '44px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            title="Zoom in diagram"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom(1)}
            title="Reset zoom"
          >
            <RotateCcw size={14} />
          </button>
          <button
            id="btn-toggle-mermaid-source"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowRawCode((s) => !s)}
          >
            <Code2 size={14} /> {showRawCode ? 'Hide Mermaid Code' : 'View Mermaid Code'}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ padding: '1.1rem', overflowX: 'auto' }}>
        {showRawCode && (
          <pre
            style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              overflowX: 'auto'
            }}
          >
            {usedFallback ? fallbackChartCode : chartCode}
          </pre>
        )}

        <div
          id="mermaid-flowchart-container"
          ref={containerRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
}
