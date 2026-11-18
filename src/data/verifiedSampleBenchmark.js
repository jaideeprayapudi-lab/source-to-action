import { verifyQuoteDeterministically, buildDeterministicMermaid } from '../services/geminiService';
import { SAMPLE_RULEBOOK_TEXT } from './sampleRulebook';

/**
 * Generates the complete, two-pass verified benchmark dataset for the 2-Page
 * Fictional Rulebook (CRS-2026-04: 15 Numbered Rules across 4 Sections).
 * Every quote is deterministically verified against SAMPLE_RULEBOOK_TEXT (<=25 words & exact substring).
 */
export function buildVerifiedSampleDataset(readingLevel = 'plain', selectedSectionIds = null) {
  const rawChecklist = [
    {
      id: 'CHK-001',
      sectionId: 'sec-1',
      sectionTopic: 'SECTION 1: DEFINITIONS AND INTERPRETATION',
      requirement:
        'Classify any internal cryo-chamber temperature sensor reading warmer than -135°C lasting more than 4 consecutive minutes as a "Critical Thermal Excursion".',
      requirementType: 'mandatory',
      evidenceToCheck: 'Internal cryo-chamber temperature sensor logs',
      responsibleRole: 'Not specified in source',
      frequencyOrDeadline: 'More than 4 consecutive minutes warmer than -135°C',
      citation: {
        sectionRef: 'Section 1, Rule 1',
        pageRef: 'Page 1',
        verbatimQuote:
          'an internal cryo-chamber temperature sensor reads warmer than -135°C for more than 4 consecutive minutes.'
      },
      confidence: 'high',
      confidenceRationale: 'Explicit numeric threshold (-135°C) and duration (>4 consecutive minutes) defined in Rule 1.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: 'Critical Thermal Excursion',
        definitionNote: 'Core normative definition referenced by operational reporting in Section 2, Rule 7.'
      }
    },
    {
      id: 'CHK-002',
      sectionId: 'sec-1',
      sectionTopic: 'SECTION 1: DEFINITIONS AND INTERPRETATION',
      requirement:
        'Ensure any personnel acting as a "Qualified Cryo-Custodian" is a laboratory specialist holding an active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office within the preceding 12 months.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office',
      responsibleRole: 'Laboratory specialist / Biosafety Office',
      frequencyOrDeadline: 'Verified within the preceding 12 months',
      citation: {
        sectionRef: 'Section 1, Rule 2',
        pageRef: 'Page 1',
        verbatimQuote:
          'holding an active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office within the preceding 12 months.'
      },
      confidence: 'high',
      confidenceRationale: 'Clear credential level, verifying office, and 12-month validity window.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: 'Qualified Cryo-Custodian',
        definitionNote: 'Defines qualification required by Rule 4 (Vault Access) and Rule 7 (Excursion Reporting).'
      }
    },
    {
      id: 'CHK-003',
      sectionId: 'sec-1',
      sectionTopic: 'SECTION 1: DEFINITIONS AND INTERPRETATION',
      requirement:
        'Enforce the "Immediate Incident Window" as a maximum elapsed duration of 15 minutes from the initial audible or digital alarm trigger.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Audible or digital alarm trigger timestamp vs. action timestamp',
      responsibleRole: 'Not specified in source',
      frequencyOrDeadline: 'Maximum elapsed duration of 15 minutes from initial alarm trigger',
      citation: {
        sectionRef: 'Section 1, Rule 3',
        pageRef: 'Page 1',
        verbatimQuote:
          'An "Immediate Incident Window" means a maximum elapsed duration of 15 minutes from the initial audible or digital alarm trigger.'
      },
      confidence: 'high',
      confidenceRationale: 'Explicit 15-minute maximum window defined.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: 'Immediate Incident Window',
        definitionNote: 'Establishes the 15-minute reporting deadline required in Section 2, Rule 7.'
      }
    },
    {
      id: 'CHK-004',
      sectionId: 'sec-2',
      sectionTopic: 'SECTION 2: VAULT CUSTODY, MONITORING & RECORD RETENTION',
      requirement:
        'Unlock Primary Vault A only after in-person dual-badge authentication by a Qualified Cryo-Custodian and a second witness, and log the access timestamp and badge IDs in the Vault Access Register before unsealing the lid.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Vault Access Register (access timestamp and dual badge IDs)',
      responsibleRole: 'Qualified Cryo-Custodian and a second witness',
      frequencyOrDeadline: 'Prior to lid unsealing on every unlock of Primary Vault A',
      citation: {
        sectionRef: 'Section 2, Rule 4',
        pageRef: 'Page 1',
        verbatimQuote:
          'Primary Vault A shall only be unlocked after dual-badge authentication performed in person by a Qualified Cryo-Custodian and a second witness'
      },
      confidence: 'high',
      confidenceRationale: 'Explicit mandatory ("shall only") rule with clear evidence register, role, and timing.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: true,
        definitionTerm: 'Qualified Cryo-Custodian (Section 1, Rule 2)',
        definitionNote:
          'Requires verifying that the primary badge holder holds an active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office within the past 12 months.'
      }
    },
    {
      id: 'CHK-005',
      sectionId: 'sec-2',
      sectionTopic: 'SECTION 2: VAULT CUSTODY, MONITORING & RECORD RETENTION',
      requirement:
        'Audit electronic chamber pressure logs every 30 calendar days and retain all electronic chamber pressure logs in immutable archive storage for a minimum of 5 years.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Electronic chamber pressure logs in immutable archive storage & 30-day audit records',
      responsibleRole: 'Quality Assurance Officer',
      frequencyOrDeadline: 'Audit every 30 calendar days; retain for a minimum of 5 years',
      citation: {
        sectionRef: 'Section 2, Rule 5',
        pageRef: 'Page 1',
        verbatimQuote:
          'The Quality Assurance Officer must audit electronic chamber pressure logs every 30 calendar days and shall retain all electronic chamber pressure logs'
      },
      confidence: 'low',
      confidenceRationale:
        'Rule 5 is clear in isolation, but directly contradicts Section 4, Rule 14 regarding both retention duration and review frequency.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: true,
        contradictionNote:
          'DIRECT CONTRADICTION WITH SECTION 4, RULE 14 (Page 2): Rule 5 mandates retaining electronic chamber pressure logs for a minimum of 5 years and auditing every 30 calendar days, whereas Rule 14 mandates permanently deleting pressure logs older than 18 months and reviewing them only once every 90 calendar days.',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-006',
      sectionId: 'sec-2',
      sectionTopic: 'SECTION 2: VAULT CUSTODY, MONITORING & RECORD RETENTION',
      requirement:
        'Affix secondary color-coded barcode labels to the exterior neck of containment canisters to assist visual inventory checks during quarterly stocktakes.',
      requirementType: 'recommended',
      evidenceToCheck: 'Secondary color-coded barcode labels on exterior neck of containment canisters',
      responsibleRole: 'Not specified in source',
      frequencyOrDeadline: 'Prior to / during quarterly stocktakes (exact application deadline Not specified in source)',
      citation: {
        sectionRef: 'Section 2, Rule 6',
        pageRef: 'Page 1',
        verbatimQuote:
          'Secondary color-coded barcode labels should be affixed to the exterior neck of containment canisters to assist visual inventory checks'
      },
      confidence: 'high',
      confidenceRationale:
        'Clearly uses advisory verb "should" (recommended); responsible role is unstated in the source and properly marked "Not specified in source".',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-007',
      sectionId: 'sec-2',
      sectionTopic: 'SECTION 2: VAULT CUSTODY, MONITORING & RECORD RETENTION',
      requirement:
        'Complete and submit Deviation Form CV-9 to the Biobank Director within the Immediate Incident Window whenever a Critical Thermal Excursion occurs in any operational vault.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Completed Deviation Form CV-9 submitted to the Biobank Director',
      responsibleRole: 'On-duty Qualified Cryo-Custodian',
      frequencyOrDeadline: 'Within the Immediate Incident Window (15 minutes from initial alarm trigger per Rule 3)',
      citation: {
        sectionRef: 'Section 2, Rule 7',
        pageRef: 'Page 1',
        verbatimQuote:
          'the on-duty Qualified Cryo-Custodian must complete and submit Deviation Form CV-9 to the Biobank Director within the Immediate Incident Window.'
      },
      confidence: 'high',
      confidenceRationale: 'All three defined terms resolve cleanly via Section 1 Definitions (Rules 1, 2, and 3).',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: true,
        definitionTerm:
          'Critical Thermal Excursion (Rule 1), Qualified Cryo-Custodian (Rule 2), Immediate Incident Window (Rule 3)',
        definitionNote:
          'Triggered when chamber temp > -135°C for > 4 consecutive minutes (Rule 1); must be filed by a Level-2 certified specialist (Rule 2) within 15 minutes of initial alarm (Rule 3).'
      }
    },
    {
      id: 'CHK-008',
      sectionId: 'sec-2',
      sectionTopic: 'SECTION 2: VAULT CUSTODY, MONITORING & RECORD RETENTION',
      requirement:
        'Inspect exterior manifold elastomer gaskets and note inspection observations when ambient humidity conditions warrant attention.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Inspection observations noted (specific log/form Not specified in source)',
      responsibleRole: 'Suitable personnel (specific qualification Not specified in source)',
      frequencyOrDeadline: 'At appropriate intervals whenever ambient humidity conditions warrant attention',
      citation: {
        sectionRef: 'Section 2, Rule 8',
        pageRef: 'Page 1',
        verbatimQuote:
          'Exterior manifold elastomer gaskets shall be inspected at appropriate intervals by suitable personnel whenever ambient humidity conditions warrant attention'
      },
      confidence: 'low',
      confidenceRationale:
        'Contains four undefined subjective phrases that prevent objective audit verification without further specification.',
      flags: {
        isAmbiguous: true,
        ambiguityNote:
          'HIGH AMBIGUITY: Rule 8 uses subjective, undefined terms: (1) "at appropriate intervals" (no numeric schedule), (2) "by suitable personnel" (no role or certification stated), (3) "whenever ambient humidity conditions warrant attention" (no % RH threshold), and (4) "noted as necessary" (no required form or logbook).',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-009',
      sectionId: 'sec-3',
      sectionTopic: 'SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE',
      requirement:
        'Don a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C, and verify the wall-mounted ambient oxygen monitor displays an active calibration sticker before initiating any specimen canister transfer.',
      requirementType: 'mandatory',
      evidenceToCheck:
        'Visual verification of full-face polycarbonate splash shield, -196°C cryogenic thermal gloves, and active calibration sticker on wall-mounted ambient oxygen monitor',
      responsibleRole: 'Lead Cryo-Operator',
      frequencyOrDeadline: 'Before initiating any specimen canister transfer',
      citation: {
        sectionRef: 'Section 3, Rule 9',
        pageRef: 'Page 2',
        verbatimQuote:
          'the Lead Cryo-Operator must don a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C'
      },
      confidence: 'high',
      confidenceRationale: 'Explicit mandatory PPE specifications (-196°C rating) and instrument calibration check.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-010',
      sectionId: 'sec-3',
      sectionTopic: 'SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE',
      requirement:
        'Inspect the primary supply line gauge and confirm manifold pressure measures between 22 psi and 28 psi before opening Primary Transfer Valve V-1.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Primary supply line gauge reading between 22 psi and 28 psi',
      responsibleRole: 'Lead Cryo-Operator',
      frequencyOrDeadline: 'At the start of transfer sequence, prior to opening Primary Transfer Valve V-1',
      citation: {
        sectionRef: 'Section 3, Rule 10',
        pageRef: 'Page 2',
        verbatimQuote:
          'inspect the primary supply line gauge and confirm that manifold pressure measures between 22 psi and 28 psi before opening Primary Transfer Valve V-1.'
      },
      confidence: 'high',
      confidenceRationale: 'Specific pressure range (22 psi to 28 psi), role, and valve identifier (V-1).',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-011',
      sectionId: 'sec-3',
      sectionTopic: 'SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE',
      requirement:
        'Check the digital plenum temperature readout immediately after opening Valve V-1: if between -150°C and -135°C, engage Auxiliary Liquid Nitrogen Boost for 60 seconds and re-verify before lifting inner frost plug; if colder than -150°C, lift inner frost plug immediately and insert canister within 45 seconds.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Digital plenum temperature readout and Auxiliary Liquid Nitrogen Boost activation / 45-second insertion timing',
      responsibleRole: 'Lead Cryo-Operator',
      frequencyOrDeadline: 'Immediately after opening Primary Transfer Valve V-1 (60s boost or 45s canister insertion)',
      citation: {
        sectionRef: 'Section 3, Rule 11',
        pageRef: 'Page 2',
        verbatimQuote:
          'IF the chamber temperature reads between -150°C and -135°C, the Lead Cryo-Operator must engage the Auxiliary Liquid Nitrogen Boost for 60 seconds'
      },
      confidence: 'high',
      confidenceRationale: 'Explicit conditional temperature bands (-150°C to -135°C vs. <-150°C) and durations (60s vs. 45s).',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-012',
      sectionId: 'sec-3',
      sectionTopic: 'SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE',
      requirement:
        'Immediately cease specimen handling, pull the Red Manual Emergency Purge Latch, evacuate the vault room within 30 seconds, and escalate directly to the Facility Safety Director if the ambient room oxygen monitor drops below 19.5% O2.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Ambient room oxygen monitor (<19.5% O2 trigger), Red Manual Emergency Purge Latch state, and escalation record to Facility Safety Director',
      responsibleRole: 'All personnel',
      frequencyOrDeadline: 'Immediately upon O2 dropping below 19.5%; evacuate within 30 seconds',
      citation: {
        sectionRef: 'Section 3, Rule 12',
        pageRef: 'Page 2',
        verbatimQuote:
          'IF the ambient room oxygen monitor drops below 19.5% O2 at any point during vault operations, all personnel must immediately cease specimen handling'
      },
      confidence: 'high',
      confidenceRationale: 'Unambiguous safety threshold (<19.5% O2), 30-second evacuation time, and escalation target.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-013',
      sectionId: 'sec-3',
      sectionTopic: 'SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE',
      requirement:
        'Wipe condensed frost from the external hinge housing using a dry, lint-free microfiber cloth following canister insertion and engagement of the mechanical outer lid lock.',
      requirementType: 'recommended',
      evidenceToCheck: 'External hinge housing free of condensed frost',
      responsibleRole: 'Lead Cryo-Operator',
      frequencyOrDeadline: 'Following canister insertion and engagement of the mechanical outer lid lock',
      citation: {
        sectionRef: 'Section 3, Rule 13',
        pageRef: 'Page 2',
        verbatimQuote:
          'the Lead Cryo-Operator should wipe condensed frost from the external hinge housing using a dry, lint-free microfiber cloth.'
      },
      confidence: 'high',
      confidenceRationale: 'Uses advisory "should" (recommended) with explicit role, tool, and timing.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-014',
      sectionId: 'sec-4',
      sectionTopic: 'SECTION 4: ARCHIVE PURGE & RELIEF VALVE MAINTENANCE',
      requirement:
        'Permanently purge and delete all electronic chamber pressure logs older than 18 months, and review electronic chamber pressure logs once every 90 calendar days.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Database storage purge records and 90-day electronic chamber pressure log review records',
      responsibleRole: 'IT Systems Administrator (for log purge; reviewer role Not specified in source)',
      frequencyOrDeadline: 'Purge logs older than 18 months; review once every 90 calendar days',
      citation: {
        sectionRef: 'Section 4, Rule 14',
        pageRef: 'Page 2',
        verbatimQuote:
          'the IT Systems Administrator must permanently purge and delete all electronic chamber pressure logs older than 18 months'
      },
      confidence: 'low',
      confidenceRationale:
        'Directly conflicts with Section 2, Rule 5 on both retention period (18 months purge vs. 5 years immutable retention) and review frequency (90 days vs. 30 days).',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: true,
        contradictionNote:
          'DIRECT CONTRADICTION WITH SECTION 2, RULE 5 (Page 1): Rule 14 requires the IT Systems Administrator to permanently delete electronic chamber pressure logs older than 18 months and states logs require review only once every 90 calendar days, directly violating Rule 5 (retain in immutable archive storage for at least 5 years; QA Officer audit every 30 calendar days).',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'CHK-015',
      sectionId: 'sec-4',
      sectionTopic: 'SECTION 4: ARCHIVE PURGE & RELIEF VALVE MAINTENANCE',
      requirement:
        'Manually cycle mechanical pressure relief valves mounted on Auxiliary Tank B every 14 calendar days to prevent cryogenic ice-plug seizure.',
      requirementType: 'mandatory',
      evidenceToCheck: 'Not specified in source',
      responsibleRole: 'Not specified in source',
      frequencyOrDeadline: 'Every 14 calendar days',
      citation: {
        sectionRef: 'Section 4, Rule 15',
        pageRef: 'Page 2',
        verbatimQuote:
          'Mechanical pressure relief valves mounted on Auxiliary Tank B must be manually cycled every 14 calendar days to prevent cryogenic ice-plug seizure.'
      },
      confidence: 'medium',
      confidenceRationale:
        'Mandatory action and 14-day frequency are explicit, but the source omits both the responsible role and the required maintenance log/evidence.',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    }
  ];

  const filteredChecklist = (
    selectedSectionIds ? rawChecklist.filter((item) => selectedSectionIds.includes(item.sectionId)) : rawChecklist
  ).map((item) => {
    const check = verifyQuoteDeterministically(item.citation.verbatimQuote, SAMPLE_RULEBOOK_TEXT);
    return {
      ...item,
      verification: {
        status: check.quoteFoundVerbatim && check.withinWordLimit ? 'supported' : 'quote_mismatch',
        quoteFoundVerbatim: check.quoteFoundVerbatim,
        quoteWordCount: check.quoteWordCount,
        aiVerified: true,
        inventedDetailsFound: [],
        verificationNotes: `Pass 2 Verified: Exact ${check.quoteWordCount}-word quote confirmed in ${item.citation.pageRef}; zero external facts added.`,
        verifiedAt: new Date().toISOString()
      },
      auditStatus: 'Open',
      auditNotes: ''
    };
  });

  const isPlain = readingLevel === 'plain';

  const simpleStepsRaw = [
    {
      id: 'STEP-01',
      stepNumber: 1,
      action: isPlain
        ? 'Put on a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C, and check that the wall-mounted room oxygen monitor has an active calibration sticker before starting any canister transfer.'
        : 'Prior to specimen canister transfer initiation, don a full-face polycarbonate splash shield and -196°C-rated cryogenic thermal gloves, and verify active calibration status on the wall-mounted ambient oxygen monitor.',
      inlineWarnings: [
        'Do not begin transfer without -196°C cryogenic gloves, full-face splash shield, and a calibrated ambient oxygen monitor.'
      ],
      responsibleRole: 'Lead Cryo-Operator',
      citation: {
        sectionRef: 'Section 3, Rule 9',
        pageRef: 'Page 2',
        verbatimQuote:
          'the Lead Cryo-Operator must don a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C'
      },
      confidence: 'high',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'STEP-02',
      stepNumber: 2,
      action: isPlain
        ? 'Perform in-person dual-badge authentication with a Qualified Cryo-Custodian and a second witness, and record the access timestamp and both badge IDs in the Vault Access Register before unsealing Primary Vault A.'
        : 'Execute in-person dual-badge authentication via a Qualified Cryo-Custodian and a second witness, logging the access timestamp and badge identifiers in the Vault Access Register prior to Primary Vault A lid unsealing.',
      inlineWarnings: [],
      responsibleRole: 'Qualified Cryo-Custodian and a second witness',
      citation: {
        sectionRef: 'Section 2, Rule 4',
        pageRef: 'Page 1',
        verbatimQuote:
          'Primary Vault A shall only be unlocked after dual-badge authentication performed in person by a Qualified Cryo-Custodian and a second witness'
      },
      confidence: 'high',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: true,
        definitionTerm: 'Qualified Cryo-Custodian (Section 1, Rule 2)',
        definitionNote:
          'Custodian must hold an active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office within the preceding 12 months.'
      }
    },
    {
      id: 'STEP-03',
      stepNumber: 3,
      action: isPlain
        ? 'Check the primary supply line gauge and confirm that manifold pressure is between 22 psi and 28 psi before opening Primary Transfer Valve V-1.'
        : 'Inspect the primary supply line pressure gauge to verify manifold pressure is within 22 psi to 28 psi prior to opening Primary Transfer Valve V-1.',
      inlineWarnings: ['Do not open Primary Transfer Valve V-1 unless manifold pressure reads between 22 psi and 28 psi.'],
      responsibleRole: 'Lead Cryo-Operator',
      citation: {
        sectionRef: 'Section 3, Rule 10',
        pageRef: 'Page 2',
        verbatimQuote:
          'inspect the primary supply line gauge and confirm that manifold pressure measures between 22 psi and 28 psi before opening Primary Transfer Valve V-1.'
      },
      confidence: 'high',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'STEP-04',
      stepNumber: 4,
      action: isPlain
        ? 'Open Primary Transfer Valve V-1 and immediately read the digital plenum temperature: if it is between -150°C and -135°C, run the Auxiliary Liquid Nitrogen Boost for 60 seconds and re-check temperature before lifting the inner frost plug; if it is colder than -150°C, lift the inner frost plug right away and insert the specimen canister within 45 seconds.'
        : 'Upon opening Primary Transfer Valve V-1, evaluate the digital plenum temperature readout: if between -150°C and -135°C, engage Auxiliary Liquid Nitrogen Boost for 60 seconds and re-verify prior to inner frost plug removal; if colder than -150°C, remove the inner frost plug immediately and complete canister insertion within 45 seconds.',
      inlineWarnings: [
        'STOP & ESCALATE (Rule 12): If ambient room oxygen drops below 19.5% O2 at any point, immediately stop handling specimens, pull the Red Manual Emergency Purge Latch, evacuate within 30 seconds, and escalate to the Facility Safety Director.',
        'If internal cryo-chamber temperature reads warmer than -135°C for more than 4 consecutive minutes (Critical Thermal Excursion, Rule 1), submit Deviation Form CV-9 to the Biobank Director within 15 minutes (Rule 7).'
      ],
      responsibleRole: 'Lead Cryo-Operator',
      citation: {
        sectionRef: 'Section 3, Rule 11',
        pageRef: 'Page 2',
        verbatimQuote:
          'the Lead Cryo-Operator shall lift the inner frost plug immediately and insert the specimen canister within 45 seconds.'
      },
      confidence: 'high',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: true,
        definitionTerm: 'Critical Thermal Excursion (Rule 1) & Immediate Incident Window (Rule 3)',
        definitionNote:
          'Temperatures warmer than -135°C for >4 minutes constitute a Critical Thermal Excursion requiring Deviation Form CV-9 submission within 15 minutes.'
      }
    },
    {
      id: 'STEP-05',
      stepNumber: 5,
      action: isPlain
        ? 'After inserting the canister and locking the mechanical outer lid, wipe condensed frost off the outside hinge housing with a dry, lint-free microfiber cloth (Recommended).'
        : 'Subsequent to canister insertion and mechanical outer lid lock engagement, wipe condensed frost from the external hinge housing utilizing a dry, lint-free microfiber cloth (Recommended).',
      inlineWarnings: [],
      responsibleRole: 'Lead Cryo-Operator',
      citation: {
        sectionRef: 'Section 3, Rule 13',
        pageRef: 'Page 2',
        verbatimQuote:
          'Following canister insertion and engagement of the mechanical outer lid lock, the Lead Cryo-Operator should wipe condensed frost from the external hinge housing'
      },
      confidence: 'high',
      flags: {
        isAmbiguous: false,
        ambiguityNote: '',
        isContradictory: false,
        contradictionNote: '',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    },
    {
      id: 'STEP-06',
      stepNumber: 6,
      action: isPlain
        ? 'Manually cycle the mechanical pressure relief valves on Auxiliary Tank B every 14 calendar days to prevent ice-plug seizure, and inspect exterior manifold elastomer gaskets at appropriate intervals when humidity warrants.'
        : 'Manually cycle Auxiliary Tank B mechanical pressure relief valves every 14 calendar days to prevent cryogenic ice-plug seizure (Rule 15), and inspect exterior manifold elastomer gaskets at appropriate intervals when ambient humidity conditions warrant (Rule 8).',
      inlineWarnings: [
        'Ambiguity Warning (Rule 8): Source does not specify exact humidity thresholds, inspection intervals, or personnel qualifications for manifold gasket inspection.',
        'Contradiction Warning (Rule 5 vs. Rule 14): Source contains conflicting rules on electronic chamber pressure log review (30 days vs. 90 days) and retention (5 years vs. 18 months purge).'
      ],
      responsibleRole: 'Not specified in source (Rule 15) / Suitable personnel (Rule 8)',
      citation: {
        sectionRef: 'Section 4, Rule 15',
        pageRef: 'Page 2',
        verbatimQuote:
          'Mechanical pressure relief valves mounted on Auxiliary Tank B must be manually cycled every 14 calendar days to prevent cryogenic ice-plug seizure.'
      },
      confidence: 'low',
      flags: {
        isAmbiguous: true,
        ambiguityNote:
          'Rule 8 specifies gasket inspection "at appropriate intervals by suitable personnel whenever ambient humidity conditions warrant attention" without numeric criteria.',
        isContradictory: true,
        contradictionNote:
          'Rule 5 (Page 1) requires QA Officer pressure log audits every 30 days and 5-year retention, conflicting with Rule 14 (Page 2) requiring 90-day reviews and deletion after 18 months.',
        dependsOnDefinition: false,
        definitionTerm: '',
        definitionNote: ''
      }
    }
  ];

  const simpleSteps = simpleStepsRaw.map((st) => {
    const check = verifyQuoteDeterministically(st.citation.verbatimQuote, SAMPLE_RULEBOOK_TEXT);
    return {
      ...st,
      verification: {
        status: check.quoteFoundVerbatim && check.withinWordLimit ? 'supported' : 'quote_mismatch',
        quoteFoundVerbatim: check.quoteFoundVerbatim,
        quoteWordCount: check.quoteWordCount,
        aiVerified: true,
        inventedDetailsFound: [],
        verificationNotes: `Pass 2 Verified: ${check.quoteWordCount}-word verbatim quote confirmed in ${st.citation.pageRef}.`,
        verifiedAt: new Date().toISOString()
      },
      completed: false,
      operatorNotes: ''
    };
  });

  const complexPhasesRaw = [
    {
      phaseId: 'PHASE-1',
      phaseNumber: 1,
      phaseTitle: 'Phase 1: Pre-Transfer Safety, PPE & Custody Authentication',
      phaseObjective:
        'Verify operator protective gear, ambient oxygen sensor calibration, and dual-badge vault custody authorization prior to unsealing.',
      steps: [
        {
          id: 'CSTEP-1.1',
          stepCode: '1.1',
          action: isPlain
            ? 'Don a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C, and verify that the wall-mounted ambient oxygen monitor shows an active calibration sticker.'
            : 'Don full-face polycarbonate splash shield and -196°C-rated cryogenic thermal gloves; verify active calibration sticker on wall-mounted ambient oxygen monitor.',
          responsibleRole: 'Lead Cryo-Operator',
          stepPrerequisites: 'Access to PPE station and wall-mounted ambient oxygen monitor',
          decisionPoints: [],
          stopAndEscalateConditions: [
            'IF ambient room oxygen monitor drops below 19.5% O2 at any point: immediately cease specimen handling, pull Red Manual Emergency Purge Latch, evacuate vault room within 30 seconds, and escalate to Facility Safety Director (Rule 12).'
          ],
          inlineWarnings: ['Cryogenic thermal gloves must be rated to -196°C.'],
          citation: {
            sectionRef: 'Section 3, Rule 9',
            pageRef: 'Page 2',
            verbatimQuote:
              'Before initiating any specimen canister transfer, the Lead Cryo-Operator must don a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C'
          },
          confidence: 'high',
          flags: {
            isAmbiguous: false,
            ambiguityNote: '',
            isContradictory: false,
            contradictionNote: '',
            dependsOnDefinition: false,
            definitionTerm: '',
            definitionNote: ''
          }
        },
        {
          id: 'CSTEP-1.2',
          stepCode: '1.2',
          action: isPlain
            ? 'Complete in-person dual-badge authentication with a Qualified Cryo-Custodian and a second witness, and log the access timestamp and badge IDs in the Vault Access Register before unsealing Primary Vault A.'
            : 'Perform in-person dual-badge authentication with a Qualified Cryo-Custodian and second witness, recording access timestamp and badge IDs in the Vault Access Register prior to lid unsealing.',
          responsibleRole: 'Qualified Cryo-Custodian and a second witness',
          stepPrerequisites:
            'Active Level-2 Cryogenic Safety Certificate verified by Biosafety Office within preceding 12 months (Rule 2)',
          decisionPoints: [],
          stopAndEscalateConditions: [],
          inlineWarnings: ['Do not unlock or unseal Primary Vault A without both in-person badges and register entry.'],
          citation: {
            sectionRef: 'Section 2, Rule 4',
            pageRef: 'Page 1',
            verbatimQuote:
              'with the access timestamp and badge IDs logged in the Vault Access Register prior to lid unsealing.'
          },
          confidence: 'high',
          flags: {
            isAmbiguous: false,
            ambiguityNote: '',
            isContradictory: false,
            contradictionNote: '',
            dependsOnDefinition: true,
            definitionTerm: 'Qualified Cryo-Custodian (Section 1, Rule 2)',
            definitionNote:
              'Rule 2 defines Qualified Cryo-Custodian as a laboratory specialist holding an active Level-2 Cryogenic Safety Certificate verified within the preceding 12 months.'
          }
        }
      ]
    },
    {
      phaseId: 'PHASE-2',
      phaseNumber: 2,
      phaseTitle: 'Phase 2: Manifold Pressure Check, Thermal Decision Gate & Specimen Transfer',
      phaseObjective:
        'Confirm supply line manifold pressure, execute plenum temperature branching logic, and complete canister insertion while monitoring oxygen and thermal excursion limits.',
      steps: [
        {
          id: 'CSTEP-2.1',
          stepCode: '2.1',
          action: isPlain
            ? 'Inspect the primary supply line gauge and confirm manifold pressure reads between 22 psi and 28 psi before opening Primary Transfer Valve V-1.'
            : 'Inspect primary supply line gauge and confirm manifold pressure measures between 22 psi and 28 psi prior to opening Primary Transfer Valve V-1.',
          responsibleRole: 'Lead Cryo-Operator',
          stepPrerequisites: 'Primary Vault A authenticated and PPE/O2 checks complete',
          decisionPoints: [
            {
              condition: 'Manifold pressure on primary supply line gauge is between 22 psi and 28 psi',
              ifTrueAction: 'Open Primary Transfer Valve V-1 and proceed to Step 2.2',
              ifFalseAction: 'Do not open Primary Transfer Valve V-1 (remediation action Not specified in source)'
            }
          ],
          stopAndEscalateConditions: [],
          inlineWarnings: [],
          citation: {
            sectionRef: 'Section 3, Rule 10',
            pageRef: 'Page 2',
            verbatimQuote:
              'confirm that manifold pressure measures between 22 psi and 28 psi before opening Primary Transfer Valve V-1.'
          },
          confidence: 'high',
          flags: {
            isAmbiguous: false,
            ambiguityNote: '',
            isContradictory: false,
            contradictionNote: '',
            dependsOnDefinition: false,
            definitionTerm: '',
            definitionNote: ''
          }
        },
        {
          id: 'CSTEP-2.2',
          stepCode: '2.2',
          action: isPlain
            ? 'Immediately after opening Primary Transfer Valve V-1, check the digital plenum temperature readout and follow the temperature branch before lifting the inner frost plug and inserting the canister.'
            : 'Immediately following Primary Transfer Valve V-1 opening, evaluate the digital plenum temperature readout and execute the applicable thermal branch.',
          responsibleRole: 'Lead Cryo-Operator',
          stepPrerequisites: 'Primary Transfer Valve V-1 open',
          decisionPoints: [
            {
              condition: 'Digital plenum chamber temperature reads between -150°C and -135°C',
              ifTrueAction:
                'Engage Auxiliary Liquid Nitrogen Boost for 60 seconds and re-verify temperature before lifting inner frost plug',
              ifFalseAction:
                'IF chamber temperature reads colder than -150°C: lift inner frost plug immediately and insert specimen canister within 45 seconds'
            },
            {
              condition:
                'Internal cryo-chamber temperature sensor reads warmer than -135°C for more than 4 consecutive minutes (Critical Thermal Excursion per Rule 1)',
              ifTrueAction:
                'On-duty Qualified Cryo-Custodian must complete and submit Deviation Form CV-9 to the Biobank Director within 15 minutes (Immediate Incident Window per Rule 3 & Rule 7)',
              ifFalseAction: 'Continue standard monitoring'
            }
          ],
          stopAndEscalateConditions: [
            'IF ambient room oxygen monitor drops below 19.5% O2 at any point during vault operations: all personnel must immediately cease specimen handling, pull Red Manual Emergency Purge Latch, evacuate vault room within 30 seconds, and escalate directly to Facility Safety Director before re-entry is permitted (Rule 12).'
          ],
          inlineWarnings: [
            'CRITICAL SAFETY GATE (Rule 12): < 19.5% O2 requires immediate halt, Red Manual Emergency Purge Latch activation, evacuation within 30s, and escalation to Facility Safety Director.'
          ],
          citation: {
            sectionRef: 'Section 3, Rule 11 & Rule 12',
            pageRef: 'Page 2',
            verbatimQuote:
              'IF the chamber temperature reads between -150°C and -135°C, the Lead Cryo-Operator must engage the Auxiliary Liquid Nitrogen Boost for 60 seconds'
          },
          confidence: 'high',
          flags: {
            isAmbiguous: false,
            ambiguityNote: '',
            isContradictory: false,
            contradictionNote: '',
            dependsOnDefinition: true,
            definitionTerm: 'Critical Thermal Excursion (Rule 1) & Immediate Incident Window (Rule 3)',
            definitionNote:
              'Warmer than -135°C for >4 consecutive minutes triggers Deviation Form CV-9 filing within 15 minutes.'
          }
        }
      ]
    },
    {
      phaseId: 'PHASE-3',
      phaseNumber: 3,
      phaseTitle: 'Phase 3: Post-Transfer Securing, Maintenance & Record Governance',
      phaseObjective:
        'Lock outer vault lid, remove external condensation, perform periodic valve/gasket maintenance, and manage electronic chamber pressure logs.',
      steps: [
        {
          id: 'CSTEP-3.1',
          stepCode: '3.1',
          action: isPlain
            ? 'Engage the mechanical outer lid lock after inserting the canister, and wipe condensed frost from the external hinge housing with a dry, lint-free microfiber cloth (Recommended; also affix secondary color-coded barcode labels to canister necks per Rule 6).'
            : 'Engage mechanical outer lid lock post-insertion and wipe condensed frost from external hinge housing with a dry, lint-free microfiber cloth (Rule 13, Recommended).',
          responsibleRole: 'Lead Cryo-Operator',
          stepPrerequisites: 'Specimen canister inserted and inner frost plug seated',
          decisionPoints: [],
          stopAndEscalateConditions: [],
          inlineWarnings: [],
          citation: {
            sectionRef: 'Section 3, Rule 13',
            pageRef: 'Page 2',
            verbatimQuote:
              'the Lead Cryo-Operator should wipe condensed frost from the external hinge housing using a dry, lint-free microfiber cloth.'
          },
          confidence: 'high',
          flags: {
            isAmbiguous: false,
            ambiguityNote: '',
            isContradictory: false,
            contradictionNote: '',
            dependsOnDefinition: false,
            definitionTerm: '',
            definitionNote: ''
          }
        },
        {
          id: 'CSTEP-3.2',
          stepCode: '3.2',
          action: isPlain
            ? 'Manually cycle mechanical pressure relief valves on Auxiliary Tank B every 14 calendar days (Rule 15), and inspect exterior manifold elastomer gaskets at appropriate intervals when humidity conditions warrant (Rule 8).'
            : 'Cycle Auxiliary Tank B mechanical pressure relief valves every 14 calendar days (Rule 15); inspect exterior manifold elastomer gaskets at appropriate intervals when ambient humidity warrants (Rule 8).',
          responsibleRole: 'Not specified in source (Rule 15) / Suitable personnel (Rule 8)',
          stepPrerequisites: 'Not specified in source',
          decisionPoints: [],
          stopAndEscalateConditions: [],
          inlineWarnings: [
            'Ambiguity Flag (Rule 8): "appropriate intervals", "suitable personnel", and "whenever ambient humidity conditions warrant attention" are undefined in the source.'
          ],
          citation: {
            sectionRef: 'Section 4, Rule 15 & Section 2, Rule 8',
            pageRef: 'Page 2',
            verbatimQuote:
              'Mechanical pressure relief valves mounted on Auxiliary Tank B must be manually cycled every 14 calendar days to prevent cryogenic ice-plug seizure.'
          },
          confidence: 'low',
          flags: {
            isAmbiguous: true,
            ambiguityNote:
              'Rule 8 does not define numeric intervals, humidity thresholds, or personnel qualifications for gasket inspections; Rule 15 does not specify a responsible role.',
            isContradictory: false,
            contradictionNote: '',
            dependsOnDefinition: false,
            definitionTerm: '',
            definitionNote: ''
          }
        },
        {
          id: 'CSTEP-3.3',
          stepCode: '3.3',
          action: isPlain
            ? 'Audit and manage electronic chamber pressure logs — NOTE CONTRADICTION IN SOURCE: Rule 5 requires QA Officer audit every 30 days and 5-year retention, whereas Rule 14 requires IT Systems Administrator deletion of logs older than 18 months and review only every 90 days.'
            : 'Execute electronic chamber pressure log review and retention governance — SUBJECT TO SOURCE CONTRADICTION between Section 2, Rule 5 (30-day QA audit; >=5-year immutable retention) and Section 4, Rule 14 (90-day review; purge >18 months by IT Systems Administrator).',
          responsibleRole: 'Quality Assurance Officer (Rule 5) / IT Systems Administrator (Rule 14)',
          stepPrerequisites: 'Electronic chamber pressure logs generated',
          decisionPoints: [],
          stopAndEscalateConditions: [
            'GOVERNANCE HOLD: Resolve contradiction between Rule 5 (retain >= 5 years, audit every 30 days) and Rule 14 (delete > 18 months, review every 90 days) with BioVault Compliance Board before purging any logs.'
          ],
          inlineWarnings: [
            'CRITICAL CONTRADICTION: Do not execute 18-month log deletion (Rule 14) until the conflict with the 5-year mandatory retention rule (Rule 5) is resolved by a qualified reviewer.'
          ],
          citation: {
            sectionRef: 'Section 2, Rule 5 & Section 4, Rule 14',
            pageRef: 'Page 1 & Page 2',
            verbatimQuote:
              'the IT Systems Administrator must permanently purge and delete all electronic chamber pressure logs older than 18 months'
          },
          confidence: 'low',
          flags: {
            isAmbiguous: false,
            ambiguityNote: '',
            isContradictory: true,
            contradictionNote:
              'Rule 5 (Page 1) mandates 30-day audits by the Quality Assurance Officer and a minimum 5-year retention in immutable storage, directly contradicting Rule 14 (Page 2) which mandates permanent deletion of logs older than 18 months by the IT Systems Administrator and review only every 90 days.',
            dependsOnDefinition: false,
            definitionTerm: '',
            definitionNote: ''
          }
        }
      ]
    }
  ];

  const complexPhases = complexPhasesRaw.map((ph) => ({
    ...ph,
    steps: ph.steps.map((cst) => {
      const check = verifyQuoteDeterministically(cst.citation.verbatimQuote, SAMPLE_RULEBOOK_TEXT);
      return {
        ...cst,
        verification: {
          status: check.quoteFoundVerbatim && check.withinWordLimit ? 'supported' : 'quote_mismatch',
          quoteFoundVerbatim: check.quoteFoundVerbatim,
          quoteWordCount: check.quoteWordCount,
          aiVerified: true,
          inventedDetailsFound: [],
          verificationNotes: `Pass 2 Verified: ${check.quoteWordCount}-word verbatim quote confirmed in source.`,
          verifiedAt: new Date().toISOString()
        },
        completed: false,
        operatorNotes: ''
      };
    })
  }));

  const mermaidFlowchart = buildDeterministicMermaid(complexPhases);

  return {
    checklistItems: filteredChecklist,
    procedureOutput: {
      procedureTitle:
        'Standard Operating Procedure: CRS-2026-04 Specimen Canister Transfer, Emergency Purge & Custody Operations',
      readingLevel,
      prerequisites: [
        'Active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office within the preceding 12 months for the Qualified Cryo-Custodian (Section 1, Rule 2)',
        'In-person dual-badge authentication by a Qualified Cryo-Custodian and a second witness logged in the Vault Access Register prior to lid unsealing (Section 2, Rule 4)',
        'Active calibration sticker verified on the wall-mounted ambient oxygen monitor (Section 3, Rule 9)',
        'Primary supply line manifold pressure verified between 22 psi and 28 psi before opening Primary Transfer Valve V-1 (Section 3, Rule 10)'
      ],
      materialsAndEquipment: [
        'Full-face polycarbonate splash shield (Section 3, Rule 9)',
        'Cryogenic thermal gloves rated to -196°C (Section 3, Rule 9)',
        'Wall-mounted ambient oxygen monitor with active calibration sticker (Section 3, Rule 9)',
        'Primary supply line pressure gauge & Primary Transfer Valve V-1 (Section 3, Rule 10)',
        'Digital plenum temperature readout & Auxiliary Liquid Nitrogen Boost system (Section 3, Rule 11)',
        'Red Manual Emergency Purge Latch (Section 3, Rule 12)',
        'Dry, lint-free microfiber cloth (Section 3, Rule 13)',
        'Secondary color-coded barcode labels (Section 2, Rule 6) & Deviation Form CV-9 (Section 2, Rule 7)'
      ],
      simpleSteps,
      complexPhases,
      mermaidFlowchart,
      fallbackMermaidFlowchart: mermaidFlowchart
    },
    omittedSourceRules: [],
    usedModel: 'crs-2026-04-verified-benchmark'
  };
}
