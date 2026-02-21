import { useCallback, useState } from 'react';
import { improveText, generateSummary, GeminiError } from '../services/geminiService';

const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';
const GEMINI_API_KEY_SESSION_STORAGE_KEY = 'gemini_api_key_session';
const GEMINI_API_KEY_REMEMBER_KEY = 'gemini_api_key_remember';
const AI_CONSENT_STORAGE_KEY = 'ai_data_transfer_consent_v1';

const readStoredApiKey = (): string => {
  try {
    return (
      sessionStorage.getItem(GEMINI_API_KEY_SESSION_STORAGE_KEY) ||
      localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) ||
      ''
    );
  } catch {
    return '';
  }
};

const readRememberApiKey = (): boolean => {
  try {
    if (sessionStorage.getItem(GEMINI_API_KEY_SESSION_STORAGE_KEY)) {
      return false;
    }

    if (localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)) {
      return true;
    }

    return localStorage.getItem(GEMINI_API_KEY_REMEMBER_KEY) === 'true';
  } catch {
    return false;
  }
};

type PendingAiAction = (key?: string) => Promise<void>;

interface UseAiActionsOptions {
  onError: (message: string) => void;
}

interface SaveAiSettingsInput {
  apiKey: string;
  consentGranted: boolean;
  rememberApiKey: boolean;
}

interface ImproveFieldInput {
  fieldId: string;
  text: string;
  context: string;
  onUpdate: (value: string) => void;
}

interface GenerateFieldInput {
  fieldId: string;
  generator: (key?: string) => Promise<string>;
  onUpdate: (value: string) => void;
}

const persistAiSettings = (
  apiKey: string,
  consentGranted: boolean,
  shouldRememberApiKey: boolean
): void => {
  if (apiKey) {
    if (shouldRememberApiKey) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
      sessionStorage.removeItem(GEMINI_API_KEY_SESSION_STORAGE_KEY);
      localStorage.setItem(GEMINI_API_KEY_REMEMBER_KEY, 'true');
    } else {
      sessionStorage.setItem(GEMINI_API_KEY_SESSION_STORAGE_KEY, apiKey);
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
      localStorage.setItem(GEMINI_API_KEY_REMEMBER_KEY, 'false');
    }
  } else {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    sessionStorage.removeItem(GEMINI_API_KEY_SESSION_STORAGE_KEY);
    localStorage.setItem(GEMINI_API_KEY_REMEMBER_KEY, 'false');
  }
  localStorage.setItem(AI_CONSENT_STORAGE_KEY, consentGranted ? 'true' : 'false');
};

export const useAiActions = ({ onError }: UseAiActionsOptions) => {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isApiKeyRequired, setIsApiKeyRequired] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [storedApiKey, setStoredApiKey] = useState(readStoredApiKey);
  const [rememberApiKey, setRememberApiKey] = useState(readRememberApiKey);
  const [hasAiConsent, setHasAiConsent] = useState(() => {
    try {
      return localStorage.getItem(AI_CONSENT_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [pendingAiAction, setPendingAiAction] = useState<PendingAiAction | null>(null);

  const closeAiModal = useCallback(() => {
    setIsApiKeyModalOpen(false);
    setIsApiKeyRequired(false);
    setPendingAiAction(null);
  }, []);

  const handleAiAction = useCallback(
    async (action: PendingAiAction) => {
      if (!hasAiConsent) {
        setIsApiKeyRequired(false);
        setPendingAiAction(() => action);
        setIsApiKeyModalOpen(true);
        return;
      }

      try {
        await action(storedApiKey || undefined);
      } catch (error) {
        if (error instanceof GeminiError && error.code === 'API_KEY_REQUIRED') {
          setIsApiKeyRequired(true);
          setPendingAiAction(() => action);
          setIsApiKeyModalOpen(true);
          return;
        }
        throw error;
      }
    },
    [hasAiConsent, storedApiKey]
  );

  const handleSaveAiSettings = useCallback(
    async (settings: SaveAiSettingsInput) => {
      try {
        persistAiSettings(settings.apiKey, settings.consentGranted, settings.rememberApiKey);
        setStoredApiKey(settings.apiKey);
        setHasAiConsent(settings.consentGranted);
        setRememberApiKey(settings.rememberApiKey);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save AI settings.';
        onError(message);
        throw error;
      }

      const actionToRun = pendingAiAction;
      setPendingAiAction(null);
      setIsApiKeyRequired(false);

      if (!actionToRun) return;

      try {
        await actionToRun(settings.apiKey || undefined);
      } catch (error) {
        if (error instanceof GeminiError && error.code === 'API_KEY_REQUIRED') {
          setIsApiKeyRequired(true);
          setPendingAiAction(() => actionToRun);
          throw error;
        }
        const message = error instanceof Error ? error.message : 'Failed to run AI action';
        onError(message);
      }
    },
    [onError, pendingAiAction]
  );

  const improveField = useCallback(
    ({ fieldId, text, context, onUpdate }: ImproveFieldInput) => {
      void handleAiAction(async (key) => {
        setLoadingField(fieldId);
        try {
          const improved = await improveText(text, context, key);
          onUpdate(improved);
        } catch (error) {
          if (error instanceof GeminiError && error.code === 'API_KEY_REQUIRED') {
            throw error;
          }
          const message = error instanceof Error ? error.message : 'Failed to improve text';
          onError(message);
        } finally {
          setLoadingField(null);
        }
      }).catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to improve text';
        onError(message);
      });
    },
    [handleAiAction, onError]
  );

  const generateField = useCallback(
    ({ fieldId, generator, onUpdate }: GenerateFieldInput) => {
      void handleAiAction(async (key) => {
        setLoadingField(fieldId);
        try {
          const result = await generator(key);
          onUpdate(result);
        } catch (error) {
          if (error instanceof GeminiError && error.code === 'API_KEY_REQUIRED') {
            throw error;
          }
          const message = error instanceof Error ? error.message : 'Failed to generate content';
          onError(message);
        } finally {
          setLoadingField(null);
        }
      }).catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to generate content';
        onError(message);
      });
    },
    [handleAiAction, onError]
  );

  return {
    isApiKeyModalOpen,
    isApiKeyRequired,
    loadingField,
    storedApiKey,
    rememberApiKey,
    hasAiConsent,
    closeAiModal,
    handleSaveAiSettings,
    improveField,
    generateField,
  };
};

export const aiSettingsKeys = {
  GEMINI_API_KEY_STORAGE_KEY,
  GEMINI_API_KEY_SESSION_STORAGE_KEY,
  GEMINI_API_KEY_REMEMBER_KEY,
  AI_CONSENT_STORAGE_KEY,
};
