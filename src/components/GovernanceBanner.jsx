import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, RotateCcw, UserCheck, X } from 'lucide-react';

export default function GovernanceBanner({
  approvalState,
  onApprove,
  onResetToDraft,
  hasGeneratedContent,
  unsupportedCount = 0
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState(approvalState.reviewerName || '');
  const [reviewerRole, setReviewerRole] = useState(approvalState.reviewerRole || '');
  const [reviewNotes, setReviewNotes] = useState(approvalState.reviewNotes || '');
  const [attested, setAttested] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isApproved = approvalState.status === 'approved';

  function handleOpenModal() {
    setErrorMsg('');
    setAttested(false);
    setModalOpen(true);
  }

  function handleSubmitApproval(e) {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerRole.trim()) {
      setErrorMsg('Please enter both your full name and professional qualification / role.');
      return;
    }
    if (!attested) {
      setErrorMsg('You must confirm that you have verified all citations against the source document.');
      return;
    }
    onApprove({
      status: 'approved',
      reviewerName: reviewerName.trim(),
      reviewerRole: reviewerRole.trim(),
      reviewNotes: reviewNotes.trim(),
      approvedAt: new Date().toISOString()
    });
    setModalOpen(false);
  }

  return (
    <>
      <div
        id="governance-review-banner"
        className={`governance-banner ${isApproved ? 'is-approved' : ''}`}
        role="region"
        aria-label="Document review and approval status"
      >
        <div className="governance-banner-left">
          <span className="governance-badge" id="governance-status-badge">
            {isApproved ? (
              <>
                <CheckCircle2 size={15} />
                Approved Output
              </>
            ) : (
              <>
                <AlertTriangle size={15} />
                Draft — Requires Qualified Review
              </>
            )}
          </span>

          {isApproved ? (
            <span className="governance-banner-text">
              Reviewed and approved by <strong>{approvalState.reviewerName}</strong> ({approvalState.reviewerRole}) on{' '}
              {new Date(approvalState.approvedAt).toLocaleString()}.
              {approvalState.reviewNotes ? ` Note: "${approvalState.reviewNotes}"` : ''}
            </span>
          ) : (
            <span className="governance-banner-text">
              All AI-derived checklists and procedures are <strong>unverified drafts</strong> until a qualified human
              reviewer checks every citation, ambiguity, and contradiction against the source document.
            </span>
          )}
        </div>

        <div className="governance-banner-actions no-print">
          {isApproved ? (
            <button
              id="btn-revert-to-draft"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onResetToDraft}
              title="Revert output back to Draft status"
            >
              <RotateCcw size={15} />
              Revert to Draft
            </button>
          ) : (
            <button
              id="btn-open-approval-modal"
              type="button"
              className="btn btn-amber btn-sm"
              onClick={handleOpenModal}
              disabled={!hasGeneratedContent}
              title={
                hasGeneratedContent
                  ? 'Sign off and mark this output as Approved'
                  : 'Generate a checklist or procedure first before marking Approved'
              }
            >
              <UserCheck size={15} />
              Mark Approved…
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <h2 id="approval-modal-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={20} />
                Qualified Human Review Sign-Off
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalOpen(false)}
                aria-label="Close approval modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitApproval}>
              <div className="modal-body">
                {unsupportedCount > 0 && (
                  <div className="flag-callout contradictory">
                    <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Warning: {unsupportedCount} item(s) flagged by Verification Pass.</strong>
                      <p style={{ marginTop: '0.2rem' }}>
                        Please inspect or edit flagged items before approving, or document your override rationale below.
                      </p>
                    </div>
                  </div>
                )}

                <div className="field-group">
                  <label className="field-label" htmlFor="reviewer-name-input">
                    Reviewer Full Name *
                  </label>
                  <input
                    id="reviewer-name-input"
                    type="text"
                    className="text-input"
                    placeholder="e.g., Dr. Elena Rostova"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="reviewer-role-input">
                    Qualification / Title *
                  </label>
                  <input
                    id="reviewer-role-input"
                    type="text"
                    className="text-input"
                    placeholder="e.g., Lead Regulatory Compliance Auditor, QA Director"
                    value={reviewerRole}
                    onChange={(e) => setReviewerRole(e.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="reviewer-notes-input">
                    Review Scope & Sign-Off Notes (Optional)
                  </label>
                  <textarea
                    id="reviewer-notes-input"
                    className="textarea-input"
                    rows={3}
                    placeholder="Document any resolved contradictions, local interpretations, or audit notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>

                <label
                  htmlFor="reviewer-attest-checkbox"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    padding: '0.65rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <input
                    id="reviewer-attest-checkbox"
                    type="checkbox"
                    checked={attested}
                    onChange={(e) => setAttested(e.target.checked)}
                    style={{ marginTop: '0.25rem', width: '18px', height: '18px' }}
                  />
                  <span>
                    I attest that I am a qualified reviewer, I have verified the extracted items and citations against the
                    source document, and I approve this output for operational use. (Any subsequent edit will automatically
                    revert this status to <strong>Draft</strong>.)
                  </span>
                </label>

                {errorMsg && (
                  <div className="flag-callout contradictory" role="alert">
                    <AlertTriangle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button id="btn-confirm-approval" type="submit" className="btn btn-emerald">
                  <CheckCircle2 size={16} />
                  Approve Output
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
