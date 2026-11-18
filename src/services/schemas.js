/**
 * Gemini API Structured JSON Output Schemas (OpenAPI 3.0 subset supported by responseSchema).
 * Note: All nested schemas are inlined directly (no $ref) for 100% compatibility with Gemini generateContent.
 */

export const CITATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sectionRef: {
      type: 'STRING',
      description:
        "Exact section and rule identifier from the source (e.g., 'Section 2, Rule 5'). Never invent section numbers."
    },
    pageRef: {
      type: 'STRING',
      description:
        "Page reference from the '[Page N]' markers in the source (e.g., 'Page 1'). Output 'Not specified in source' only if no page marker exists."
    },
    verbatimQuote: {
      type: 'STRING',
      description:
        'Exact character-for-character verbatim substring copied from the source supporting this item. MUST be 25 words or fewer.'
    }
  },
  required: ['sectionRef', 'pageRef', 'verbatimQuote']
};

export const FLAGS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isAmbiguous: {
      type: 'BOOLEAN',
      description:
        'True if the source uses vague, subjective, or undefined qualifiers (e.g., "appropriate intervals", "suitable personnel", "when conditions warrant", "as necessary").'
    },
    ambiguityNote: {
      type: 'STRING',
      description:
        'Explanation of the ambiguous phrasing in the source and what parameters are left unspecified (or empty string if not ambiguous).'
    },
    isContradictory: {
      type: 'BOOLEAN',
      description:
        'True if this rule conflicts with another rule or statement in the same section or across other sections of the source.'
    },
    contradictionNote: {
      type: 'STRING',
      description:
        'Detailed explanation citing the conflicting rule/section and comparing the incompatible numbers, intervals, or requirements (or empty string if none).'
    },
    dependsOnDefinition: {
      type: 'BOOLEAN',
      description:
        'True if interpreting or auditing this rule requires referencing a term defined in a Definitions section elsewhere in the source.'
    },
    definitionTerm: {
      type: 'STRING',
      description:
        'The exact defined term(s) from the Definitions section that this item depends on (e.g., "Critical Thermal Excursion, Immediate Incident Window"), or empty string.'
    },
    definitionNote: {
      type: 'STRING',
      description:
        'Explanation of how the definition from the source specifies thresholds, qualifications, or timeframes for this item (or empty string).'
    }
  },
  required: [
    'isAmbiguous',
    'ambiguityNote',
    'isContradictory',
    'contradictionNote',
    'dependsOnDefinition',
    'definitionTerm',
    'definitionNote'
  ]
};

export const CHECKLIST_SECTION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sectionTopic: {
      type: 'STRING',
      description: 'Section heading or topic group title from the source.'
    },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          requirement: {
            type: 'STRING',
            description:
              'Concrete, auditable plain-language requirement derived strictly from the source without adding outside knowledge.'
          },
          requirementType: {
            type: 'STRING',
            enum: ['mandatory', 'recommended'],
            description:
              "Use 'mandatory' for binding terms ('shall', 'must', 'required', 'defined as') and 'recommended' for advisory/optional terms ('should', 'may', 'recommended')."
          },
          evidenceToCheck: {
            type: 'STRING',
            description:
              "Specific log, register, form, certificate, label, or physical state mentioned in the source to verify compliance, or 'Not specified in source' if unstated."
          },
          responsibleRole: {
            type: 'STRING',
            description:
              "Exact role or title responsible according to the source, or 'Not specified in source' if the source does not state who performs it."
          },
          frequencyOrDeadline: {
            type: 'STRING',
            description:
              "Exact frequency, retention period, or deadline stated in the source, or 'Not specified in source' if unstated."
          },
          citation: CITATION_SCHEMA,
          confidence: {
            type: 'STRING',
            enum: ['high', 'medium', 'low'],
            description:
              "Confidence level ('high' when unambiguous and complete; 'medium' or 'low' when ambiguous, contradictory, or missing key parameters)."
          },
          confidenceRationale: {
            type: 'STRING',
            description: 'Brief explanation for the assigned confidence level.'
          },
          flags: FLAGS_SCHEMA
        },
        required: [
          'requirement',
          'requirementType',
          'evidenceToCheck',
          'responsibleRole',
          'frequencyOrDeadline',
          'citation',
          'confidence',
          'confidenceRationale',
          'flags'
        ]
      }
    }
  },
  required: ['sectionTopic', 'items']
};

