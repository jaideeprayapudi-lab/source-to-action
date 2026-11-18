import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckSquare,
  Square,
  BookOpen,
  BookmarkCheck,
  Layers,
  Play,
  FileUp,
  Info
} from 'lucide-react';
import { extractTextFromPdfBuffer } from '../utils/documentParser';
import { SAMPLE_RULEBOOK_META, SAMPLE_RULEBOOK_TEXT } from '../data/sampleRulebook';

export default function SourceInputPanel({
  sourceTitle,
  setSourceTitle,
  rawText,
  onLoadRawText,
  sections,
  onToggleSection,
  onToggleDefinitionsPin,
  onSelectAllSections,
  pdfIngestionMode,
  setPdfIngestionMode,
  hasPdfBinary,
  onRunExtraction,
  isGenerating,
  generationProgress
}) {
  const [inputTab, setInputTab] = useState('sample'); // 'sample' | 'paste' | 'upload'
  const [uploadStatus, setUploadStatus] = useState('');
  const [readingLevel, setReadingLevel] = useState('plain');
  const [generationTarget, setGenerationTarget] = useState('both'); // 'both' | 'checklist' | 'procedure'
  const fileInputRef = useRef(null);

  const selectedCount = sections.filter((s) => s.selected).length;
  const totalSelectedWords = sections
    .filter((s) => s.selected)
    .reduce((acc, s) => acc + s.wordCount, 0);

  async function handleLoadSamplePdf() {
    setUploadStatus('Loading 2-page sample PDF via PDF.js...');
    try {
      const res = await fetch(SAMPLE_RULEBOOK_META.pdfUrl);
      const buffer = await res.arrayBuffer();
      const extracted = await extractTextFromPdfBuffer(buffer);
      onLoadRawText(extracted.fullText, SAMPLE_RULEBOOK_META.title, extracted.base64Pdf);
      setUploadStatus(
        `Extracted ${extracted.numPages} pages from ${SAMPLE_RULEBOOK_META.shortTitle} via PDF.js (${extracted.base64Pdf ? 'PDF binary also retained for multimodal comparison' : ''}).`
      );
    } catch (err) {
      setUploadStatus(`Error loading sample PDF: ${err.message}`);
    }
  }

  function handleLoadSampleText() {
    onLoadRawText(SAMPLE_RULEBOOK_TEXT, SAMPLE_RULEBOOK_META.title, null);
    setUploadStatus(`Loaded ${SAMPLE_RULEBOOK_META.shortTitle} (verbatim text with [Page 1] & [Page 2] markers).`);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Reading ${file.name}...`);
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const extracted = await extractTextFromPdfBuffer(arrayBuffer);
        onLoadRawText(extracted.fullText, file.name, extracted.base64Pdf);
        setUploadStatus(
          `Parsed PDF "${file.name}" (${extracted.numPages} page${extracted.numPages > 1 ? 's' : ''}) into sections.`
        );
      } else {
        const text = await file.text();
        onLoadRawText(text, file.name, null);
        setUploadStatus(`Loaded text file "${file.name}" (${text.length.toLocaleString()} chars).`);
      }
    } catch (err) {
      setUploadStatus(`Failed to read file: ${err.message}`);
    }
  }

  return (
    <section className="card no-print" aria-labelledby="source-ingestion-heading">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
          <div>
            <h2 id="source-ingestion-heading" style={{ fontSize: '1.18rem' }}>
              1. Source Document & Section-by-Section Selector
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
              Paste text, upload a PDF/TXT file, or load the built-in 2-page test rulebook. Choose which sections to
              process so citations remain section- and page-accurate.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }} role="tablist" aria-label="Source input method">
          <button
            id="tab-input-sample"
            type="button"
            role="tab"
            aria-selected={inputTab === 'sample'}
            className={`btn btn-sm ${inputTab === 'sample' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInputTab('sample')}
          >
            <BookOpen size={15} /> Built-In 2-Page Test Rulebook
          </button>
          <button
            id="tab-input-paste"
            type="button"
            role="tab"
            aria-selected={inputTab === 'paste'}
            className={`btn btn-sm ${inputTab === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInputTab('paste')}
          >
            <FileText size={15} /> Paste / Edit Source Text
          </button>
          <button
            id="tab-input-upload"
            type="button"
            role="tab"
            aria-selected={inputTab === 'upload'}
            className={`btn btn-sm ${inputTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInputTab('upload')}
          >
            <Upload size={15} /> Upload PDF / TXT
          </button>
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Tab 1: Built-in Sample Rulebook */}
        {inputTab === 'sample' && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ maxWidth: '72ch' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-definition">2 Pages • 4 Sections • 15 Rules</span>
                <strong style={{ fontSize: '1rem' }}>{SAMPLE_RULEBOOK_META.title}</strong>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
                Includes Section 1 Definitions (Rules 1–3), Mandatory & Optional rules, a deliberate ambiguity (Rule 8),
                a deliberate cross-page contradiction (Rule 5 vs. Rule 14), IF/THEN decision branches (Rule 11), and an
                O2 depletion Stop-and-Escalate trigger (Rule 12).
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                id="btn-load-sample-pdf"
                type="button"
                className="btn btn-blue btn-sm"
                onClick={handleLoadSamplePdf}
              >
                <FileUp size={15} /> Load 2-Page PDF via PDF.js
              </button>
              <button
                id="btn-load-sample-txt"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLoadSampleText}
              >
                <FileText size={15} /> Load Verbatim Text
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Paste / Edit Text */}
        {inputTab === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <label htmlFor="source-title-input" className="field-label">
                Document Title / Identifier
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                Tip: Include &quot;SECTION X:&quot; headings and &quot;[Page N]&quot; markers for finest granularity.
              </span>
            </div>
            <input
              id="source-title-input"
              type="text"
              className="text-input"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="Enter rulebook or standard title..."
            />
            <textarea
              id="source-raw-textarea"
              className="textarea-input"
              rows={8}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
              value={rawText}
              onChange={(e) => onLoadRawText(e.target.value, sourceTitle, null)}
              placeholder="Paste regulatory rulebook, standard, guideline, or textbook chapter here..."
            />
          </div>
        )}

        {/* Tab 3: Upload PDF or TXT */}
        {inputTab === 'upload' && (
          <div
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              background: 'var(--bg-elevated)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.65rem'
            }}
          >
            <Upload size={28} style={{ color: 'var(--accent-blue)' }} />
            <div>
              <strong>Upload a PDF (.pdf) or Text (.txt, .md) Source Document</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                PDF files are parsed client-side using PDF.js with page-boundary preservation and optional native PDF
                multimodal attachment.
              </p>
            </div>
            <input
              ref={fileInputRef}
              id="file-upload-input"
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              id="btn-trigger-file-upload"
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose PDF or TXT File…
            </button>
          </div>
        )}

        {uploadStatus && (
          <div
            id="upload-status-banner"
            style={{
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-secondary)',
              background: 'var(--bg-subtle)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {uploadStatus}
          </div>
        )}

        {/* Section-by-Section Selector */}
        {sections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1rem' }}>
                  Detected Sections ({selectedCount} of {sections.length} selected • {totalSelectedWords.toLocaleString()}{' '}
                  words)
                </h3>
                <span className="badge badge-neutral">Section-by-Section Processing</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  id="btn-select-all-sections"
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectAllSections(true)}
                >
                  Select All
                </button>
                <button
                  id="btn-deselect-all-sections"
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectAllSections(false)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  id={`section-card-${sec.id}`}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: sec.selected ? '2px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                    background: sec.selected ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <label
                      htmlFor={`chk-sec-${sec.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.55rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      <input
                        id={`chk-sec-${sec.id}`}
                        type="checkbox"
                        checked={sec.selected}
                        onChange={() => onToggleSection(sec.id)}
                        style={{ marginTop: '0.22rem', width: '17px', height: '17px' }}
                      />
                      <span>{sec.title}</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '1.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-neutral">
                        Page {sec.pageStart === sec.pageEnd ? sec.pageStart : `${sec.pageStart}–${sec.pageEnd}`}
                      </span>
                      <span className="badge badge-neutral">{sec.wordCount} words</span>
                      {sec.detectedRuleCount > 0 && (
                        <span className="badge badge-neutral">{sec.detectedRuleCount} rules</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleDefinitionsPin(sec.id)}
                      className={`badge ${sec.isDefinitionsSection ? 'badge-definition' : 'badge-neutral'}`}
                      style={{ cursor: 'pointer' }}
                      title="Pin this section as Global Definitions Context so other sections can resolve defined terms"
                    >
                      <BookmarkCheck size={12} />
                      {sec.isDefinitionsSection ? 'Pinned Definitions Context' : 'Pin as Definitions'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation Controls Bar */}
        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <label htmlFor="select-generation-target" className="field-label" style={{ margin: 0 }}>
                Generate:
              </label>
              <select
                id="select-generation-target"
                className="select-input"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                value={generationTarget}
                onChange={(e) => setGenerationTarget(e.target.value)}
              >
                <option value="both">Both Checklist & Step-by-Step Procedure</option>
                <option value="checklist">Compliance Checklist Only</option>
                <option value="procedure">Step-by-Step Procedure Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <label htmlFor="select-reading-level" className="field-label" style={{ margin: 0 }}>
                Procedure Reading Level:
              </label>
              <select
                id="select-reading-level"
                className="select-input"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                value={readingLevel}
                onChange={(e) => setReadingLevel(e.target.value)}
              >
                <option value="plain">Plain Language (Clear, Direct Action Sentences)</option>
                <option value="professional">Professional / Technical (Formal Regulatory Register)</option>
              </select>
            </div>

            {hasPdfBinary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <label htmlFor="select-pdf-mode" className="field-label" style={{ margin: 0 }}>
                  PDF Engine:
                </label>
                <select
                  id="select-pdf-mode"
                  className="select-input"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                  value={pdfIngestionMode}
                  onChange={(e) => setPdfIngestionMode(e.target.value)}
                >
                  <option value="pdfjs_text">PDF.js Section Text (Exact Substring Verification)</option>
                  <option value="hybrid_multimodal">PDF.js Sections + Native PDF Multimodal Attachment</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {generationProgress && (
              <span
                id="generation-progress-status"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.84rem',
                  color: 'var(--accent-blue)',
                  fontWeight: 600
                }}
                aria-live="polite"
              >
                {generationProgress}
              </span>
            )}

            <button
              id="btn-run-extraction"
              type="button"
              className="btn btn-blue btn-lg"
              disabled={isGenerating || selectedCount === 0}
              onClick={() => onRunExtraction({ target: generationTarget, readingLevel })}
            >
              <Play size={17} />
              {isGenerating
                ? 'Running Extraction & Pass 2 Verification…'
                : `Extract & Verify (${selectedCount} Section${selectedCount === 1 ? '' : 's'})`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
