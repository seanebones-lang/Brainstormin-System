'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import type { UserSettings } from '@/lib/sessionManager';
import ThemeToggle from '@/components/ThemeToggle';

const DEFAULT_SETTINGS: UserSettings = {
  provider: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: '',
  model: 'grok-4-1-fast-reasoning',
};

const PROVIDER_OPTIONS = [
  { value: 'xai', label: 'xAI (Grok)', baseURL: 'https://api.x.ai/v1', defaultModel: 'grok-4-1-fast-reasoning' },
  { value: 'openai', label: 'OpenAI', baseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic', baseURL: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-5-sonnet-20241022' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', baseURL: '', defaultModel: '' },
] as const;

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [provider, setProvider] = useState(settings.provider);
  const [baseURL, setBaseURL] = useState(settings.baseURL);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserSettings, string>>>({});
  const [saved, setSaved] = useState(false);

  const handleProviderChange = (newProvider: UserSettings['provider']) => {
    setProvider(newProvider);
    const option = PROVIDER_OPTIONS.find((p) => p.value === newProvider);
    if (option) {
      setBaseURL(option.baseURL);
      setModel(option.defaultModel);
    }
    setErrors({});
  };

  const handleSave = () => {
    const newErrors: Partial<Record<keyof UserSettings, string>> = {};
    if (!baseURL.trim()) newErrors.baseURL = 'Base URL is required';
    if (!apiKey.trim()) newErrors.apiKey = 'API key is required';
    if (!model.trim()) newErrors.model = 'Model name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateSettings({ provider, baseURL, apiKey, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setProvider(DEFAULT_SETTINGS.provider);
    setBaseURL(DEFAULT_SETTINGS.baseURL);
    setApiKey(DEFAULT_SETTINGS.apiKey);
    setModel(DEFAULT_SETTINGS.model);
    setErrors({});
  };

  const currentProvider = PROVIDER_OPTIONS.find((p) => p.value === provider);

  return (
    <div className="min-h-screen bg-gradient-theme p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
              aria-label="Back to dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="space-y-6">
            {/* Provider Selector */}
            <div>
              <label htmlFor="provider-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                id="provider-select"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as UserSettings['provider'])}
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Base URL */}
            <div>
              <label htmlFor="base-url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Base URL <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="base-url"
                type="url"
                value={baseURL}
                onChange={(e) => { setBaseURL(e.target.value); setErrors({...errors, baseURL: ''}); }}
                placeholder="https://api.example.com/v1"
                className={`w-full p-3 border-2 rounded-xl text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                  errors.baseURL ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={provider !== 'custom'}
              />
              {errors.baseURL && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.baseURL}</p>
              )}
              {provider !== 'custom' && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Managed by provider selection</p>
              )}
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="api-key" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                API Key <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setErrors({...errors, apiKey: ''}); }}
                  placeholder="sk-... or your API key"
                  className={`w-full p-3 border-2 rounded-xl text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-12 ${
                    errors.apiKey ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowKey(!showKey); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  tabIndex={0}
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.apiKey && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.apiKey}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your API key is stored locally in your browser only. Never sent to our servers.
              </p>
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Model Name <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="model-name"
                type="text"
                value={model}
                onChange={(e) => { setModel(e.target.value); setErrors({...errors, model: ''}); }}
                placeholder={currentProvider?.defaultModel || 'e.g., gpt-4o, claude-3-5-sonnet'}
                className={`w-full p-3 border-2 rounded-xl text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                  errors.model ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.model}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Must match an available model for your selected provider
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition"
              >
                {saved ? 'Saved ✓' : 'Save Settings'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-xl font-bold hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Reset to Defaults
              </button>
            </div>

            {/* Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">About This App</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Fully open source — <a href="https://github.com/seanebones-lang/Brainstormin-System" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">GitHub</a></li>
                <li>• No login, no signup, no billing</li>
                <li>• Bring your own API key (any OpenAI-compatible provider)</li>
                <li>• All data stored locally in your browser</li>
                <li>• PWA support — install as an app</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}