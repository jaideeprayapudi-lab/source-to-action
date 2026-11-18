/**
 * Export Utilities for Source-to-Action:
 * 1. CSV Export for Compliance Checklists (with citations, flags, verification status, and approval status)
 * 2. Markdown Export for Step-by-Step Procedures (Simple + Complex + Mermaid + citations)
 * 3. Print-Friendly / PDF View trigger
 */

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildChecklistCsvString(checklistItems = [], approvalState = {}, sourceTitle = '') {
  const governanceStatus =
    approvalState.status === 'approved'
      ? `Approved by ${approvalState.reviewerName} (${approvalState.reviewerRole}) on ${approvalState.approvedAt}`
      : 'DRAFT - REQUIRES QUALIFIED REVIEW';

  const headers = [
    'Item ID',
    'Section / Topic',
    'Plain-Language Requirement',
    'Requirement Type',
    'Evidence to Check',
    'Responsible Role',
    'Frequency / Deadline',
    'Citation Section Ref',
    'Citation Page Ref',
    'Verbatim Quote (<=25 words)',
    'Quote Word Count',
    'Confidence Level',
    'Pass 2 Verification Status',
    'Flag: Ambiguous',
    'Ambiguity Note',
    'Flag: Contradictory',
    'Contradiction Note',
    'Flag: Depends on Definition',
    'Definition Term & Note',
    'Audit Status',
    'Auditor Notes',
    'Document Governance Status',
    'Source Document'
  ];

  const rows = checklistItems.map((it) => [
    it.id,
    it.sectionTopic,
    it.requirement,
    it.requirementType,
    it.evidenceToCheck,
    it.responsibleRole,
    it.frequencyOrDeadline,
    it.citation?.sectionRef || '',
    it.citation?.pageRef || '',
    it.citation?.verbatimQuote || '',
    it.verification?.quoteWordCount ?? '',
    it.confidence,
    it.verification?.status || 'pending',
    it.flags?.isAmbiguous ? 'YES' : 'NO',
    it.flags?.ambiguityNote || '',
    it.flags?.isContradictory ? 'YES' : 'NO',
    it.flags?.contradictionNote || '',
    it.flags?.dependsOnDefinition ? 'YES' : 'NO',
    it.flags?.dependsOnDefinition ? `${it.flags.definitionTerm}: ${it.flags.definitionNote}` : '',
    it.auditStatus || 'Open',
    it.auditNotes || '',
    governanceStatus,
    sourceTitle
  ]);

  return [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))].join('\n');
}

