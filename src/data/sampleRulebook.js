export const SAMPLE_RULEBOOK_META = {
  id: 'crs-2026-04',
  title: 'Regulatory Standard CRS-2026-04: Cryogenic Biobank Specimen Custody & Emergency Purge Operations',
  shortTitle: 'CRS-2026-04 CryoVault Rulebook (2 Pages, 15 Rules)',
  pages: 2,
  totalRules: 15,
  pdfUrl: './samples/crs-2026-04-cryovault-rulebook.pdf',
  txtUrl: './samples/crs-2026-04-cryovault-rulebook.txt',
  groundTruthSummary: {
    definitionsRules: ['Rule 1 (Critical Thermal Excursion)', 'Rule 2 (Qualified Cryo-Custodian)', 'Rule 3 (Immediate Incident Window)'],
    mandatoryRules: ['Rule 1', 'Rule 2', 'Rule 3', 'Rule 4', 'Rule 5', 'Rule 7', 'Rule 8', 'Rule 9', 'Rule 10', 'Rule 11', 'Rule 12', 'Rule 14', 'Rule 15'],
    recommendedRules: ['Rule 6 (should affix secondary barcode labels)', 'Rule 13 (should wipe condensed frost)'],
    ambiguousRules: ['Rule 8 ("at appropriate intervals by suitable personnel whenever ambient humidity conditions warrant attention")'],
    contradictoryRules: ['Rule 5 (retain pressure logs >= 5 years; audit every 30 days) vs. Rule 14 (delete pressure logs older than 18 months; review only every 90 days)'],
    definitionDependentRules: [
      'Rule 4 (depends on Rule 2: Qualified Cryo-Custodian)',
      'Rule 7 (depends on Rule 1: Critical Thermal Excursion & Rule 3: Immediate Incident Window)'
    ],
    unstatedFieldsRules: [
      'Rule 6 (Responsible Role: Not specified in source)',
      'Rule 8 (Exact Frequency & Specific Role: Not specified / ambiguous)',
      'Rule 15 (Responsible Role & Evidence to Check: Not specified in source)'
    ]
  }
};

export const SAMPLE_RULEBOOK_TEXT = `[Page 1]
================================================================================
REGULATORY STANDARD CRS-2026-04
ULTRA-LOW TEMPERATURE BIOBANK SPECIMEN CUSTODY & EMERGENCY PURGE OPERATIONS
Effective Date: November 1, 2026 | Issuing Authority: BioVault Compliance Board
================================================================================

SECTION 1: DEFINITIONS AND INTERPRETATION

Rule 1 (Definition - Critical Thermal Excursion):
For all compliance and operational purposes under this Standard, a "Critical Thermal Excursion" is defined as any event in which an internal cryo-chamber temperature sensor reads warmer than -135°C for more than 4 consecutive minutes.

Rule 2 (Definition - Qualified Cryo-Custodian):
A "Qualified Cryo-Custodian" is defined as a laboratory specialist holding an active Level-2 Cryogenic Safety Certificate verified by the Biosafety Office within the preceding 12 months.

Rule 3 (Definition - Immediate Incident Window):
An "Immediate Incident Window" means a maximum elapsed duration of 15 minutes from the initial audible or digital alarm trigger.

--------------------------------------------------------------------------------
SECTION 2: VAULT CUSTODY, MONITORING & RECORD RETENTION

Rule 4 (Vault Access Control):
Primary Vault A shall only be unlocked after dual-badge authentication performed in person by a Qualified Cryo-Custodian and a second witness, with the access timestamp and badge IDs logged in the Vault Access Register prior to lid unsealing.

Rule 5 (Pressure Log Audit and Retention):
The Quality Assurance Officer must audit electronic chamber pressure logs every 30 calendar days and shall retain all electronic chamber pressure logs in immutable archive storage for a minimum of 5 years.

Rule 6 (Secondary Canister Labeling):
Secondary color-coded barcode labels should be affixed to the exterior neck of containment canisters to assist visual inventory checks during quarterly stocktakes.

Rule 7 (Thermal Excursion Reporting):
Whenever a Critical Thermal Excursion occurs in any operational vault, the on-duty Qualified Cryo-Custodian must complete and submit Deviation Form CV-9 to the Biobank Director within the Immediate Incident Window.

Rule 8 (Manifold Gasket Inspection):
Exterior manifold elastomer gaskets shall be inspected at appropriate intervals by suitable personnel whenever ambient humidity conditions warrant attention, and inspection observations shall be noted as necessary.

[Page 2]
================================================================================
REGULATORY STANDARD CRS-2026-04 (CONTINUED)
PAGE 2 OF 2
================================================================================

SECTION 3: SPECIMEN TRANSFER & EMERGENCY PURGE PROCEDURE

Rule 9 (Pre-Transfer PPE and Instrument Verification):
Before initiating any specimen canister transfer, the Lead Cryo-Operator must don a full-face polycarbonate splash shield and cryogenic thermal gloves rated to -196°C, and must verify that the wall-mounted ambient oxygen monitor displays an active calibration sticker.

Rule 10 (Supply Line Pressure Verification):
To begin the transfer sequence, the Lead Cryo-Operator shall inspect the primary supply line gauge and confirm that manifold pressure measures between 22 psi and 28 psi before opening Primary Transfer Valve V-1.

Rule 11 (Plenum Temperature Decision Gate & Canister Insertion):
Immediately after opening Primary Transfer Valve V-1, the Lead Cryo-Operator must check the digital plenum temperature readout: IF the chamber temperature reads between -150°C and -135°C, the Lead Cryo-Operator must engage the Auxiliary Liquid Nitrogen Boost for 60 seconds and re-verify temperature before lifting the inner frost plug; ELSE IF the chamber temperature reads colder than -150°C, the Lead Cryo-Operator shall lift the inner frost plug immediately and insert the specimen canister within 45 seconds.

Rule 12 (Oxygen Depletion Stop-and-Escalate Protocol):
WARNING - STOP AND ESCALATE: IF the ambient room oxygen monitor drops below 19.5% O2 at any point during vault operations, all personnel must immediately cease specimen handling, pull the Red Manual Emergency Purge Latch, evacuate the vault room within 30 seconds, and escalate directly to the Facility Safety Director before re-entry is permitted.

Rule 13 (Post-Transfer Condensation Wipe-Down):
Following canister insertion and engagement of the mechanical outer lid lock, the Lead Cryo-Operator should wipe condensed frost from the external hinge housing using a dry, lint-free microfiber cloth.

--------------------------------------------------------------------------------
SECTION 4: ARCHIVE PURGE & RELIEF VALVE MAINTENANCE

Rule 14 (Database Storage Purge & Log Review Schedule):
To prevent database storage overflow, the IT Systems Administrator must permanently purge and delete all electronic chamber pressure logs older than 18 months, and electronic chamber pressure logs require review only once every 90 calendar days.

Rule 15 (Auxiliary Relief Valve Cycling):
Mechanical pressure relief valves mounted on Auxiliary Tank B must be manually cycled every 14 calendar days to prevent cryogenic ice-plug seizure.`;
