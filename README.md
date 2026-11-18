# Source-to-Action

**Turn regulatory rulebooks, guidelines, standards, and textbook chapters into cited, auditable Compliance Checklists and Step-by-Step Procedures — with two-pass AI verification and human governance sign-off.**

- **Live App (GitHub Pages):** [https://jaideeprayapudi-lab.github.io/source-to-action/](https://jaideeprayapudi-lab.github.io/source-to-action/)

---

## How to Use

1. **Open the App & Configure Your Runtime Gemini API Key:**
   - Visit [https://jaideeprayapudi-lab.github.io/source-to-action/](https://jaideeprayapudi-lab.github.io/source-to-action/) (or run `npm run dev` locally).
   - Paste your Google AI Studio Gemini API key into the **Gemini API Key** field at the top. The key is held in volatile browser RAM only (never stored in `localStorage`, cookies, or URLs, and sent solely via the `x-goog-api-key` HTTP header).
   - Select a Gemini model (`gemini-4-hydrogen`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, etc.) and optionally click **Verify Key** to query the models enabled on your account.
   - *(Tip: You can also explore the pre-loaded 2-page fictional rulebook benchmark immediately without an API key.)*
2. **Supply Your Source Document & Select Sections:**
   - Choose **Built-In 2-Page Test Rulebook (`CRS-2026-04`)**, **Paste / Edit Source Text**, or **Upload PDF / TXT**.
   - Inspect the automatically detected sections and page numbers. Check or uncheck sections to include, and verify that any Definitions/Glossary section is marked **Pinned Definitions Context**.
3. **Run Two-Pass Extraction & Verification:**
   - Choose whether to generate **Both Checklist & Step-by-Step Procedure**, **Checklist Only**, or **Procedure Only**, and pick a procedure reading level (**Plain Language** or **Professional / Technical**).
   - Click **Extract & Verify**. Pass 1 extracts structured JSON section by section; Pass 2 re-checks every item and step against its cited verbatim quote ($\le 25$ words) and flags any unsupported details, ambiguities, contradictions, or definition dependencies.
4. **Audit, Step Through, Approve & Export:**
   - **Compliance Checklist Mode:** Search and filter by section, mandatory/recommended type, confidence, flags, or audit status. Update each item's status (`Open` / `Met` / `Not met` / `N/A`), add auditor notes, click **Highlight in Source** on any citation, or edit/add/delete items.
   - **Step-by-Step Procedure Mode:** Toggle between **Simple Mode** (numbered atomic steps with inline warnings) and **Complex Mode** (phases, prerequisites, materials, `IF/THEN/ELSE` decision gates, crimson Stop-and-Escalate conditions, and an interactive **Mermaid Flowchart**). Switch to **Step-Through View** for large-text, one-step-at-a-time execution with completion checkboxes.
   - **Human Sign-Off:** Click **Mark Approved…** in the top banner to record reviewer name, qualification, and attestation (any subsequent edit automatically reverts the status to **Draft**).
   - **Export:** Click **Print / PDF**, **Export CSV (Checklist)**, or **Export Markdown (Procedure)** to download outputs with full citations included.

---

## Core Governance & Non-Negotiable AI Rules

1. **Closed-World Source Only:** Uses *only* the supplied source document. Never adds requirements, steps, numbers, temperatures, durations, PPE, or thresholds from external general knowledge.
2. **Literal Fallback (`"Not specified in source"`):** Whenever a responsible role, frequency/deadline, prerequisite, or evidence artifact is not stated in the source text, the system outputs `"Not specified in source"` instead of guessing.
3. **Mandatory Verbatim Citations ($\le 25$ Words):** Every checklist item and every procedure step includes a section reference, page reference (`Page N`), and an exact character-for-character verbatim quote of at most **25 words**.
4. **Confidence & Risk Flagging:** Every item is assigned a confidence level (`HIGH`, `MEDIUM`, `LOW`) and explicitly flags:
   - **Ambiguities** (e.g., *"at appropriate intervals"*, *"by suitable personnel"*, *"whenever conditions warrant"*)
   - **Contradictions** (e.g., conflicting retention durations or audit schedules across sections/pages)
   - **Definition Dependencies** (rules whose thresholds, roles, or deadlines depend on terms defined in a Definitions section elsewhere)
5. **Two-Pass Verification Pipeline:**
   - **Pass 1 (Generation):** Structured JSON extraction (`responseMimeType: "application/json"` + `responseSchema`) executed section-by-section while pinning Global Definitions Context.
   - **Pass 2A (Deterministic Client-Side Verifier):** Checks every `verbatimQuote` for exact substring presence in the source document and enforces the $\le 25$-word limit.
   - **Pass 2B (Adversarial AI Auditor Pass):** Re-checks every generated item and step against its cited text and the selected source text to flag any unsupported details, missed cross-section contradictions, or omitted rules.
6. **Mandatory Human Review Gate:** All output displays a persistent **`Draft — Requires Qualified Review`** banner until a human reviewer enters their name and qualification to sign off. Any subsequent edit, addition, deletion, or regeneration automatically reverts the status back to **Draft**.

---

## Built-In 2-Page Test Rulebook (`CRS-2026-04`) & Evaluation Summary

Located at `public/samples/crs-2026-04-cryovault-rulebook.pdf` and `.txt` (**2 Pages, 4 Sections, 15 Numbered Rules**):

| Test Dimension | Source Ground Truth (`CRS-2026-04`) | Extraction & Pass 2 Verification Outcome |
| :--- | :--- | :--- |
| **Definitions Section** | Section 1, Rules 1–3 (*Critical Thermal Excursion*, *Qualified Cryo-Custodian*, *Immediate Incident Window*) | Auto-detected and pinned as Global Definitions Context; Rules 4 and 7 linked with `dependsOnDefinition: true` and exact threshold/certificate notes. |
| **Mandatory vs. Optional** | 13 Mandatory rules (`shall`, `must`, `defined as`) + 2 Recommended rules (Rule 6 & Rule 13: `should`) | 13/13 classified `mandatory`; Rule 6 and Rule 13 classified `recommended`. |
| **Unstated Fields Policy** | Rule 6 omits Role; Rule 15 omits Role and Evidence to Check | Output literal `"Not specified in source"` for unstated fields; zero hallucinated roles or forms. |
| **Ambiguity Detection** | Rule 8 (*"inspected at appropriate intervals by suitable personnel whenever ambient humidity conditions warrant attention"*) | Flagged `isAmbiguous: true` with `confidence: low` and detailed breakdown of all 4 undefined qualifiers. |
| **Contradiction Detection** | Rule 5 (Page 1: retain pressure logs $\ge 5$ years; QA audit every 30 days) vs. Rule 14 (Page 2: delete logs $> 18$ months; review every 90 days) | Both CHK-005 and CHK-014 flagged `isContradictory: true` (`confidence: low`) with cross-page citations and a Governance Hold warning in Complex Procedure Step 3.3. |
| **Verbatim Citations ($\le 25$w)** | 15 Checklist items + 6 Simple steps + 7 Complex steps (28 total citations) | Pass 2A deterministic verifier caught 1 initial quote (`STEP-04`) at 27 words ($>25$w limit), which was trimmed to 18 words; 28/28 verified verbatim substrings ($\le 25$ words). |
| **PDF.js vs. Multimodal PDF** | Tested on 2-page `crs-2026-04-cryovault-rulebook.pdf` | Client-side `pdfjs-dist` preserved 100% of text and exact `[Page 1]` / `[Page 2]` boundaries while enabling pre-API section selection and deterministic substring matching. |

---

## Local Development & Build

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build static production bundle
npm run build
```
