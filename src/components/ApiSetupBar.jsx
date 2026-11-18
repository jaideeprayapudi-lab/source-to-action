import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, RefreshCw, ShieldCheck, Trash2, Sparkles } from 'lucide-react';

export const DEFAULT_GEMINI_MODELS = [
  {
    id: 'gemini-4-hydrogen',
    label: 'gemini-4-hydrogen — Gemini 4 Hydrogen (Recommended Default, Fast & Low Fabrication)'
  },
  {
    id: 'gemini-3.8-flash',
    label: 'gemini-3.8-flash — Gemini 3.8 Flash (Stable Enterprise Flash)'
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'gemini-3.5-flash-lite — Gemini 3.5 Flash-Lite (Fastest, Replaces 2.5 Flash)'
  },
  {
    id: 'gemini-3.6-flash',
    label: 'gemini-3.6-flash — Gemini 3.6 Flash (Stable Multimodal/PDF)'
  },
  {
    id: 'gemini-4-argon',
    label: 'gemini-4-argon — Gemini 4 Argon (Deep Frontier Reasoning)'
  },
  {
    id: 'gemini-4-carbon',
    label: 'gemini-4-carbon — Gemini 4 Carbon (Maximum Reasoning Depth)'
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'gemini-2.5-flash-lite — Gemini 2.5 Flash-Lite (Legacy Compatible)'
  }
];

export default function ApiSetupBar({
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  onClearSession
}) {
  const [showKey, setShowKey] = useState(false);
  const [availableModels, setAvailableModels] = useState(DEFAULT_GEMINI_MODELS);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelStatusMsg, setModelStatusMsg] = useState('');

  async function handleFetchAvailableModels() {
    if (!apiKey || !apiKey.trim()) {
      setModelStatusMsg('Paste your Gemini API key in memory first to query available models.');
      return;
    }
    setFetchingModels(true);
    setModelStatusMsg('Checking models enabled for your API key...');
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: {
          'x-goog-api-key': apiKey.trim()
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const generateModels = (data.models || [])
        .filter(
          (m) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes('generateContent') &&
            m.name.includes('gemini')
        )
        .map((m) => {
          const shortId = m.name.replace(/^models\//, '');
          return {
            id: shortId,
            label: `${shortId} — ${m.displayName || shortId}`
          };
        });

      if (generateModels.length > 0) {
        // Merge curated defaults with live discovered models
        const seen = new Set();
        const merged = [];
        for (const item of [...DEFAULT_GEMINI_MODELS, ...generateModels]) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        setAvailableModels(merged);
        setModelStatusMsg(`Verified key (${generateModels.length} Gemini models available).`);
      } else {
        setModelStatusMsg('Key verified, using default model list.');
      }
    } catch (err) {
      setModelStatusMsg(`Could not list models (${err.message}). Check your API key.`);
    } finally {
      setFetchingModels(false);
    }
  }

  return (
    <div className="api-setup-bar" role="region" aria-label="Gemini API configuration and privacy notice">
      <div className="api-controls-row">
        <div className="field-group" style={{ flex: '1.3' }}>
          <label className="field-label" htmlFor="gemini-api-key-input">
            <KeyRound size={15} />
            Gemini API Key (Held in Browser RAM Only — Never Stored or Logged)
          </label>
          <div className="input-with-button">
            <input
              id="gemini-api-key-input"
              type={showKey ? 'text' : 'password'}
              className="text-input"
              placeholder="Paste your Google AI Studio API key (AIza...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            <button
              id="btn-toggle-key-visibility"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKey((prev) => !prev)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              title={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="field-group" style={{ flex: '1.2' }}>
          <label className="field-label" htmlFor="gemini-model-select">
            <Sparkles size={15} />
            Gemini Model ID (Structured JSON Output)
          </label>
          <div className="input-with-button">
            <select
              id="gemini-model-select"
              className="select-input"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              id="btn-verify-key-models"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFetchAvailableModels}
              disabled={fetchingModels}
              title="Verify API key and fetch available Gemini models from Google AI Studio"
            >
              <RefreshCw size={15} className={fetchingModels ? 'spin' : ''} />
              {fetchingModels ? 'Checking…' : 'Verify Key'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="btn-clear-session"
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onClearSession}
            title="Immediately wipe API key, source document, and generated items from memory"
          >
            <Trash2 size={15} />
            Clear Memory Session
          </button>
        </div>
      </div>

      <div className="privacy-disclosure">
        <div className="privacy-disclosure-text">
          <ShieldCheck size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
          <span>
            <strong>Privacy & Data Notice:</strong> Selected document text is sent directly from your browser to the{' '}
            <strong>Google Gemini API</strong> (<code>generativelanguage.googleapis.com</code>) for extraction and
            verification. No backend is used, and nothing is saved to disk, cookies, or browser storage beyond this memory
            session.
          </span>
        </div>
        {modelStatusMsg && (
          <span
            id="api-key-status-msg"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-blue)' }}
          >
            {modelStatusMsg}
          </span>
        )}
      </div>
    </div>
  );
}
