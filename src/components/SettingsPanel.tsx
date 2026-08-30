'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import type { UserSettings } from '@/lib/sessionManager';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  provider: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: '',
  model: 'grok-4-1-fast-reasoning',
};

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, resetSettings, providerOptions } = useSettings();
  const [provider, setProvider] = useState(settings.provider);
  const [baseURL, setBaseURL] = useState(settings.baseURL);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserSettings, string>>>({});

  const handleProviderChange = (newProvider: UserSettings['provider']) => {
    setProvider(newProvider);
    const option = providerOptions.find((p) => p.value === newProvider);
    if (option) {
      setBaseURL(option.baseURL);
      setModel(option.defaultModel);
    }
    setErrors({});
  };

  const handleSave = () => {
    // Validate
    const newErrors: Partial<Record<keyof UserSettings, string>> = {};
    if (!baseURL.trim()) newErrors.baseURL = 'Base URL is required';
    if (!apiKey.trim()) newErrors.apiKey = 'API key is required';
    if (!model.trim()) newErrors.model = 'Model name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateSettings({ provider, baseURL, apiKey, model });
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setProvider(DEFAULT_SETTINGS.provider);
    setBaseURL(DEFAULT_SETTINGS.baseURL);
    setApiKey(DEFAULT_SETTINGS.apiKey);
    setModel(DEFAULT_SETTINGS.model);
    setErrors({});
  };

  const currentProvider = providerOptions.find((p) => p.value === provider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose} 
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        role="button"
        tabIndex={0}
        aria-label="Close settings"
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AI Provider Settings</h2>
          <button
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Provider Selector */}
          <div>
            <label htmlFor="provider-select" className="block text-sm font-semibold text-gray-700 mb-2">
              Provider
            </label>
            <select
              id="provider-select"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as UserSettings['provider'])}
              className="w-full p-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            >
              {providerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Base URL */}
          <div>
            <label htmlFor="base-url" className="block text-sm font-semibold text-gray-700 mb-2">
              Base URL <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="base-url"
              type="url"
              value={baseURL}
              onChange={(e) => { setBaseURL(e.target.value); setErrors({...errors, baseURL: ''}); }}
              placeholder="https://api.example.com/v1"
              className={`w-full p-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${errors.baseURL ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={provider !== 'custom'}
            />
            {errors.baseURL && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.baseURL}</p>
            )}
            {provider !== 'custom' && (
              <p className="mt-1 text-sm text-gray-500">Managed by provider selection</p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label htmlFor="api-key" className="block text-sm font-semibold text-gray-700 mb-2">
              API Key <span className="text-red-500" aria-label="required">*</span>
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setErrors({...errors, apiKey: ''}); }}
                placeholder="sk-... or your API key"
                className={`w-full p-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-12 ${errors.apiKey ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowKey(!showKey); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                tabIndex={0}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.apiKey && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.apiKey}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Your API key is stored locally in your browser only. Never sent to our servers.
            </p>
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model-name" className="block text-sm font-semibold text-gray-700 mb-2">
              Model Name <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="model-name"
              type="text"
              value={model}
              onChange={(e) => { setModel(e.target.value); setErrors({...errors, model: ''}); }}
              placeholder={currentProvider?.defaultModel || 'e.g., gpt-4o, claude-3-5-sonnet'}
              className={`w-full p-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${errors.model ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.model && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.model}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Must match an available model for your selected provider
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition"
            >
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="flex-1 border-2 border-gray-300 text-gray-700 p-3 rounded-xl font-bold hover:border-gray-400 hover:bg-gray-50 transition"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}