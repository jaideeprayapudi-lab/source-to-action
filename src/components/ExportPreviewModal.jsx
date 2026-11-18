import React from 'react';
import { Printer, Download, X, FileSpreadsheet, FileCode2 } from 'lucide-react';
import {
  buildChecklistCsvString,
  buildProcedureMarkdownString,
  downloadChecklistCsv,
  downloadProcedureMarkdown
} from '../utils/exportUtils';

export default function ExportPreviewModal({
  mode, // 'csv' | 'markdown' | 'print' | null
  onClose,
  checklistItems,
  procedureOutput,
  approvalState,
  sourceTitle
}) {
  if (!mode) return null;

  const csvPreview = mode === 'csv' ? buildChecklistCsvString(checklistItems, approvalState, sourceTitle) : '';
  const mdPreview = mode === 'markdown' ? buildProcedureMarkdownString(procedureOutput, approvalState, sourceTitle) : '';

  return (
    <div className="modal-backdrop no-print" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="modal-card" style={{ maxWidth: '820px' }}>
        <div className="modal-header">
          <h2 id="export-modal-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {mode === 'csv' && (
              <>
                <FileSpreadsheet size={19} /> Compliance Checklist CSV Export (With Citations &amp; Flags)
              </>
            )}
            {mode === 'markdown' && (
              <>
                <FileCode2 size={19} /> Step-by-Step Procedure Markdown Export (With Citations &amp; Mermaid)
              </>
            )}
            {mode === 'print' && (
              <>
                <Printer size={19} /> Print-Friendly / Save as PDF View
              </>
            )}
          </h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close export modal">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {mode === 'csv' && (
            <>
              <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)' }}>
                Includes all {checklistItems.length} checklist items, section topics, plain-language requirements,
                mandatory/recommended types, roles, deadlines, verbatim quotes (&le;25 words), confidence, Pass 2
                verification statuses, flags, audit statuses, and governance status.
              </p>
              <pre
                id="export-csv-preview"
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  maxHeight: '380px',
                  overflow: 'auto',
                  whiteSpace: 'pre'
                }}
              >
                {csvPreview}
              </pre>
            </>
          )}

          {mode === 'markdown' && (
            <>
              <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)' }}>
                Includes Governance status banner, Prerequisites, Materials, Mermaid flowchart code block, Simple Mode
                steps, and Complex Mode phases/decision gates with full citations.
              </p>
              <pre
                id="export-md-preview"
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  maxHeight: '380px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {mdPreview}
              </pre>
            </>
          )}

          {mode === 'print' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--ink-secondary)' }}>
                The page includes a dedicated <code>@media print</code> stylesheet that strips navigation chrome,
                preserves the <strong>Draft / Approved Governance Banner</strong>, and formats all citations, flags, and
                diagrams cleanly for paper or browser <strong>Save as PDF</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>

          {mode === 'csv' && (
            <button
              id="btn-confirm-csv-download"
              type="button"
              className="btn btn-primary"
              onClick={() => downloadChecklistCsv(checklistItems, approvalState, sourceTitle)}
            >
              <Download size={16} /> Download .CSV File
            </button>
          )}

          {mode === 'markdown' && (
            <button
              id="btn-confirm-md-download"
              type="button"
              className="btn btn-primary"
              onClick={() => downloadProcedureMarkdown(procedureOutput, approvalState, sourceTitle)}
            >
              <Download size={16} /> Download .MD File
            </button>
          )}

          {mode === 'print' && (
            <button
              id="btn-trigger-window-print"
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                setTimeout(() => window.print(), 100);
              }}
            >
              <Printer size={16} /> Print / Save as PDF Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
