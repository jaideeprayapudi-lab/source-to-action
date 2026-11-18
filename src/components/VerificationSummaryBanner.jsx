import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  GitCompareArrows,
  BookMarked,
  CheckCircle2,
  FlaskConical
} from 'lucide-react';

export default function VerificationSummaryBanner({
  checklistItems = [],
  procedureOutput = null,
  omittedSourceRules = [],
  usedModel = '',
  onInjectAdversarialTestItem
}) {
  const allSteps = [
    ...(procedureOutput?.simpleSteps || []),
    ...(procedureOutput?.complexPhases || []).flatMap((ph) => ph.steps || [])
  ];
  const allItems = [...checklistItems, ...allSteps];

  if (allItems.length === 0) return null;

  const supportedCount = allItems.filter((i) => i.verification?.status === 'supported').length;
  const unsupportedCount = allItems.filter(
    (i) => i.verification?.status === 'unsupported' || i.verification?.status === 'quote_mismatch'
  ).length;
  const exactQuoteMatches = allItems.filter(
    (i) => i.verification?.quoteFoundVerbatim && i.verification?.quoteWordCount <= 25
  ).length;

  const ambiguousChecklist = checklistItems.filter((i) => i.flags?.isAmbiguous).length;
  const contradictoryChecklist = checklistItems.filter((i) => i.flags?.isContradictory).length;
  const defDependentChecklist = checklistItems.filter((i) => i.flags?.dependsOnDefinition).length;

  return (
    <section
      id="pass2-verification-summary"
      className="card"
      style={{
        borderLeft: unsupportedCount > 0 ? '4px solid var(--crimson-border)' : '4px solid var(--emerald-border)',
        background: 'var(--bg-surface)'
      }}
      aria-label="Second verification pass audit report"
    >
      <div className="card-body" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {unsupportedCount > 0 ? (
              <span className="badge badge-flagged" style={{ fontSize: '0.82rem', padding: '0.3rem 0.7rem' }}>
                <ShieldAlert size={15} />
                Pass 2 Verification Alert: {unsupportedCount} Unsupported / Mismatched Item(s) Flagged
              </span>
            ) : (
              <span className="badge badge-verified" style={{ fontSize: '0.82rem', padding: '0.3rem 0.7rem' }}>
                <ShieldCheck size={15} />
                Pass 2 Verification Complete: {supportedCount}/{allItems.length} Items &amp; Steps Verified Against Source
              </span>
            )}

            <span className="badge badge-neutral" title="Deterministic substring and <=25 word limit check">
              <CheckCircle2 size={13} />
              {exactQuoteMatches}/{allItems.length} Verbatim Quotes (&le;25 words)
            </span>

            {usedModel && (
              <span className="badge badge-neutral">
                Engine: {usedModel}
              </span>
            )}
          </div>

          {onInjectAdversarialTestItem && (
            <button
              id="btn-test-adversarial-hallucination"
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={onInjectAdversarialTestItem}
              title="Simulate an invented/unsupported AI item to test Pass 2 Verification flagging"
            >
              <FlaskConical size={14} />
              Test Pass 2 Hallucination Catcher
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span className="badge badge-conf-medium">
            <AlertTriangle size={13} /> {ambiguousChecklist} Ambiguous Rule(s) Flagged
          </span>
          <span className="badge badge-flagged">
            <GitCompareArrows size={13} /> {contradictoryChecklist} Contradictory Rule(s) Flagged
          </span>
          <span className="badge badge-definition">
            <BookMarked size={13} /> {defDependentChecklist} Definition-Dependent Rule(s) Linked
          </span>
          <span className="badge badge-neutral">
            Omitted Source Rules Detected: {omittedSourceRules.length}
          </span>
        </div>

        {omittedSourceRules.length > 0 && (
          <div className="flag-callout ambiguous">
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Pass 2 Auditor noticed potentially omitted source rule(s):</strong>
              <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                {omittedSourceRules.map((om, idx) => (
                  <li key={idx}>
                    <strong>{om.sectionRef}:</strong> {om.description} (<em>&ldquo;{om.verbatimQuote}&rdquo;</em>)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
