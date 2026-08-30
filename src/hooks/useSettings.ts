'use client';

import { useState, useEffect } from 'react';
import type { UserSettings } from '@/lib/sessionManager';

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

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('brainstormin-settings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch {
        // Ignore parse errors, use defaults
      }
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brainstormin-settings', JSON.stringify(updated));
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brainstormin-settings');
    }
  };

  return { settings, updateSettings, resetSettings, isLoaded, providerOptions: PROVIDER_OPTIONS };
}