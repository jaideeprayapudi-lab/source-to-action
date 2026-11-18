import React, { useState, useEffect } from 'react';
import {
  Layers,
  ListOrdered,
  PlayCircle,
  CheckCircle2,
  Circle,
  AlertTriangle,
  OctagonAlert,
  GitFork,
  User,
  Wrench,
  ClipboardCheck,
  Quote,
  ShieldCheck,
  ShieldAlert,
  BookMarked,
  GitCompareArrows,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck
} from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';

export default function ProcedureWorkspace({
  procedureOutput,
  onChangeReadingLevel,
  onToggleStepCompleted,
  onUpdateStepNotes,
  onSelectQuote
}) {
  const [complexityMode, setComplexityMode] = useState('simple'); // 'simple' | 'complex'
  const [viewLayout, setViewLayout] = useState('list'); // 'list' | 'step-through'
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!procedureOutput) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
        No procedure generated yet. Click <strong>Extract &amp; Verify</strong> above to build a Step-by-Step Procedure.
      </div>
    );
  }

  const simpleSteps = procedureOutput.simpleSteps || [];
  const complexPhases = procedureOutput.complexPhases || [];
  const flatComplexSteps = complexPhases.flatMap((ph) =>
    (ph.steps || []).map((st) => ({
      ...st,
      phaseTitle: ph.phaseTitle,
      phaseNumber: ph.phaseNumber
    }))
  );

  const stepThroughItems = complexityMode === 'simple' ? simpleSteps : flatComplexSteps;
  const safeIndex = Math.min(activeStepIndex, Math.max(0, stepThroughItems.length - 1));
  const currentStepItem = stepThroughItems[safeIndex] || null;

  const completedCount = stepThroughItems.filter((s) => s.completed).length;
  const progressPct =
    stepThroughItems.length > 0 ? Math.round((completedCount / stepThroughItems.length) * 100) : 0;

  // Keyboard navigation in Step-Through view
  useEffect(() => {
    if (viewLayout !== 'step-through') return;
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') {
        setActiveStepIndex((i) => Math.min(stepThroughItems.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveStepIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewLayout, stepThroughItems.length]);

  function renderVerificationAndFlagBadges(step) {
    const isUnsupported =
      step.verification?.status === 'unsupported' || step.verification?.status === 'quote_mismatch';
    return (
      <>
        <span className={`badge badge-conf-${step.confidence || 'high'}`}>
          Confidence: {(step.confidence || 'high').toUpperCase()}
        </span>
        {isUnsupported ? (
          <span className="badge badge-flagged">
            <ShieldAlert size={13} /> Pass 2 Flagged
          </span>
        ) : (
          <span className="badge badge-verified">
            <ShieldCheck size={13} /> Pass 2 Verified ({step.verification?.quoteWordCount || 0}/25w)
          </span>
        )}
        {step.flags?.isAmbiguous && (
          <span className="badge badge-conf-medium">
            <AlertTriangle size={12} /> Ambiguous
          </span>
        )}
        {step.flags?.isContradictory && (
          <span className="badge badge-flagged">
            <GitCompareArrows size={12} /> Contradictory
          </span>
        )}
        {step.flags?.dependsOnDefinition && (
          <span className="badge badge-definition">
            <BookMarked size={12} /> Depends on Definition
          </span>
        )}
      </>
    );
  }

  function renderFlagsCallouts(step) {
    if (!step.flags?.isAmbiguous && !step.flags?.isContradictory && !step.flags?.dependsOnDefinition) {
      return null;
    }
    return (
      <div className="flag-alerts">
        {step.flags?.isContradictory && (
          <div className="flag-callout contradictory">
            <GitCompareArrows size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Contradiction Flagged:</strong> {step.flags.contradictionNote}
            </div>
          </div>
        )}
        {step.flags?.isAmbiguous && (
          <div className="flag-callout ambiguous">
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Ambiguity Flagged:</strong> {step.flags.ambiguityNote}
            </div>
          </div>
        )}
        {step.flags?.dependsOnDefinition && (
          <div className="flag-callout definition">
            <BookMarked size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Depends on Definition ({step.flags.definitionTerm}):</strong> {step.flags.definitionNote}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Procedure Controls Bar */}
      <div className="card no-print" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Simple vs Complex Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="field-label" style={{ marginRight: '0.25rem' }}>
              Complexity Mode:
            </span>
            <button
              id="btn-proc-mode-simple"
              type="button"
              className={`btn btn-sm ${complexityMode === 'simple' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setComplexityMode('simple');
                setActiveStepIndex(0);
              }}
            >
              <ListOrdered size={15} /> Simple Mode ({simpleSteps.length} Steps)
            </button>
            <button
              id="btn-proc-mode-complex"
              type="button"
              className={`btn btn-sm ${complexityMode === 'complex' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setComplexityMode('complex');
                setActiveStepIndex(0);
              }}
            >
              <Layers size={15} /> Complex Mode ({complexPhases.length} Phases + Flowchart)
            </button>
          </div>

          {/* Reading Level Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="field-label">
              <BookOpenCheck size={15} /> Reading Level:
            </span>
            <button
              id="btn-reading-plain"
              type="button"
              className={`btn btn-sm ${procedureOutput.readingLevel === 'plain' ? 'btn-blue' : 'btn-secondary'}`}
              onClick={() => onChangeReadingLevel('plain')}
            >
              Plain Language
            </button>
            <button
              id="btn-reading-professional"
              type="button"
              className={`btn btn-sm ${procedureOutput.readingLevel === 'professional' ? 'btn-blue' : 'btn-secondary'}`}
              onClick={() => onChangeReadingLevel('professional')}
            >
              Professional / Technical
            </button>
          </div>

          {/* Full View vs Step-Through View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="btn-view-list"
              type="button"
              className={`btn btn-sm ${viewLayout === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewLayout('list')}
            >
              Full Procedure View
            </button>
            <button
              id="btn-view-step-through"
              type="button"
              className={`btn btn-sm ${viewLayout === 'step-through' ? 'btn-emerald' : 'btn-secondary'}`}
              onClick={() => setViewLayout('step-through')}
            >
              <PlayCircle size={15} /> Step-Through View ({completedCount}/{stepThroughItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* ==================== STEP-THROUGH EXECUTION VIEW ==================== */}
      {viewLayout === 'step-through' && currentStepItem && (
        <div id="step-through-container" className="step-through-stage">
          {/* Top Progress & Step Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="brand-eyebrow">
                  STEP-THROUGH OPERATOR EXECUTION MODE • {complexityMode.toUpperCase()} •{' '}
                  {procedureOutput.readingLevel.toUpperCase()} READING LEVEL
                </span>
                <h3 style={{ fontSize: '1.35rem', marginTop: '0.2rem' }}>
                  {complexityMode === 'simple'
                    ? `Step ${currentStepItem.stepNumber} of ${stepThroughItems.length}`
                    : `Phase ${currentStepItem.phaseNumber} — Step ${currentStepItem.stepCode} (${safeIndex + 1} of ${stepThroughItems.length})`}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge badge-verified" style={{ fontSize: '0.88rem', padding: '0.35rem 0.8rem' }}>
                  Progress: {completedCount} / {stepThroughItems.length} Completed ({progressPct}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'var(--bg-subtle)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: '#059669',
                  transition: 'width 0.25s ease'
                }}
              />
            </div>

            {/* Step Jump Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {stepThroughItems.map((st, idx) => (
                <button
                  key={st.id}
                  id={`btn-jump-step-${idx + 1}`}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`btn btn-sm ${
                    idx === safeIndex ? 'btn-primary' : st.completed ? 'btn-emerald' : 'btn-secondary'
                  }`}
                  style={{ minWidth: '42px', padding: '0.3rem 0.6rem' }}
                >
                  {st.completed ? '✓ ' : ''}
                  {complexityMode === 'simple' ? st.stepNumber : st.stepCode}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata & Verification Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-neutral">
              <User size={13} /> Role: {currentStepItem.responsibleRole}
            </span>
            {renderVerificationAndFlagBadges(currentStepItem)}
          </div>

          {/* Large Readable Action Text */}
          <div
            id="step-through-action-display"
            className="step-through-action-text"
            style={{
              padding: '1.35rem 1.5rem',
              background: currentStepItem.completed ? 'var(--emerald-surface)' : 'var(--bg-elevated)',
              borderLeft: currentStepItem.completed
                ? '5px solid var(--emerald-border)'
                : '5px solid var(--accent-blue)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            {currentStepItem.action}
          </div>

          {/* Stop-and-Escalate Crimson Alert (Complex Mode) */}
          {currentStepItem.stopAndEscalateConditions?.length > 0 && (
            <div
              style={{
                padding: '1rem 1.2rem',
                background: 'var(--crimson-surface)',
                border: '2px solid var(--crimson-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--crimson-ink)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
                <OctagonAlert size={20} /> STOP AND ESCALATE CONDITION
              </div>
              <ul style={{ margin: '0.4rem 0 0 1.3rem', padding: 0, fontSize: '1.05rem' }}>
                {currentStepItem.stopAndEscalateConditions.map((cond, i) => (
                  <li key={i}>{cond}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision Points IF/THEN/ELSE (Complex Mode) */}
          {currentStepItem.decisionPoints?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {currentStepItem.decisionPoints.map((dp, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.9rem 1.15rem',
                    background: 'var(--indigo-surface)',
                    border: '1px solid var(--indigo-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--indigo-ink)', marginBottom: '0.3rem' }}>
                    <GitFork size={16} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                    DECISION POINT — IF: {dp.condition}
                  </div>
                  <div>
                    <strong>THEN:</strong> {dp.ifTrueAction}
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <strong>ELSE:</strong> {dp.ifFalseAction}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline Warnings */}
          {currentStepItem.inlineWarnings?.length > 0 && (
            <div className="flag-callout ambiguous" style={{ fontSize: '1.02rem' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Inline Operational Warning(s):</strong>
                <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                  {currentStepItem.inlineWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {renderFlagsCallouts(currentStepItem)}

          {/* Citation Block */}
          <div className="citation-box">
            <div className="citation-meta">
              <span>
                <Quote size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                <strong>Source Citation:</strong> {currentStepItem.citation?.sectionRef} •{' '}
                <strong>{currentStepItem.citation?.pageRef}</strong>
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onSelectQuote(currentStepItem.citation)}
              >
                Highlight in Source
              </button>
            </div>
            <div className="citation-quote" style={{ fontSize: '1.12rem' }}>
              &ldquo;{currentStepItem.citation?.verbatimQuote}&rdquo;
            </div>
          </div>

          {/* Tick-Off Step Completion & Operator Notes */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <button
              id="btn-tick-off-current-step"
              type="button"
              className={`btn btn-lg ${currentStepItem.completed ? 'btn-emerald' : 'btn-primary'}`}
              onClick={() => onToggleStepCompleted(currentStepItem.id, complexityMode)}
            >
              {currentStepItem.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              {currentStepItem.completed ? 'Step Completed (Click to Undo)' : 'Tick Off Step as Completed'}
            </button>

            <input
              id="step-through-operator-notes"
              type="text"
              className="text-input"
              style={{ flex: 1, minWidth: '240px' }}
              placeholder="Record operator sign-off note, reading value, or timestamp for this step..."
              value={currentStepItem.operatorNotes || ''}
              onChange={(e) => onUpdateStepNotes(currentStepItem.id, e.target.value, complexityMode)}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                id="btn-prev-step"
                type="button"
                className="btn btn-secondary btn-lg"
                disabled={safeIndex === 0}
                onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft size={19} /> Previous
              </button>
              <button
                id="btn-next-step"
                type="button"
                className="btn btn-blue btn-lg"
                disabled={safeIndex >= stepThroughItems.length - 1}
                onClick={() => setActiveStepIndex((i) => Math.min(stepThroughItems.length - 1, i + 1))}
              >
                Next Step <ChevronRight size={19} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FULL PROCEDURE VIEW: SIMPLE MODE ==================== */}
      {viewLayout === 'list' && complexityMode === 'simple' && (
        <div id="simple-procedure-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--bg-elevated)' }}>
            <h3 style={{ fontSize: '1.15rem' }}>{procedureOutput.procedureTitle}</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
              <strong>Simple Mode</strong> — Numbered sequential steps, one atomic action per step, inline warnings, and
              verbatim source citations ({procedureOutput.readingLevel} reading level).
            </p>
          </div>

          {simpleSteps.map((step) => (
            <article
              key={step.id}
              id={`simple-step-${step.id}`}
              className="card"
              style={{
                borderLeft: step.completed ? '4px solid var(--emerald-border)' : '4px solid var(--accent-blue)'
              }}
            >
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${step.completed ? 'btn-emerald' : 'btn-secondary'}`}
                      onClick={() => onToggleStepCompleted(step.id, 'simple')}
                    >
                      {step.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      Step {step.stepNumber}
                    </button>
                    <span className="badge badge-neutral">
                      <User size={12} /> Role: {step.responsibleRole}
                    </span>
                    {renderVerificationAndFlagBadges(step)}
                  </div>
                </div>

                <p style={{ fontSize: '1.14rem', fontWeight: 600, lineHeight: 1.55 }}>{step.action}</p>

                {step.inlineWarnings?.length > 0 && (
                  <div className="flag-callout ambiguous">
                    <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Inline Warning:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0 }}>
                        {step.inlineWarnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {renderFlagsCallouts(step)}

                <div className="citation-box">
                  <div className="citation-meta">
                    <span>
                      <Quote size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                      <strong>Citation:</strong> {step.citation?.sectionRef} • <strong>{step.citation?.pageRef}</strong>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{step.verification?.quoteWordCount || 0} / 25 words max</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm no-print"
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => onSelectQuote(step.citation)}
                      >
                        Highlight in Source
                      </button>
                    </div>
                  </div>
                  <div className="citation-quote">&ldquo;{step.citation?.verbatimQuote}&rdquo;</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ==================== FULL PROCEDURE VIEW: COMPLEX MODE ==================== */}
      {viewLayout === 'list' && complexityMode === 'complex' && (
        <div id="complex-procedure-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Prerequisites & Materials Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div className="card-header" style={{ padding: '0.85rem 1.15rem', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardCheck size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h4 style={{ fontSize: '0.98rem' }}>Prerequisites &amp; Authorizations</h4>
                </div>
              </div>
              <div className="card-body" style={{ padding: '1rem 1.2rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.95rem' }}>
                  {(procedureOutput.prerequisites || ['Not specified in source']).map((pr, idx) => (
                    <li key={idx}>{pr}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ padding: '0.85rem 1.15rem', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h4 style={{ fontSize: '0.98rem' }}>Materials, PPE &amp; Instruments</h4>
                </div>
              </div>
              <div className="card-body" style={{ padding: '1rem 1.2rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.95rem' }}>
                  {(procedureOutput.materialsAndEquipment || ['Not specified in source']).map((mat, idx) => (
                    <li key={idx}>{mat}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Mermaid Flowchart */}
          <MermaidDiagram
            chartCode={procedureOutput.mermaidFlowchart}
            fallbackChartCode={procedureOutput.fallbackMermaidFlowchart}
          />

          {/* Complex Phases & Steps */}
          {complexPhases.map((phase) => (
            <div key={phase.phaseId} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  padding: '0.75rem 1.1rem',
                  background: 'var(--ink-primary)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
                }}
              >
                <h3 style={{ color: '#ffffff', fontSize: '1.08rem' }}>{phase.phaseTitle}</h3>
                <p style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>{phase.phaseObjective}</p>
              </div>

              {(phase.steps || []).map((step) => (
                <article
                  key={step.id}
                  id={`complex-step-${step.id}`}
                  className="card"
                  style={{
                    borderLeft:
                      step.stopAndEscalateConditions?.length > 0
                        ? '4px solid var(--crimson-border)'
                        : step.decisionPoints?.length > 0
                          ? '4px solid var(--indigo-border)'
                          : '4px solid var(--emerald-border)'
                  }}
                >
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${step.completed ? 'btn-emerald' : 'btn-secondary'}`}
                          onClick={() => onToggleStepCompleted(step.id, 'complex')}
                        >
                          {step.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                          Step {step.stepCode}
                        </button>
                        <span className="badge badge-neutral">
                          <User size={12} /> Role: {step.responsibleRole}
                        </span>
                        <span className="badge badge-neutral">
                          Prerequisite: {step.stepPrerequisites}
                        </span>
                        {renderVerificationAndFlagBadges(step)}
                      </div>
                    </div>

                    <p style={{ fontSize: '1.12rem', fontWeight: 600, lineHeight: 1.5 }}>{step.action}</p>

                    {/* Decision Points (IF / THEN / ELSE) */}
                    {step.decisionPoints?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {step.decisionPoints.map((dp, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '0.8rem 1rem',
                              background: 'var(--indigo-surface)',
                              border: '1px solid var(--indigo-border)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.94rem'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--indigo-ink)', marginBottom: '0.25rem' }}>
                              <GitFork size={15} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                              DECISION BRANCH — IF: {dp.condition}
                            </div>
                            <div>
                              <strong>THEN:</strong> {dp.ifTrueAction}
                            </div>
                            <div style={{ marginTop: '0.15rem' }}>
                              <strong>ELSE:</strong> {dp.ifFalseAction}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stop-and-Escalate Conditions */}
                    {step.stopAndEscalateConditions?.length > 0 && (
                      <div
                        style={{
                          padding: '0.85rem 1.05rem',
                          background: 'var(--crimson-surface)',
                          border: '2px solid var(--crimson-border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--crimson-ink)',
                          fontSize: '0.95rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}>
                          <OctagonAlert size={17} /> STOP AND ESCALATE CONDITION
                        </div>
                        <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                          {step.stopAndEscalateConditions.map((sc, idx) => (
                            <li key={idx}>{sc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Inline Warnings */}
                    {step.inlineWarnings?.length > 0 && (
                      <div className="flag-callout ambiguous">
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Warning:</strong> {step.inlineWarnings.join(' ')}
                        </div>
                      </div>
                    )}

                    {renderFlagsCallouts(step)}

                    {/* Citation */}
                    <div className="citation-box">
                      <div className="citation-meta">
                        <span>
                          <Quote size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                          <strong>Citation:</strong> {step.citation?.sectionRef} • <strong>{step.citation?.pageRef}</strong>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{step.verification?.quoteWordCount || 0} / 25 words max</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm no-print"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => onSelectQuote(step.citation)}
                          >
                            Highlight in Source
                          </button>
                        </div>
                      </div>
                      <div className="citation-quote">&ldquo;{step.citation?.verbatimQuote}&rdquo;</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
