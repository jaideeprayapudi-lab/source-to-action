import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  GitCompareArrows,
  BookMarked,
  Quote,
  CheckCircle2,
  User,
  Clock,
  FileSearch,
  X
} from 'lucide-react';
import { verifyQuoteDeterministically } from '../services/geminiService';

const AUDIT_STATUS_OPTIONS = ['Open', 'Met', 'Not met', 'N/A'];

export default function ChecklistWorkspace({
  items,
  sections,
  fullSourceText,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onSelectQuote
}) {
  // Search & Multi-Facet Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [filterFlag, setFilterFlag] = useState('all');
  const [filterAuditStatus, setFilterAuditStatus] = useState('all');

  // Edit / Add Modal State
  const [editingItem, setEditingItem] = useState(null); // null or item object
  const [isAddingNew, setIsAddingNew] = useState(false);

  const sectionTopics = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const it of items) {
      if (it.sectionTopic && !seen.has(it.sectionTopic)) {
        seen.add(it.sectionTopic);
        list.push(it.sectionTopic);
      }
    }
    return list;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterSection !== 'all' && item.sectionTopic !== filterSection) return false;
      if (filterType !== 'all' && item.requirementType !== filterType) return false;
      if (filterConfidence !== 'all' && item.confidence !== filterConfidence) return false;
      if (filterAuditStatus !== 'all' && item.auditStatus !== filterAuditStatus) return false;

      if (filterFlag === 'ambiguous' && !item.flags?.isAmbiguous) return false;
      if (filterFlag === 'contradictory' && !item.flags?.isContradictory) return false;
      if (filterFlag === 'definition' && !item.flags?.dependsOnDefinition) return false;
      if (
        filterFlag === 'unsupported' &&
        item.verification?.status !== 'unsupported' &&
        item.verification?.status !== 'quote_mismatch'
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          item.id,
          item.requirement,
          item.evidenceToCheck,
          item.responsibleRole,
          item.frequencyOrDeadline,
          item.citation?.sectionRef,
          item.citation?.verbatimQuote,
          item.flags?.ambiguityNote,
          item.flags?.contradictionNote,
          item.flags?.definitionTerm,
          item.auditNotes
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterSection, filterType, filterConfidence, filterFlag, filterAuditStatus, searchQuery]);

  // Group filtered items by sectionTopic
  const groupedBySection = useMemo(() => {
    const groups = new Map();
    for (const item of filteredItems) {
      const topic = item.sectionTopic || 'General Requirements';
      if (!groups.has(topic)) {
        groups.set(topic, []);
      }
      groups.get(topic).push(item);
    }
    return Array.from(groups.entries());
  }, [filteredItems]);

  // Audit status counts
  const statusCounts = useMemo(() => {
    const counts = { Open: 0, Met: 0, 'Not met': 0, 'N/A': 0 };
    for (const it of items) {
      counts[it.auditStatus || 'Open'] = (counts[it.auditStatus || 'Open'] || 0) + 1;
    }
    return counts;
  }, [items]);

  function openAddModal() {
    const defaultSection = sections[0]?.title || sectionTopics[0] || 'SECTION 1: GENERAL';
    setIsAddingNew(true);
    setEditingItem({
      id: `CHK-${String(items.length + 1).padStart(3, '0')}`,
      sectionId: sections[0]?.id || 'sec-1',
      sectionTopic: defaultSection,
      requirement: '',
      requirementType: 'mandatory',
      evidenceToCheck: 'Not specified in source',
      responsibleRole: 'Not specified in source',
      frequencyOrDeadline: 'Not specified in source',
      citation: {
        sectionRef: '',
        pageRef: 'Page 1',
        verbatimQuote: ''
      },
      confidence: 'high',
      confidenceRationale: 'Added / verified by human reviewer.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      },
      auditStatus: 'Open',
      auditNotes: ''
    });
  }

  function openEditModal(item) {
    setIsAddingNew(false);
    setEditingItem(JSON.parse(JSON.stringify(item)));
  }

  function handleSaveModal(e) {
    e.preventDefault();
    if (!editingItem.requirement.trim()) return;

    const quoteCheck = verifyQuoteDeterministically(
      editingItem.citation?.verbatimQuote || '',
      fullSourceText
    );

    const updatedItem = {
      ...editingItem,
      verification: {
        status: quoteCheck.quoteFoundVerbatim && quoteCheck.withinWordLimit ? 'supported' : 'quote_mismatch',
        quoteFoundVerbatim: quoteCheck.quoteFoundVerbatim,
        quoteWordCount: quoteCheck.quoteWordCount,
        aiVerified: quoteCheck.quoteFoundVerbatim && quoteCheck.withinWordLimit,
        inventedDetailsFound: [],
        verificationNotes:
          quoteCheck.quoteFoundVerbatim && quoteCheck.withinWordLimit
            ? `Verified (${quoteCheck.quoteWordCount} words verbatim in source).`
            : !quoteCheck.withinWordLimit
              ? `Quote exceeds 25-word limit (${quoteCheck.quoteWordCount} words).`
              : 'Quote substring not found verbatim in source text — flagged for review.',
        verifiedAt: new Date().toISOString()
      },
      isUserEdited: !isAddingNew,
      isUserAdded: isAddingNew
    };

    if (isAddingNew) {
      onAddItem(updatedItem);
    } else {
      onUpdateItem(updatedItem);
    }
    setEditingItem(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPI & Audit Progress Bar */}
      <div
        className="card no-print"
        style={{ padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">Total: {items.length} Items</span>
          <span className="badge badge-mandatory">
            Mandatory: {items.filter((i) => i.requirementType === 'mandatory').length}
          </span>
          <span className="badge badge-recommended">
            Recommended: {items.filter((i) => i.requirementType === 'recommended').length}
          </span>
          <span className="badge badge-neutral">Open: {statusCounts.Open}</span>
          <span className="badge badge-verified">Met: {statusCounts.Met}</span>
          <span className="badge badge-flagged">Not Met: {statusCounts['Not met']}</span>
          <span className="badge badge-neutral">N/A: {statusCounts['N/A']}</span>
        </div>

        <button id="btn-add-checklist-item" type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={15} /> Add Checklist Item
        </button>
      </div>

      {/* Search & Multi-Facet Filter Toolbar */}
      <div className="card filter-toolbar no-print" style={{ padding: '1rem 1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div className="field-group" style={{ minWidth: '220px' }}>
            <label className="field-label" htmlFor="checklist-search-input">
              <Search size={14} /> Search Requirements &amp; Quotes
            </label>
            <input
              id="checklist-search-input"
              type="text"
              className="text-input"
              placeholder="Search rule, quote, role, evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="field-group" style={{ minWidth: '160px' }}>
            <label className="field-label" htmlFor="filter-section-select">
              <Filter size={14} /> Section / Topic
            </label>
            <select
              id="filter-section-select"
              className="select-input"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="all">All Sections ({sectionTopics.length})</option>
              {sectionTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group" style={{ minWidth: '140px' }}>
            <label className="field-label" htmlFor="filter-type-select">
              Requirement Type
            </label>
            <select
              id="filter-type-select"
              className="select-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="mandatory">Mandatory Only</option>
              <option value="recommended">Recommended Only</option>
            </select>
          </div>

          <div className="field-group" style={{ minWidth: '140px' }}>
            <label className="field-label" htmlFor="filter-flag-select">
              Flags &amp; Verification
            </label>
            <select
              id="filter-flag-select"
              className="select-input"
              value={filterFlag}
              onChange={(e) => setFilterFlag(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="ambiguous">Flagged: Ambiguous</option>
              <option value="contradictory">Flagged: Contradictory</option>
              <option value="definition">Depends on Definition</option>
              <option value="unsupported">Unsupported / Quote Mismatch</option>
            </select>
          </div>

          <div className="field-group" style={{ minWidth: '130px' }}>
            <label className="field-label" htmlFor="filter-confidence-select">
              Confidence
            </label>
            <select
              id="filter-confidence-select"
              className="select-input"
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
            >
              <option value="all">All Confidence</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="field-group" style={{ minWidth: '130px' }}>
            <label className="field-label" htmlFor="filter-status-select">
              Audit Status
            </label>
            <select
              id="filter-status-select"
              className="select-input"
              value={filterAuditStatus}
              onChange={(e) => setFilterAuditStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {AUDIT_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Checklist Items */}
      {groupedBySection.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
          No checklist items match your current filter criteria.
        </div>
      ) : (
        groupedBySection.map(([sectionTitle, groupItems]) => (
          <div key={sectionTitle} className="checklist-section-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.9rem',
                background: 'var(--bg-subtle)',
                borderLeft: '4px solid var(--ink-primary)',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{sectionTitle}</h3>
              <span className="badge badge-neutral">{groupItems.length} item(s)</span>
            </div>

            {groupItems.map((item) => {
              const isUnsupported =
                item.verification?.status === 'unsupported' || item.verification?.status === 'quote_mismatch';

              return (
                <article
                  key={item.id}
                  id={`checklist-item-${item.id}`}
                  className="card"
                  style={{
                    borderLeft: isUnsupported
                      ? '4px solid var(--crimson-border)'
                      : item.flags?.isContradictory
                        ? '4px solid var(--crimson-border)'
                        : item.flags?.isAmbiguous
                          ? '4px solid var(--amber-border)'
                          : '4px solid var(--emerald-border)'
                  }}
                >
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {/* Top Row: ID, Badges, Audit Status & Edit/Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: 'var(--ink-secondary)'
                          }}
                        >
                          {item.id}
                        </span>

                        <span
                          className={`badge ${
                            item.requirementType === 'mandatory' ? 'badge-mandatory' : 'badge-recommended'
                          }`}
                        >
                          {item.requirementType === 'mandatory' ? 'Mandatory' : 'Recommended'}
                        </span>

                        <span className={`badge badge-conf-${item.confidence}`}>
                          Confidence: {item.confidence.toUpperCase()}
                        </span>

                        {isUnsupported ? (
                          <span className="badge badge-flagged" title={item.verification?.verificationNotes}>
                            <ShieldAlert size={13} />
                            Pass 2 Flagged: {item.verification?.status === 'unsupported' ? 'Unsupported' : 'Quote Mismatch'}
                          </span>
                        ) : (
                          <span className="badge badge-verified" title={item.verification?.verificationNotes}>
                            <ShieldCheck size={13} />
                            Pass 2 Verified ({item.verification?.quoteWordCount || 0}/25w)
                          </span>
                        )}

                        {item.flags?.isAmbiguous && (
                          <span className="badge badge-conf-medium">
                            <AlertTriangle size={12} /> Ambiguous
                          </span>
                        )}
                        {item.flags?.isContradictory && (
                          <span className="badge badge-flagged">
                            <GitCompareArrows size={12} /> Contradictory
                          </span>
                        )}
                        {item.flags?.dependsOnDefinition && (
                          <span className="badge badge-definition">
                            <BookMarked size={12} /> Depends on Definition
                          </span>
                        )}
                      </div>

                      <div className="item-action-buttons no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label htmlFor={`status-select-${item.id}`} className="field-label" style={{ margin: 0, fontSize: '0.8rem' }}>
                          Status:
                        </label>
                        <select
                          id={`status-select-${item.id}`}
                          className="select-input"
                          style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}
                          value={item.auditStatus || 'Open'}
                          onChange={(e) => onUpdateItem({ ...item, auditStatus: e.target.value })}
                        >
                          {AUDIT_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <button
                          id={`btn-edit-${item.id}`}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(item)}
                          title="Edit checklist item"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          id={`btn-delete-${item.id}`}
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteItem(item.id)}
                          title="Delete checklist item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Plain-Language Requirement */}
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                      {item.requirement}
                    </p>

                    {/* Structured Audit Metadata Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                        gap: '0.75rem',
                        background: 'var(--bg-elevated)',
                        padding: '0.75rem 0.95rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.92rem'
                      }}
                    >
                      <div>
                        <div className="field-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                          <FileSearch size={13} /> Evidence to Check
                        </div>
                        <div style={{ marginTop: '0.15rem', fontWeight: 500 }}>{item.evidenceToCheck}</div>
                      </div>

                      <div>
                        <div className="field-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                          <User size={13} /> Responsible Role
                        </div>
                        <div
                          style={{
                            marginTop: '0.15rem',
                            fontWeight: 500,
                            color:
                              item.responsibleRole === 'Not specified in source'
                                ? 'var(--ink-muted)'
                                : 'var(--ink-primary)'
                          }}
                        >
                          {item.responsibleRole}
                        </div>
                      </div>

                      <div>
                        <div className="field-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                          <Clock size={13} /> Frequency / Deadline
                        </div>
                        <div
                          style={{
                            marginTop: '0.15rem',
                            fontWeight: 500,
                            color:
                              item.frequencyOrDeadline === 'Not specified in source'
                                ? 'var(--ink-muted)'
                                : 'var(--ink-primary)'
                          }}
                        >
                          {item.frequencyOrDeadline}
                        </div>
                      </div>
                    </div>

                    {/* Mandatory Citation Block */}
                    <div className="citation-box">
                      <div className="citation-meta">
                        <span>
                          <Quote size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                          <strong>Citation:</strong> {item.citation?.sectionRef} • <strong>{item.citation?.pageRef}</strong>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{item.verification?.quoteWordCount || 0} / 25 words max</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm no-print"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => onSelectQuote(item.citation)}
                          >
                            Highlight in Source
                          </button>
                        </div>
                      </div>
                      <div className="citation-quote">&ldquo;{item.citation?.verbatimQuote}&rdquo;</div>
                    </div>

                    {/* Flag Callouts (Ambiguity, Contradiction, Definition Dependency, or Unsupported) */}
                    {(item.flags?.isAmbiguous ||
                      item.flags?.isContradictory ||
                      item.flags?.dependsOnDefinition ||
                      isUnsupported) && (
                      <div className="flag-alerts">
                        {isUnsupported && (
                          <div className="flag-callout contradictory">
                            <ShieldAlert size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Pass 2 Verification Flag — Unsupported or Unmatched Citation:</strong>{' '}
                              {item.verification?.verificationNotes}
                              {item.verification?.inventedDetailsFound?.length > 0 && (
                                <div style={{ marginTop: '0.25rem' }}>
                                  Invented details detected: {item.verification.inventedDetailsFound.join('; ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {item.flags?.isContradictory && (
                          <div className="flag-callout contradictory">
                            <GitCompareArrows size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Contradiction Flagged:</strong> {item.flags.contradictionNote}
                            </div>
                          </div>
                        )}

                        {item.flags?.isAmbiguous && (
                          <div className="flag-callout ambiguous">
                            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Ambiguity Flagged:</strong> {item.flags.ambiguityNote}
                            </div>
                          </div>
                        )}

                        {item.flags?.dependsOnDefinition && (
                          <div className="flag-callout definition">
                            <BookMarked size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Depends on Definition ({item.flags.definitionTerm}):</strong>{' '}
                              {item.flags.definitionNote}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Auditor Notes Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                      <input
                        id={`notes-input-${item.id}`}
                        type="text"
                        className="text-input"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}
                        placeholder="Add auditor review notes, evidence reference, or remediation action..."
                        value={item.auditNotes || ''}
                        onChange={(e) => onUpdateItem({ ...item, auditNotes: e.target.value })}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ))
      )}

      {/* Edit / Add Checklist Item Modal */}
      {editingItem && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-item-modal-title">
          <div className="modal-card" style={{ maxWidth: '660px' }}>
            <div className="modal-header">
              <h2 id="edit-item-modal-title" style={{ fontSize: '1.15rem' }}>
                {isAddingNew ? 'Add New Compliance Checklist Item' : `Edit Checklist Item (${editingItem.id})`}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingItem(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-section-topic">
                      Section / Topic Group
                    </label>
                    <input
                      id="modal-section-topic"
                      type="text"
                      className="text-input"
                      value={editingItem.sectionTopic}
                      onChange={(e) => setEditingItem({ ...editingItem, sectionTopic: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-req-type">
                      Requirement Type
                    </label>
                    <select
                      id="modal-req-type"
                      className="select-input"
                      value={editingItem.requirementType}
                      onChange={(e) => setEditingItem({ ...editingItem, requirementType: e.target.value })}
                    >
                      <option value="mandatory">Mandatory</option>
                      <option value="recommended">Recommended</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="modal-requirement-text">
                    Plain-Language Requirement *
                  </label>
                  <textarea
                    id="modal-requirement-text"
                    className="textarea-input"
                    rows={3}
                    value={editingItem.requirement}
                    onChange={(e) => setEditingItem({ ...editingItem, requirement: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-role-input">
                      Responsible Role (or &ldquo;Not specified in source&rdquo;)
                    </label>
                    <input
                      id="modal-role-input"
                      type="text"
                      className="text-input"
                      value={editingItem.responsibleRole}
                      onChange={(e) => setEditingItem({ ...editingItem, responsibleRole: e.target.value })}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-freq-input">
                      Frequency / Deadline (or &ldquo;Not specified in source&rdquo;)
                    </label>
                    <input
                      id="modal-freq-input"
                      type="text"
                      className="text-input"
                      value={editingItem.frequencyOrDeadline}
                      onChange={(e) => setEditingItem({ ...editingItem, frequencyOrDeadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="modal-evidence-input">
                    Evidence to Check
                  </label>
                  <input
                    id="modal-evidence-input"
                    type="text"
                    className="text-input"
                    value={editingItem.evidenceToCheck}
                    onChange={(e) => setEditingItem({ ...editingItem, evidenceToCheck: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-cit-sec">
                      Citation Section Ref *
                    </label>
                    <input
                      id="modal-cit-sec"
                      type="text"
                      className="text-input"
                      placeholder="e.g., Section 2, Rule 4"
                      value={editingItem.citation.sectionRef}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          citation: { ...editingItem.citation, sectionRef: e.target.value }
                        })
                      }
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-cit-page">
                      Citation Page Ref *
                    </label>
                    <input
                      id="modal-cit-page"
                      type="text"
                      className="text-input"
                      placeholder="e.g., Page 1"
                      value={editingItem.citation.pageRef}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          citation: { ...editingItem.citation, pageRef: e.target.value }
                        })
                      }
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="modal-confidence">
                      Confidence Level
                    </label>
                    <select
                      id="modal-confidence"
                      className="select-input"
                      value={editingItem.confidence}
                      onChange={(e) => setEditingItem({ ...editingItem, confidence: e.target.value })}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="modal-verbatim-quote">
                    Verbatim Quote from Source (Max 25 words — checked against source on save) *
                  </label>
                  <textarea
                    id="modal-verbatim-quote"
                    className="textarea-input"
                    rows={2}
                    value={editingItem.citation.verbatimQuote}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        citation: { ...editingItem.citation, verbatimQuote: e.target.value }
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button id="btn-save-item-modal" type="submit" className="btn btn-primary">
                  Save &amp; Verify Citation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