export function downloadChecklistCsv(checklistItems, approvalState, sourceTitle) {
  const csvContent = buildChecklistCsvString(checklistItems, approvalState, sourceTitle);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'source-to-action-compliance-checklist.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildProcedureMarkdownString(procedureOutput, approvalState = {}, sourceTitle = '') {
  if (!procedureOutput) return '';

  const govBanner =
    approvalState.status === 'approved'
      ? `> **APPROVED OUTPUT:** Reviewed and approved by **${approvalState.reviewerName}** (${approvalState.reviewerRole}) on ${approvalState.approvedAt}.`
      : `> **⚠️ DRAFT — REQUIRES QUALIFIED REVIEW:** This procedure was derived from the supplied source document and requires human review before operational use.`;

  const lines = [
    `# ${procedureOutput.procedureTitle}`,
    '',
    govBanner,
    '',
    `- **Source Document:** ${sourceTitle}`,
    `- **Reading Level:** ${procedureOutput.readingLevel.toUpperCase()}`,
    '',
    '---',
    '',
    '## 1. Prerequisites & Authorizations',
    ...(procedureOutput.prerequisites || ['Not specified in source']).map((p) => `- ${p}`),
    '',
    '## 2. Materials, PPE & Equipment',
    ...(procedureOutput.materialsAndEquipment || ['Not specified in source']).map((m) => `- ${m}`),
    '',
    '## 3. Procedure Decision & Escalation Flowchart (Mermaid)',
    '```mermaid',
    procedureOutput.mermaidFlowchart || procedureOutput.fallbackMermaidFlowchart || 'flowchart TD',
    '```',
    '',
    '---',
    '',
    '## 4. Simple Mode — Sequential Step-by-Step Procedure',
    ''
  ];

  for (const st of procedureOutput.simpleSteps || []) {
    lines.push(`### Step ${st.stepNumber} [${st.completed ? 'x' : ' '}]`);
    lines.push(`**Action:** ${st.action}`);
    lines.push(`- **Responsible Role:** ${st.responsibleRole}`);
    lines.push(`- **Confidence:** ${st.confidence.toUpperCase()} | **Pass 2 Verification:** ${st.verification?.status}`);
    if (st.inlineWarnings?.length > 0) {
      for (const w of st.inlineWarnings) {
        lines.push(`- **⚠️ Warning:** ${w}`);
      }
    }
    if (st.flags?.isContradictory) {
      lines.push(`- **🚨 Contradiction Flag:** ${st.flags.contradictionNote}`);
    }
    if (st.flags?.isAmbiguous) {
      lines.push(`- **⚠️ Ambiguity Flag:** ${st.flags.ambiguityNote}`);
    }
    if (st.flags?.dependsOnDefinition) {
      lines.push(`- **📘 Depends on Definition (${st.flags.definitionTerm}):** ${st.flags.definitionNote}`);
    }
    lines.push(
      `- **Citation:** ${st.citation?.sectionRef} (${st.citation?.pageRef}) — *"${st.citation?.verbatimQuote}"*`
    );
    lines.push('');
  }

  lines.push('---', '', '## 5. Complex Mode — Phased Procedure with Decision Gates & Stop Conditions', '');

  for (const phase of procedureOutput.complexPhases || []) {
    lines.push(`### ${phase.phaseTitle}`);
    lines.push(`*Objective:* ${phase.phaseObjective}`, '');

    for (const cst of phase.steps || []) {
      lines.push(`#### Step ${cst.stepCode}: ${cst.action}`);
      lines.push(`- **Responsible Role:** ${cst.responsibleRole}`);
      lines.push(`- **Step Prerequisites:** ${cst.stepPrerequisites}`);
      lines.push(`- **Confidence:** ${cst.confidence.toUpperCase()} | **Pass 2 Verification:** ${cst.verification?.status}`);

      if (cst.decisionPoints?.length > 0) {
        for (const dp of cst.decisionPoints) {
          lines.push(`- **Decision Point (IF):** ${dp.condition}`);
          lines.push(`  - **THEN:** ${dp.ifTrueAction}`);
          lines.push(`  - **ELSE:** ${dp.ifFalseAction}`);
        }
      }
      if (cst.stopAndEscalateConditions?.length > 0) {
        for (const sc of cst.stopAndEscalateConditions) {
          lines.push(`- **🛑 STOP AND ESCALATE:** ${sc}`);
        }
      }
      if (cst.flags?.isContradictory) {
        lines.push(`- **🚨 Contradiction Flag:** ${cst.flags.contradictionNote}`);
      }
      if (cst.flags?.isAmbiguous) {
        lines.push(`- **⚠️ Ambiguity Flag:** ${cst.flags.ambiguityNote}`);
      }
      if (cst.flags?.dependsOnDefinition) {
        lines.push(`- **📘 Depends on Definition (${cst.flags.definitionTerm}):** ${cst.flags.definitionNote}`);
      }
      lines.push(
        `- **Citation:** ${cst.citation?.sectionRef} (${cst.citation?.pageRef}) — *"${cst.citation?.verbatimQuote}"*`
      );
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function downloadProcedureMarkdown(procedureOutput, approvalState, sourceTitle) {
  const mdContent = buildProcedureMarkdownString(procedureOutput, approvalState, sourceTitle);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'source-to-action-procedure.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
