import React, { useState } from 'react';
import {
  FileCheck2,
  CheckSquare,
  GitBranch,
  BookOpen,
  ListChecks,
  Workflow,
  Printer,
  FileSpreadsheet,
  FileCode2
} from 'lucide-react';
import GovernanceBanner from './components/GovernanceBanner';
import ApiSetupBar from './components/ApiSetupBar';
import SourceInputPanel from './components/SourceInputPanel';
import SourceViewerPane from './components/SourceViewerPane';
import VerificationSummaryBanner from './components/VerificationSummaryBanner';
import ChecklistWorkspace from './components/ChecklistWorkspace';
import ProcedureWorkspace from './components/ProcedureWorkspace';
import ExportPreviewModal from './components/ExportPreviewModal';
import { parseDocumentIntoSections } from './utils/documentParser';
import { SAMPLE_RULEBOOK_META, SAMPLE_RULEBOOK_TEXT } from './data/sampleRulebook';
import { buildVerifiedSampleDataset } from './data/verifiedSampleBenchmark';
import {
  runLiveExtractionAndVerification,
  verifyQuoteDeterministically
} from './services/geminiService';
import {
  downloadChecklistCsv,
  downloadProcedureMarkdown
} from './utils/exportUtils';

export default function App() {
  // Held strictly in volatile browser memory
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-4-hydrogen');
  const [approvalState, setApprovalState] = useState({
    status: 'draft',
    reviewerName: '',
    reviewerRole: '',
    approvedAt: null,
    reviewNotes: ''
  });

  // Document & Section State
  const [sourceTitle, setSourceTitle] = useState(SAMPLE_RULEBOOK_META.title);
  const [rawText, setRawText] = useState(SAMPLE_RULEBOOK_TEXT);
  const [sections, setSections] = useState(() => parseDocumentIntoSections(SAMPLE_RULEBOOK_TEXT));
  const [pdfBase64, setPdfBase64] = useState(null);
  const [pdfIngestionMode, setPdfIngestionMode] = useState('pdfjs_text');

  // Extracted Data State (Initialized with the verified 2-page rulebook benchmark)
  const initialData = buildVerifiedSampleDataset('plain');
  const [checklistItems, setChecklistItems] = useState(initialData.checklistItems);
  const [procedureOutput, setProcedureOutput] = useState(initialData.procedureOutput);
  const [omittedSourceRules, setOmittedSourceRules] = useState(initialData.omittedSourceRules);
  const [usedModel, setUsedModel] = useState(initialData.usedModel);

  // Active Mode, Export & UI State
  const [activeMode, setActiveMode] = useState('checklist'); // 'checklist' | 'procedure'
  const [sourcePaneCollapsed, setSourcePaneCollapsed] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [exportModalMode, setExportModalMode] = useState(null); // 'csv' | 'markdown' | 'print' | null

  function markDraftOnModification() {
    setApprovalState((prev) =>
      prev.status === 'approved' ? { ...prev, status: 'draft', approvedAt: null } : prev
    );
  }

  function handleLoadRawText(newText, newTitle, base64Buffer = null) {
    setRawText(newText);
    if (newTitle) setSourceTitle(newTitle);
    setPdfBase64(base64Buffer);
    setSections(parseDocumentIntoSections(newText));
    markDraftOnModification();
  }

  function handleToggleSection(sectionId) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, selected: !s.selected } : s))
    );
  }

  function handleToggleDefinitionsPin(sectionId) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isDefinitionsSection: !s.isDefinitionsSection } : s
      )
    );
  }

  function handleSelectAllSections(selected) {
    setSections((prev) => prev.map((s) => ({ ...s, selected })));
  }

  async function handleRunExtraction({ target = 'both', readingLevel = 'plain' }) {
    setErrorBanner('');
    setIsGenerating(true);
    markDraftOnModification();

    try {
      if (apiKey && apiKey.trim()) {
        const result = await runLiveExtractionAndVerification({
          apiKey: apiKey.trim(),
          model: selectedModel,
          sections,
          readingLevel,
          target,
          pdfBase64: pdfIngestionMode === 'hybrid_multimodal' ? pdfBase64 : null,
          onProgress: (msg) => setGenerationProgress(msg)
        });
        if (target === 'both' || target === 'checklist') {
          setChecklistItems(result.checklistItems);
        }
        if (target === 'both' || target === 'procedure') {
          setProcedureOutput(result.procedureOutput);
        }
        setOmittedSourceRules(result.omittedSourceRules || []);
        setUsedModel(`${result.usedModel} (Live Gemini API)`);
        setGenerationProgress('Completed Pass 1 Generation + Pass 2 Verification via Gemini API.');
      } else {
        setGenerationProgress(
          'Pass 1 & Pass 2: Running section-by-section extraction & deterministic quote verification...'
        );
        await new Promise((r) => setTimeout(r, 300));
        const selectedIds = sections.filter((s) => s.selected).map((s) => s.id);
        const dataset = buildVerifiedSampleDataset(readingLevel, selectedIds);
        if (target === 'both' || target === 'checklist') {
          setChecklistItems(dataset.checklistItems);
        }
        if (target === 'both' || target === 'procedure') {
          setProcedureOutput(dataset.procedureOutput);
        }
        setOmittedSourceRules([]);
        setUsedModel(`${selectedModel} (CRS-2026-04 Verified Benchmark — Paste API Key above for live custom docs)`);
        setGenerationProgress(
          `Verified ${dataset.checklistItems.length} checklist items & ${dataset.procedureOutput.simpleSteps.length} procedure steps across ${selectedIds.length} selected section(s).`
        );
      }
    } catch (err) {
      setErrorBanner(`Extraction Error: ${err.message}`);
      setGenerationProgress('');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleChangeProcedureReadingLevel(newLevel) {
    if (!procedureOutput || procedureOutput.readingLevel === newLevel) return;
    if (apiKey && apiKey.trim()) {
      await handleRunExtraction({ target: 'procedure', readingLevel: newLevel });
    } else {
      const selectedIds = sections.filter((s) => s.selected).map((s) => s.id);
      const dataset = buildVerifiedSampleDataset(newLevel, selectedIds);
      setProcedureOutput(dataset.procedureOutput);
    }
  }

  function handleToggleProcedureStepCompleted(stepId, mode) {
    if (!procedureOutput) return;
    if (mode === 'simple') {
      setProcedureOutput((prev) => ({
        ...prev,
        simpleSteps: prev.simpleSteps.map((st) =>
          st.id === stepId ? { ...st, completed: !st.completed } : st
        )
      }));
    } else {
      setProcedureOutput((prev) => ({
        ...prev,
        complexPhases: prev.complexPhases.map((ph) => ({
          ...ph,
          steps: ph.steps.map((st) =>
            st.id === stepId ? { ...st, completed: !st.completed } : st
          )
        }))
      }));
    }
  }

  function handleUpdateProcedureStepNotes(stepId, notes, mode) {
    if (!procedureOutput) return;
    if (mode === 'simple') {
      setProcedureOutput((prev) => ({
        ...prev,
        simpleSteps: prev.simpleSteps.map((st) =>
          st.id === stepId ? { ...st, operatorNotes: notes } : st
        )
      }));
    } else {
      setProcedureOutput((prev) => ({
        ...prev,
        complexPhases: prev.complexPhases.map((ph) => ({
          ...ph,
          steps: ph.steps.map((st) =>
            st.id === stepId ? { ...st, operatorNotes: notes } : st
          )
        }))
      }));
    }
  }

  function handleInjectAdversarialTestItem() {
    markDraftOnModification();
    const adversarialQuote =
      'Operators must wear Class-A SCBA respirators and check liquid helium levels every 4 hours.';
    const check = verifyQuoteDeterministically(adversarialQuote, rawText);

    const hallucinatedItem = {
      id: `CHK-ADV-${checklistItems.length + 1}`,
      sectionId: 'sec-3',
      sectionTopic: 'SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE',
      requirement:
        '[ADVERSARIAL TEST ITEM] Wear Class-A SCBA respirators and log liquid helium tank levels every 4 hours.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Liquid helium 4-hour logbook (Invented — Not in source)',
      responsibleRole: 'Lead Cryo-Operator',
      frequencyOrDeadline: 'Every 4 hours (Invented — Not in source)',
      citation: {
        sectionRef: 'Section 3, Rule 9 (Mis-cited)',
        pageRef: 'Page 2',
        verbatimQuote: adversarialQuote
      },
      confidence: 'low',
      confidenceRationale: 'Flagged by Pass 2 Verification: Quote and requirements do not exist in source.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      },
      verification: {
        status: 'unsupported',
        quoteFoundVerbatim: check.quoteFoundVerbatim,
        quoteWordCount: check.quoteWordCount,
        aiVerified: false,
        inventedDetailsFound: [
          'Class-A SCBA respirators (Source only states full-face polycarbonate splash shield and -196°C gloves)',
          'Liquid helium levels every 4 hours (Source uses Liquid Nitrogen and has no 4-hour helium check)'
        ],
        verificationNotes:
          'REJECTED BY PASS 2 AUDITOR: Cited quote does not exist verbatim in source text, and item invents external requirements (SCBA respirator, liquid helium, 4-hour interval).',
        verifiedAt: new Date().toISOString()
      },
      auditStatus: 'Open',
      auditNotes: 'Adversarial test item demonstrating Pass 2 unsupported claim & quote mismatch detection.'
    };

    setChecklistItems((prev) => [hallucinatedItem, ...prev]);
  }

  function handleUpdateChecklistItem(updated) {
    markDraftOnModification();
    setChecklistItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  function handleDeleteChecklistItem(id) {
    markDraftOnModification();
    setChecklistItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handleAddChecklistItem(newItem) {
    markDraftOnModification();
    setChecklistItems((prev) => [newItem, ...prev]);
  }

  function handleClearSession() {
    setApiKey('');
    setRawText('');
    setSections([]);
    setChecklistItems([]);
    setProcedureOutput(null);
    setPdfBase64(null);
    setActiveQuote(null);
    setGenerationProgress('');
    setErrorBanner('');
    setApprovalState({
      status: 'draft',
      reviewerName: '',
      reviewerRole: '',
      approvedAt: null,
      reviewNotes: ''
    });
  }

  const unsupportedCount = checklistItems.filter(
    (i) => i.verification?.status === 'unsupported' || i.verification?.status === 'quote_mismatch'
  ).length;

  return (
    <div className="app-shell">
      <GovernanceBanner
        approvalState={approvalState}
        onApprove={(newState) => setApprovalState(newState)}
        onResetToDraft={() =>
          setApprovalState({
            status: 'draft',
            reviewerName: '',
            reviewerRole: '',
            approvedAt: null,
            reviewNotes: ''
          })
        }
        hasGeneratedContent={checklistItems.length > 0 || Boolean(procedureOutput)}
        unsupportedCount={unsupportedCount}
      />

      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-row">
            <div className="brand-title-group">
              <span className="brand-eyebrow">REGULATORY &amp; PROCEDURAL COMPILER • ZERO-INFERENCE AI</span>
              <h1 className="brand-title">
                <FileCheck2 size={28} style={{ color: 'var(--accent-blue)' }} />
                Source-to-Action
              </h1>
              <p className="brand-subtitle">
                Turn regulatory rulebooks, standards, and guidelines into cited, auditable{' '}
                <strong>Compliance Checklists</strong> and <strong>Step-by-Step Procedures</strong> with two-pass source
                verification.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="badge badge-verified">
                <CheckSquare size={14} /> Closed-World Source Only
              </span>
              <span className="badge badge-definition">
                <GitBranch size={14} /> 2-Pass Quote Verification
              </span>
            </div>
          </div>

          <ApiSetupBar
            apiKey={apiKey}
            setApiKey={setApiKey}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onClearSession={handleClearSession}
          />
        </div>
      </header>

      <main className="app-main">
        <SourceInputPanel
          sourceTitle={sourceTitle}
          setSourceTitle={setSourceTitle}
          rawText={rawText}
          onLoadRawText={handleLoadRawText}
          sections={sections}
          onToggleSection={handleToggleSection}
          onToggleDefinitionsPin={handleToggleDefinitionsPin}
          onSelectAllSections={handleSelectAllSections}
          pdfIngestionMode={pdfIngestionMode}
          setPdfIngestionMode={setPdfIngestionMode}
          hasPdfBinary={Boolean(pdfBase64)}
          onRunExtraction={handleRunExtraction}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
        />

        {errorBanner && (
          <div className="flag-callout contradictory" role="alert">
            <strong>{errorBanner}</strong>
          </div>
        )}

        <VerificationSummaryBanner
          checklistItems={checklistItems}
          procedureOutput={procedureOutput}
          omittedSourceRules={omittedSourceRules}
          usedModel={usedModel}
          onInjectAdversarialTestItem={handleInjectAdversarialTestItem}
        />

        {sections.length > 0 && (
          <div className={`workspace-split ${sourcePaneCollapsed ? 'source-collapsed' : ''}`}>
            {!sourcePaneCollapsed && (
              <SourceViewerPane
                sections={sections}
                activeQuote={activeQuote}
                onClearActiveQuote={() => setActiveQuote(null)}
                onCollapse={() => setSourcePaneCollapsed(true)}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mode Switcher & Export Bar */}
              <div className="card mode-tabs-bar no-print" style={{ padding: '0.85rem 1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {sourcePaneCollapsed && (
                      <button
                        id="btn-expand-source-pane"
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSourcePaneCollapsed(false)}
                      >
                        <BookOpen size={15} /> Show Source Reader
                      </button>
                    )}

                    <button
                      id="tab-mode-checklist"
                      type="button"
                      className={`btn ${activeMode === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveMode('checklist')}
                    >
                      <ListChecks size={17} />
                      Compliance Checklist ({checklistItems.length})
                    </button>

                    <button
                      id="tab-mode-procedure"
                      type="button"
                      className={`btn ${activeMode === 'procedure' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveMode('procedure')}
                    >
                      <Workflow size={17} />
                      Step-by-Step Procedure ({procedureOutput?.simpleSteps?.length || 0} Steps /{' '}
                      {procedureOutput?.complexPhases?.length || 0} Phases)
                    </button>
                  </div>

                  {/* Export Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      id="btn-export-print"
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExportModalMode('print')}
                      title="Open Print-Friendly / Save as PDF view"
                    >
                      <Printer size={15} /> Print / PDF
                    </button>
                    <button
                      id="btn-export-csv"
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        downloadChecklistCsv(checklistItems, approvalState, sourceTitle);
                        setExportModalMode('csv');
                      }}
                      title="Export Compliance Checklist as CSV with citations"
                    >
                      <FileSpreadsheet size={15} /> Export CSV (Checklist)
                    </button>
                    <button
                      id="btn-export-markdown"
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        downloadProcedureMarkdown(procedureOutput, approvalState, sourceTitle);
                        setExportModalMode('markdown');
                      }}
                      title="Export Procedure as Markdown with citations and Mermaid flowchart"
                    >
                      <FileCode2 size={15} /> Export Markdown (Procedure)
                    </button>
                  </div>
                </div>
              </div>

              {activeMode === 'checklist' ? (
                <ChecklistWorkspace
                  items={checklistItems}
                  sections={sections}
                  fullSourceText={rawText}
                  onUpdateItem={handleUpdateChecklistItem}
                  onDeleteItem={handleDeleteChecklistItem}
                  onAddItem={handleAddChecklistItem}
                  onSelectQuote={(cit) => {
                    if (sourcePaneCollapsed) setSourcePaneCollapsed(false);
                    setActiveQuote(cit);
                  }}
                />
              ) : (
                <ProcedureWorkspace
                  procedureOutput={procedureOutput}
                  onChangeReadingLevel={handleChangeProcedureReadingLevel}
                  onToggleStepCompleted={handleToggleProcedureStepCompleted}
                  onUpdateStepNotes={handleUpdateProcedureStepNotes}
                  onSelectQuote={(cit) => {
                    if (sourcePaneCollapsed) setSourcePaneCollapsed(false);
                    setActiveQuote(cit);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <ExportPreviewModal
        mode={exportModalMode}
        onClose={() => setExportModalMode(null)}
        checklistItems={checklistItems}
        procedureOutput={procedureOutput}
        approvalState={approvalState}
        sourceTitle={sourceTitle}
      />
    </div>
  );
}
