import {
  CHECKLIST_SECTION_RESPONSE_SCHEMA,
  PROCEDURE_RESPONSE_SCHEMA,
  VERIFICATION_PASS_RESPONSE_SCHEMA
} from './schemas';

const FALLBACK_MODEL_CHAIN = [
  'gemini-4-hydrogen',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite'
];

/**
 * Deterministic Stage 2A Verification:
 * 1. Counts words in citation.verbatimQuote (must be <= 25 words).
 * 2. Normalizes whitespace and punctuation to verify whether verbatimQuote
 *    actually exists in the supplied source text.
 */
export function verifyQuoteDeterministically(verbatimQuote, sourceText) {
  if (!verbatimQuote || typeof verbatimQuote !== 'string') {
    return {
      quoteFoundVerbatim: false,
      quoteWordCount: 0,
      withinWordLimit: false
    };
  }

  const trimmedQuote = verbatimQuote.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  const words = trimmedQuote.split(/\s+/).filter(Boolean);
  const quoteWordCount = words.length;
  const withinWordLimit = quoteWordCount > 0 && quoteWordCount <= 25;

  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, "'")
      .replace(/[\u201C\u201D"]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

  const normQuote = normalize(trimmedQuote);
  const normSource = normalize(sourceText);

  // Also check alphanumeric-only sequence in case line wraps split hyphenated words
  const alphaNum = (str) => (str || '').toLowerCase().replace(/[^a-z0-9°%-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const quoteFoundVerbatim =
    normQuote.length > 0 &&
    (normSource.includes(normQuote) || alphaNum(sourceText).includes(alphaNum(trimmedQuote)));

  return {
    quoteFoundVerbatim,
    quoteWordCount,
    withinWordLimit
  };
}

/**
 * Deterministic Mermaid Flowchart Builder / Sanitizer so Complex Procedure mode
 * always renders a valid, error-free `flowchart TD` diagram.
 */
export function buildDeterministicMermaid(complexPhases = []) {
  const lines = ['flowchart TD'];
  let prevNodeId = null;
  let nodeCounter = 1;

  const cleanLabel = (txt, maxLen = 58) => {
    const raw = (txt || '')
      .replace(/["[\]{}()<>|#&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return raw.length > maxLen ? `${raw.slice(0, maxLen - 1)}…` : raw;
  };

  for (const phase of complexPhases) {
    for (const step of phase.steps || []) {
      const stepNodeId = `S${nodeCounter++}`;
      const rolePrefix =
        step.responsibleRole && step.responsibleRole !== 'Not specified in source'
          ? `[${cleanLabel(step.responsibleRole, 22)}] `
          : '';
      lines.push(`  ${stepNodeId}["Step ${cleanLabel(step.stepCode, 8)}: ${rolePrefix}${cleanLabel(step.action, 54)}"]`);

      if (prevNodeId) {
        lines.push(`  ${prevNodeId} --> ${stepNodeId}`);
      }
      prevNodeId = stepNodeId;

      // Render Decision Points (IF/THEN/ELSE)
      if (Array.isArray(step.decisionPoints) && step.decisionPoints.length > 0) {
        for (const dp of step.decisionPoints) {
          const decId = `D${nodeCounter++}`;
          const trueId = `T${nodeCounter++}`;
          lines.push(`  ${decId}{"IF: ${cleanLabel(dp.condition, 46)}"}`);
          lines.push(`  ${prevNodeId} --> ${decId}`);
          lines.push(`  ${trueId}["THEN: ${cleanLabel(dp.ifTrueAction, 48)}"]`);
          lines.push(`  ${decId} -->|"Yes"| ${trueId}`);

          if (dp.ifFalseAction && dp.ifFalseAction !== 'Not specified in source') {
            const falseId = `F${nodeCounter++}`;
            lines.push(`  ${falseId}["ELSE: ${cleanLabel(dp.ifFalseAction, 48)}"]`);
            lines.push(`  ${decId} -->|"No"| ${falseId}`);
          }
          prevNodeId = trueId;
        }
      }

      // Render Stop-and-Escalate Triggers
      if (Array.isArray(step.stopAndEscalateConditions) && step.stopAndEscalateConditions.length > 0) {
        for (const stopCond of step.stopAndEscalateConditions) {
          const stopId = `ESC${nodeCounter++}`;
          lines.push(`  ${stopId}["STOP AND ESCALATE: ${cleanLabel(stopCond, 52)}"]`);
          lines.push(`  ${stepNodeId} -.->|"Hazard Trigger"| ${stopId}`);
          lines.push(`  style ${stopId} fill:#fee2e2,stroke:#ef4444,color:#991b1b,stroke-width:2px`);
        }
      }
    }
  }

  if (lines.length === 1) {
    lines.push('  A["Start Procedure"] --> B["Complete Procedure"]');
  }

  return lines.join('\n');
}

/**
 * Calls the Gemini REST API generateContent endpoint with structured JSON schema output
 * and automatic model fallback if a model is unavailable for the user's API key tier.
 */
export async function callGeminiStructured({
  apiKey,
  model,
  systemInstruction,
  userPrompt,
  responseSchema,
  pdfBase64 = null
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is required for live API calls.');
  }

  const candidateModels = [
    model,
    ...FALLBACK_MODEL_CHAIN.filter((m) => m !== model)
  ];

  const userParts = [];
  if (pdfBase64) {
    userParts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64
      }
    });
  }
  userParts.push({ text: userPrompt });

  let lastError = null;

  for (const candidateModel of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      candidateModel
    )}:generateContent`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: userParts
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errDetail = errJson?.error?.message || errDetail;
      } catch {
        // ignore JSON parse failure
      }
      lastError = new Error(`Model ${candidateModel}: ${errDetail}`);
      // If 404 or model entitlement issue, try next model in fallback chain
      if (response.status === 404 || response.status === 403 || /not found|not supported|deprecated/i.test(errDetail)) {
        continue;
      }
      throw lastError;
    }

    const data = await response.json();
    const rawJsonText = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();

    if (!rawJsonText) {
      throw new Error(`Model ${candidateModel} returned an empty response.`);
    }

    const parsed = JSON.parse(rawJsonText);
    return {
      parsed,
      usedModel: candidateModel
    };
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

const PASS1_SYSTEM_PROMPT = `You are a strict, zero-inference regulatory and procedural compliance compiler ("Source-to-Action").

NON-NEGOTIABLE RULES:
1. CLOSED-WORLD SOURCE ONLY: Use ONLY the supplied source text. NEVER add, infer, or extrapolate requirements, steps, numbers, temperatures, durations, PPE, roles, or thresholds from general knowledge or industry norms.
2. LITERAL FALLBACK FOR UNSTATED DETAILS: If the source does not explicitly state a field (such as responsibleRole, frequencyOrDeadline, evidenceToCheck, stepPrerequisites, prerequisites, or materialsAndEquipment), you MUST output the exact literal string "Not specified in source". Never guess.
3. MANDATORY VERBATIM CITATIONS (<= 25 WORDS): Every checklist item and every procedure step must include:
   - sectionRef: exact section and rule number (e.g., "Section 2, Rule 5")
   - pageRef: exact page number from the [Page N] markers (e.g., "Page 1")
   - verbatimQuote: an exact character-for-character substring from the source text of AT MOST 25 WORDS.
4. CONFIDENCE & FLAGS:
   - Assign confidence: "high", "medium", or "low".
   - Flag ambiguities (isAmbiguous: true) when the source uses vague terms like "at appropriate intervals", "suitable personnel", "whenever conditions warrant", or "as necessary".
   - Flag contradictions (isContradictory: true) when a rule conflicts with another rule in the same section or in <OTHER_SELECTED_SECTIONS_CONTEXT> (for example, conflicting retention periods or review frequencies). Explain both conflicting rules in contradictionNote.
   - Flag definition dependencies (dependsOnDefinition: true) when interpreting a rule relies on a term defined in <GLOBAL_DEFINITIONS_CONTEXT> (or when a rule itself defines a normative threshold/qualification).`;

const PASS2_VERIFICATION_SYSTEM_PROMPT = `You are an adversarial regulatory compliance auditor performing Pass 2 Verification.
Your task is to audit each candidate checklist item and procedure step against its cited verbatimQuote and the full supplied <SOURCE_TEXT>.

AUDIT RULES:
1. Check whether every number, threshold, role, frequency, deadline, condition, and requirement in each item is explicitly present in <SOURCE_TEXT>.
2. If ANY detail was invented or guessed from outside knowledge, set status="unsupported", aiVerified=false, and list the invented detail in inventedDetailsFound.
3. Verify whether any cross-section contradiction (e.g. conflicting retention periods or inspection schedules between sections), ambiguity, or definition dependency was missed in Pass 1. If so, populate missedContradictionOrAmbiguity.
4. Check if any numbered rule in the selected <SOURCE_TEXT> was completely omitted by Pass 1 and list it in omittedSourceRules.`;

/**
 * Executes the complete Two-Pass Extraction & Verification Pipeline across selected sections.
 */
export async function runLiveExtractionAndVerification({
  apiKey,
  model,
  sections,
  readingLevel = 'plain',
  target = 'both',
  pdfBase64 = null,
  onProgress = () => {}
}) {
  const selectedSections = sections.filter((s) => s.selected);
  if (selectedSections.length === 0) {
    throw new Error('Please select at least one section to process.');
  }

  const definitionsContext = sections
    .filter((s) => s.isDefinitionsSection)
    .map((s) => `[${s.title} - Page ${s.pageStart}]\n${s.rawText}`)
    .join('\n\n');

  const allSelectedText = selectedSections
    .map((s) => `[${s.title} | Page ${s.pageStart}]\n${s.rawText}`)
    .join('\n\n');

  let activeModelUsed = model;
  const extractedChecklistItems = [];
  let itemCounter = 1;

  // PASS 1A: Section-by-Section Compliance Checklist Generation
  if (target === 'both' || target === 'checklist') {
    for (let i = 0; i < selectedSections.length; i++) {
      const sec = selectedSections[i];
      onProgress(
        `Pass 1A (Checklist): Processing section ${i + 1} of ${selectedSections.length} (${sec.title})...`
      );

      const otherSectionsDigest = selectedSections
        .filter((other) => other.id !== sec.id)
        .map((other) => `[${other.title} - Page ${other.pageStart}]\n${other.rawText}`)
        .join('\n\n');

      const userPrompt = `Extract all auditable compliance checklist items from <TARGET_SECTION>.
Use <GLOBAL_DEFINITIONS_CONTEXT> to identify if any item in <TARGET_SECTION> depends on a definition elsewhere.
Use <OTHER_SELECTED_SECTIONS_CONTEXT> ONLY to check if any rule in <TARGET_SECTION> contradicts a rule in another section (do NOT extract items from other sections in this turn; extract ONLY items belonging to <TARGET_SECTION>).

<GLOBAL_DEFINITIONS_CONTEXT>
${definitionsContext || 'None'}
</GLOBAL_DEFINITIONS_CONTEXT>

<OTHER_SELECTED_SECTIONS_CONTEXT>
${otherSectionsDigest || 'None'}
</OTHER_SELECTED_SECTIONS_CONTEXT>

<TARGET_SECTION sectionId="${sec.id}" title="${sec.title}" page="${sec.pageStart}">
${sec.rawText}
</TARGET_SECTION>`;

      const { parsed, usedModel } = await callGeminiStructured({
        apiKey,
        model: activeModelUsed,
        systemInstruction: PASS1_SYSTEM_PROMPT,
        userPrompt,
        responseSchema: CHECKLIST_SECTION_RESPONSE_SCHEMA,
        pdfBase64
      });
      activeModelUsed = usedModel;

      for (const rawItem of parsed.items || []) {
        const id = `CHK-${String(itemCounter++).padStart(3, '0')}`;
        const localCheck = verifyQuoteDeterministically(
          rawItem.citation?.verbatimQuote,
          sec.rawText
        );

        extractedChecklistItems.push({
          id,
          sectionId: sec.id,
          sectionTopic: sec.title,
          requirement: rawItem.requirement,
          requirementType: rawItem.requirementType,
          evidenceToCheck: rawItem.evidenceToCheck || 'Not specified in source',
          responsibleRole: rawItem.responsibleRole || 'Not specified in source',
          frequencyOrDeadline: rawItem.frequencyOrDeadline || 'Not specified in source',
          citation: {
            sectionRef: rawItem.citation?.sectionRef || sec.title,
            pageRef: rawItem.citation?.pageRef || `Page ${sec.pageStart}`,
            verbatimQuote: rawItem.citation?.verbatimQuote || ''
          },
          confidence: rawItem.confidence || 'medium',
          confidenceRationale: rawItem.confidenceRationale || '',
          flags: {
            isAmbiguous: Boolean(rawItem.flags?.isAmbiguous),
            ambiguityNote: rawItem.flags?.ambiguityNote || '',
            isContradictory: Boolean(rawItem.flags?.isContradictory),
            contradictionNote: rawItem.flags?.contradictionNote || '',
            dependsOnDefinition: Boolean(rawItem.flags?.dependsOnDefinition),
            definitionTerm: rawItem.flags?.definitionTerm || '',
            definitionNote: rawItem.flags?.definitionNote || ''
          },
          verification: {
            status: localCheck.quoteFoundVerbatim && localCheck.withinWordLimit ? 'supported' : 'quote_mismatch',
            quoteFoundVerbatim: localCheck.quoteFoundVerbatim,
            quoteWordCount: localCheck.quoteWordCount,
            aiVerified: false,
            inventedDetailsFound: [],
            verificationNotes: 'Pending Pass 2 AI verification...',
            verifiedAt: new Date().toISOString()
          },
          auditStatus: 'Open',
          auditNotes: ''
        });
      }
    }
  }

  // PASS 1B: Step-by-Step Procedure Generation (Simple & Complex + Mermaid)
  let procedureOutput = null;
  if (target === 'both' || target === 'procedure') {
    onProgress(`Pass 1B (Procedure): Generating Simple & Complex procedures (${readingLevel} reading level)...`);

    const procPrompt = `Derive a complete ordered Step-by-Step Procedure in BOTH Simple Mode and Complex Mode from the operational instructions in <SELECTED_SOURCE_SECTIONS>.
Reading Level Requested: "${readingLevel.toUpperCase()}" (${
      readingLevel === 'plain'
        ? 'Use clear, direct plain language while keeping all numbers, units, and role titles strictly faithful to the source.'
        : 'Use formal regulatory and technical terminology faithful to the source.'
    }).

Include:
- prerequisites and materialsAndEquipment (or ["Not specified in source"] if not stated)
- simpleSteps: numbered sequential steps, one atomic action per step, inline warnings, role, verbatim citation (<=25 words), confidence, and flags.
- complexPhases: logically grouped operational phases with stepPrerequisites, IF/THEN/ELSE decisionPoints, stopAndEscalateConditions, inlineWarnings, role, verbatim citation (<=25 words), confidence, and flags.
- mermaidFlowchart: valid "flowchart TD" Mermaid diagram with quoted labels.

<GLOBAL_DEFINITIONS_CONTEXT>
${definitionsContext || 'None'}
</GLOBAL_DEFINITIONS_CONTEXT>

<SELECTED_SOURCE_SECTIONS>
${allSelectedText}
</SELECTED_SOURCE_SECTIONS>`;

    const { parsed, usedModel } = await callGeminiStructured({
      apiKey,
      model: activeModelUsed,
      systemInstruction: PASS1_SYSTEM_PROMPT,
      userPrompt: procPrompt,
      responseSchema: PROCEDURE_RESPONSE_SCHEMA,
      pdfBase64
    });
    activeModelUsed = usedModel;

    const simpleSteps = (parsed.simpleSteps || []).map((st, idx) => {
      const id = `STEP-${String(idx + 1).padStart(2, '0')}`;
      const localCheck = verifyQuoteDeterministically(st.citation?.verbatimQuote, allSelectedText);
      return {
        id,
        stepNumber: st.stepNumber || idx + 1,
        action: st.action,
        inlineWarnings: st.inlineWarnings || [],
        responsibleRole: st.responsibleRole || 'Not specified in source',
        citation: {
          sectionRef: st.citation?.sectionRef || 'Source Section',
          pageRef: st.citation?.pageRef || 'Page 1',
          verbatimQuote: st.citation?.verbatimQuote || ''
        },
        confidence: st.confidence || 'high',
        flags: {
          isAmbiguous: Boolean(st.flags?.isAmbiguous),
          ambiguityNote: st.flags?.ambiguityNote || '',
          isContradictory: Boolean(st.flags?.isContradictory),
          contradictionNote: st.flags?.contradictionNote || '',
          dependsOnDefinition: Boolean(st.flags?.dependsOnDefinition),
          definitionTerm: st.flags?.definitionTerm || '',
          definitionNote: st.flags?.definitionNote || ''
        },
        verification: {
          status: localCheck.quoteFoundVerbatim && localCheck.withinWordLimit ? 'supported' : 'quote_mismatch',
          quoteFoundVerbatim: localCheck.quoteFoundVerbatim,
          quoteWordCount: localCheck.quoteWordCount,
          aiVerified: false,
          inventedDetailsFound: [],
          verificationNotes: 'Pending Pass 2 AI verification...',
          verifiedAt: new Date().toISOString()
        },
        completed: false,
        operatorNotes: ''
      };
    });

    const complexPhases = (parsed.complexPhases || []).map((phase, pIdx) => ({
      phaseId: `PHASE-${pIdx + 1}`,
      phaseNumber: phase.phaseNumber || pIdx + 1,
      phaseTitle: phase.phaseTitle,
      phaseObjective: phase.phaseObjective,
      steps: (phase.steps || []).map((cst, sIdx) => {
        const id = `CSTEP-${pIdx + 1}.${sIdx + 1}`;
        const localCheck = verifyQuoteDeterministically(cst.citation?.verbatimQuote, allSelectedText);
        return {
          id,
          stepCode: cst.stepCode || `${pIdx + 1}.${sIdx + 1}`,
          action: cst.action,
          responsibleRole: cst.responsibleRole || 'Not specified in source',
          stepPrerequisites: cst.stepPrerequisites || 'Not specified in source',
          decisionPoints: cst.decisionPoints || [],
          stopAndEscalateConditions: cst.stopAndEscalateConditions || [],
          inlineWarnings: cst.inlineWarnings || [],
          citation: {
            sectionRef: cst.citation?.sectionRef || 'Source Section',
            pageRef: cst.citation?.pageRef || 'Page 1',
            verbatimQuote: cst.citation?.verbatimQuote || ''
          },
          confidence: cst.confidence || 'high',
          flags: {
            isAmbiguous: Boolean(cst.flags?.isAmbiguous),
            ambiguityNote: cst.flags?.ambiguityNote || '',
            isContradictory: Boolean(cst.flags?.isContradictory),
            contradictionNote: cst.flags?.contradictionNote || '',
            dependsOnDefinition: Boolean(cst.flags?.dependsOnDefinition),
            definitionTerm: cst.flags?.definitionTerm || '',
            definitionNote: cst.flags?.definitionNote || ''
          },
          verification: {
            status: localCheck.quoteFoundVerbatim && localCheck.withinWordLimit ? 'supported' : 'quote_mismatch',
            quoteFoundVerbatim: localCheck.quoteFoundVerbatim,
            quoteWordCount: localCheck.quoteWordCount,
            aiVerified: false,
            inventedDetailsFound: [],
            verificationNotes: 'Pending Pass 2 AI verification...',
            verifiedAt: new Date().toISOString()
          },
          completed: false,
          operatorNotes: ''
        };
      })
    }));

    const deterministicMermaid = buildDeterministicMermaid(complexPhases);

    procedureOutput = {
      procedureTitle: parsed.procedureTitle || 'Derived Operational Procedure',
      readingLevel,
      prerequisites:
        Array.isArray(parsed.prerequisites) && parsed.prerequisites.length > 0
          ? parsed.prerequisites
          : ['Not specified in source'],
      materialsAndEquipment:
        Array.isArray(parsed.materialsAndEquipment) && parsed.materialsAndEquipment.length > 0
          ? parsed.materialsAndEquipment
          : ['Not specified in source'],
      simpleSteps,
      complexPhases,
      mermaidFlowchart:
        parsed.mermaidFlowchart && parsed.mermaidFlowchart.trim().startsWith('flowchart')
          ? parsed.mermaidFlowchart.trim()
          : deterministicMermaid,
      fallbackMermaidFlowchart: deterministicMermaid
    };
  }

  // PASS 2: Second Adversarial Verification Pass
  onProgress('Pass 2 (Verification): Re-checking every item & step against its cited source text...');

  const itemsForAudit = [
    ...extractedChecklistItems.map((it) => ({
      itemId: it.id,
      kind: 'checklist_item',
      requirementOrAction: it.requirement,
      requirementType: it.requirementType,
      responsibleRole: it.responsibleRole,
      frequencyOrDeadline: it.frequencyOrDeadline,
      evidenceToCheck: it.evidenceToCheck,
      citation: it.citation,
      flags: it.flags
    })),
    ...(procedureOutput?.simpleSteps || []).map((st) => ({
      itemId: st.id,
      kind: 'simple_procedure_step',
      requirementOrAction: st.action,
      responsibleRole: st.responsibleRole,
      inlineWarnings: st.inlineWarnings,
      citation: st.citation,
      flags: st.flags
    })),
    ...(procedureOutput?.complexPhases || []).flatMap((ph) =>
      ph.steps.map((cst) => ({
        itemId: cst.id,
        kind: 'complex_procedure_step',
        requirementOrAction: cst.action,
        responsibleRole: cst.responsibleRole,
        stepPrerequisites: cst.stepPrerequisites,
        decisionPoints: cst.decisionPoints,
        stopAndEscalateConditions: cst.stopAndEscalateConditions,
        citation: cst.citation,
        flags: cst.flags
      }))
    )
  ];

  let omittedSourceRules = [];

  if (itemsForAudit.length > 0) {
    const verificationPrompt = `Audit every item in <CANDIDATE_EXTRACTED_ITEMS> against <SOURCE_TEXT>.
For each itemId, verify:
1. Does the cited verbatimQuote exist in <SOURCE_TEXT> and support the item?
2. Were any numbers, thresholds, roles, deadlines, or requirements invented outside <SOURCE_TEXT>?
3. Did Pass 1 miss any cross-section contradiction, ambiguity, or definition dependency?
4. Were any numbered rules in <SOURCE_TEXT> completely omitted from the checklist?

<SOURCE_TEXT>
${allSelectedText}
</SOURCE_TEXT>

<CANDIDATE_EXTRACTED_ITEMS>
${JSON.stringify(itemsForAudit, null, 2)}
</CANDIDATE_EXTRACTED_ITEMS>`;

    const { parsed: verParsed, usedModel } = await callGeminiStructured({
      apiKey,
      model: activeModelUsed,
      systemInstruction: PASS2_VERIFICATION_SYSTEM_PROMPT,
      userPrompt: verificationPrompt,
      responseSchema: VERIFICATION_PASS_RESPONSE_SCHEMA,
      pdfBase64
    });
    activeModelUsed = usedModel;
    omittedSourceRules = verParsed.omittedSourceRules || [];

    const verMap = new Map((verParsed.verifications || []).map((v) => [v.itemId, v]));

    const applyVerificationToItem = (item) => {
      const v = verMap.get(item.id);
      if (!v) return item;

      const updatedFlags = { ...item.flags };
      if (v.missedContradictionOrAmbiguity && v.missedContradictionOrAmbiguity.trim()) {
        if (/contradict|conflict/i.test(v.missedContradictionOrAmbiguity) && !updatedFlags.isContradictory) {
          updatedFlags.isContradictory = true;
          updatedFlags.contradictionNote = v.missedContradictionOrAmbiguity;
        } else if (!updatedFlags.isAmbiguous) {
          updatedFlags.isAmbiguous = true;
          updatedFlags.ambiguityNote = v.missedContradictionOrAmbiguity;
        }
      }

      const finalStatus =
        !item.verification.quoteFoundVerbatim || !item.verification.withinWordLimit
          ? v.status === 'unsupported'
            ? 'unsupported'
            : 'quote_mismatch'
          : v.status;

      return {
        ...item,
        confidence: v.correctedConfidence || item.confidence,
        flags: updatedFlags,
        verification: {
          ...item.verification,
          status: finalStatus,
          aiVerified: Boolean(v.aiVerified && finalStatus === 'supported'),
          inventedDetailsFound: v.inventedDetailsFound || [],
          verificationNotes: v.verificationNotes || 'Verified against cited source text.',
          verifiedAt: new Date().toISOString()
        }
      };
    };

    for (let i = 0; i < extractedChecklistItems.length; i++) {
      extractedChecklistItems[i] = applyVerificationToItem(extractedChecklistItems[i]);
    }

    if (procedureOutput) {
      procedureOutput.simpleSteps = procedureOutput.simpleSteps.map(applyVerificationToItem);
      procedureOutput.complexPhases = procedureOutput.complexPhases.map((ph) => ({
        ...ph,
        steps: ph.steps.map(applyVerificationToItem)
      }));
    }
  }

  onProgress('');
  return {
    checklistItems: extractedChecklistItems,
    procedureOutput,
    omittedSourceRules,
    usedModel: activeModelUsed
  };
}