export const PROCEDURE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    procedureTitle: {
      type: 'STRING',
      description: 'Title of the procedure derived from the source.'
    },
    prerequisites: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description:
        "Pre-conditions, certifications, or Dual-Badge/calibration checks explicitly required before starting, or ['Not specified in source']."
    },
    materialsAndEquipment: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description:
        "PPE, tools, gauges, forms, or materials explicitly stated in the source, or ['Not specified in source']."
    },
    simpleSteps: {
      type: 'ARRAY',
      description: 'Ordered Simple Mode steps: one atomic action each, plain language, inline warnings.',
      items: {
        type: 'OBJECT',
        properties: {
          stepNumber: { type: 'INTEGER' },
          action: {
            type: 'STRING',
            description: 'One clear atomic action written at the requested reading level using ONLY source facts.'
          },
          inlineWarnings: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Any warnings, hazards, or critical cautions associated with this step from the source.'
          },
          responsibleRole: {
            type: 'STRING',
            description: "Responsible role stated in the source, or 'Not specified in source'."
          },
          citation: CITATION_SCHEMA,
          confidence: {
            type: 'STRING',
            enum: ['high', 'medium', 'low']
          },
          flags: FLAGS_SCHEMA
        },
        required: [
          'stepNumber',
          'action',
          'inlineWarnings',
          'responsibleRole',
          'citation',
          'confidence',
          'flags'
        ]
      }
    },
    complexPhases: {
      type: 'ARRAY',
      description:
        'Ordered Complex Mode phases containing steps with prerequisites, IF/THEN decision points, roles, and stop-and-escalate conditions.',
      items: {
        type: 'OBJECT',
        properties: {
          phaseNumber: { type: 'INTEGER' },
          phaseTitle: { type: 'STRING' },
          phaseObjective: { type: 'STRING' },
          steps: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                stepCode: {
                  type: 'STRING',
                  description: "Hierarchical step code (e.g., '1.1', '2.1')."
                },
                action: {
                  type: 'STRING',
                  description: 'Step instruction written at the selected reading level using strictly source facts.'
                },
                responsibleRole: {
                  type: 'STRING',
                  description: "Role stated in source or 'Not specified in source'."
                },
                stepPrerequisites: {
                  type: 'STRING',
                  description: "Required prior state or material for this step, or 'Not specified in source'."
                },
                decisionPoints: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      condition: { type: 'STRING', description: 'IF condition stated in the source.' },
                      ifTrueAction: { type: 'STRING', description: 'THEN action stated in the source.' },
                      ifFalseAction: {
                        type: 'STRING',
                        description: "ELSE action stated in the source, or 'Not specified in source'."
                      }
                    },
                    required: ['condition', 'ifTrueAction', 'ifFalseAction']
                  }
                },
                stopAndEscalateConditions: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  description:
                    'Conditions requiring immediate halt, evacuation, emergency purge, or escalation to a director/authority.'
                },
                inlineWarnings: {
                  type: 'ARRAY',
                  items: { type: 'STRING' }
                },
                citation: CITATION_SCHEMA,
                confidence: {
                  type: 'STRING',
                  enum: ['high', 'medium', 'low']
                },
                flags: FLAGS_SCHEMA
              },
              required: [
                'stepCode',
                'action',
                'responsibleRole',
                'stepPrerequisites',
                'decisionPoints',
                'stopAndEscalateConditions',
                'inlineWarnings',
                'citation',
                'confidence',
                'flags'
              ]
            }
          }
        },
        required: ['phaseNumber', 'phaseTitle', 'phaseObjective', 'steps']
      }
    },
    mermaidFlowchart: {
      type: 'STRING',
      description:
        'Valid Mermaid flowchart starting with "flowchart TD" illustrating the procedure phases, steps, IF/THEN decision diamonds, and Stop-and-Escalate terminal nodes. Quote all node labels: A["Step label"].'
    }
  },
  required: [
    'procedureTitle',
    'prerequisites',
    'materialsAndEquipment',
    'simpleSteps',
    'complexPhases',
    'mermaidFlowchart'
  ]
};

export const VERIFICATION_PASS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    verifications: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          itemId: {
            type: 'STRING',
            description: 'The exact ID of the checklist item or procedure step being verified.'
          },
          status: {
            type: 'STRING',
            enum: ['supported', 'partially_supported', 'unsupported', 'quote_mismatch'],
            description:
              "Set 'supported' ONLY if 100% of facts, numbers, roles, and thresholds in the item are present in the source. Set 'unsupported' if any fact was invented."
          },
          aiVerified: {
            type: 'BOOLEAN',
            description: 'True if supported by the source without any invented details.'
          },
          inventedDetailsFound: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description:
              'List any requirements, steps, numbers, roles, or thresholds in the item that do not appear in the source (empty array if none).'
          },
          missedContradictionOrAmbiguity: {
            type: 'STRING',
            description:
              'If Pass 1 missed a contradiction with another section/rule, an ambiguity, or a dependency on a definition elsewhere, describe it here (or empty string).'
          },
          correctedConfidence: {
            type: 'STRING',
            enum: ['high', 'medium', 'low']
          },
          verificationNotes: {
            type: 'STRING',
            description: 'Concise audit note confirming support against the cited text or explaining any issue.'
          }
        },
        required: [
          'itemId',
          'status',
          'aiVerified',
          'inventedDetailsFound',
          'missedContradictionOrAmbiguity',
          'correctedConfidence',
          'verificationNotes'
        ]
      }
    },
    omittedSourceRules: {
      type: 'ARRAY',
      description:
        'List any numbered rules or procedural requirements in the selected source sections that were completely missed by Pass 1 (empty array if all rules were covered).',
      items: {
        type: 'OBJECT',
        properties: {
          sectionRef: { type: 'STRING' },
          verbatimQuote: { type: 'STRING' },
          description: { type: 'STRING' }
        },
        required: ['sectionRef', 'verbatimQuote', 'description']
      }
    }
  },
  required: ['verifications', 'omittedSourceRules']
};
