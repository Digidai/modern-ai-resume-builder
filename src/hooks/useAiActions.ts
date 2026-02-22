import { useCallback, useEffect, useState } from 'react';
import { improveText, generateSummary, GeminiError } from '../services/geminiService';

interface UseAiActionsOptions {
  onError: (message: string) => void;
}

interface ImproveFieldInput {
  fieldId: string;
  text: string;
  context: string;
  onUpdate: (value: string) => void;
}

interface GenerateFieldInput {
  fieldId: string;
  generator: () => Promise<string>;
  onUpdate: (value: string) => void;
}

type AiStatusState = 'idle' | 'loading' | 'success' | 'error';

export interface AiStatus {
  state: AiStatusState;
  message: string;
  fieldId?: string;
  updatedAt: number;
}

const getAiErrorMessage = (error: unknown): { message: string } => {
  if (!(error instanceof GeminiError)) {
    return { message: error instanceof Error ? error.message : 'Failed to process AI request.' };
  }

  if (error.code === 'SERVER_KEY_MISSING' || error.code === 'API_KEY_REQUIRED') {
    return { message: 'AI service is not configured on the server. Please contact support.' };
  }

  if (
    error.code === 'CLIENT_TOKEN_REQUIRED' ||
    error.code === 'INVALID_CLIENT_TOKEN' ||
    error.code === 'AUTH_REQUIRED' ||
    error.code === 'INVALID_SESSION_TOKEN' ||
    error.code === 'SESSION_EXPIRED'
  ) {
    return { message: 'AI verification expired. Refresh the page and try again.' };
  }

  return { message: error.message || 'Failed to process AI request.' };
};

export const useAiActions = ({ onError }: UseAiActionsOptions) => {
  const [loadingCounts, setLoadingCounts] = useState<Record<string, number>>({});
  const [aiStatus, setAiStatus] = useState<AiStatus>({
    state: 'idle',
    message: 'AI is ready.',
    updatedAt: Date.now(),
  });

  const startLoading = useCallback((fieldId: string) => {
    setLoadingCounts((previous) => ({
      ...previous,
      [fieldId]: (previous[fieldId] || 0) + 1,
    }));
  }, []);

  const stopLoading = useCallback((fieldId: string) => {
    setLoadingCounts((previous) => {
      const current = previous[fieldId] || 0;
      if (current <= 1) {
        const { [fieldId]: _removed, ...rest } = previous;
        return rest;
      }

      return {
        ...previous,
        [fieldId]: current - 1,
      };
    });
  }, []);

  const isLoadingField = useCallback(
    (fieldId: string): boolean => Boolean(loadingCounts[fieldId]),
    [loadingCounts]
  );

  useEffect(() => {
    // Remove legacy client-side key persistence now that AI keys are server-managed only.
    try {
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('gemini_api_key_remember');
      localStorage.removeItem('ai_data_transfer_consent_v1');
      sessionStorage.removeItem('gemini_api_key_session');
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  const improveField = useCallback(
    ({ fieldId, text, context, onUpdate }: ImproveFieldInput) => {
      void (async () => {
        startLoading(fieldId);
        setAiStatus({
          state: 'loading',
          message: 'Polishing text with AI...',
          fieldId,
          updatedAt: Date.now(),
        });
        try {
          const improved = await improveText(text, context);
          onUpdate(improved);
          setAiStatus({
            state: 'success',
            message: 'Text polished with AI.',
            fieldId,
            updatedAt: Date.now(),
          });
        } catch (error) {
          const details = getAiErrorMessage(error);
          setAiStatus({
            state: 'error',
            message: details.message,
            fieldId,
            updatedAt: Date.now(),
          });
          onError(details.message);
        } finally {
          stopLoading(fieldId);
        }
      })();
    },
    [onError, startLoading, stopLoading]
  );

  const generateField = useCallback(
    ({ fieldId, generator, onUpdate }: GenerateFieldInput) => {
      void (async () => {
        startLoading(fieldId);
        setAiStatus({
          state: 'loading',
          message: 'Generating with AI...',
          fieldId,
          updatedAt: Date.now(),
        });
        try {
          const result = await generator();
          onUpdate(result);
          setAiStatus({
            state: 'success',
            message: 'Content generated with AI.',
            fieldId,
            updatedAt: Date.now(),
          });
        } catch (error) {
          const details = getAiErrorMessage(error);
          setAiStatus({
            state: 'error',
            message: details.message,
            fieldId,
            updatedAt: Date.now(),
          });
          onError(details.message);
        } finally {
          stopLoading(fieldId);
        }
      })();
    },
    [onError, startLoading, stopLoading]
  );

  const generateSummaryField = useCallback(
    async (role: string, skills: string[]) => {
      return generateSummary(role, skills);
    },
    []
  );

  return {
    aiStatus,
    isLoadingField,
    improveField,
    generateField,
    generateSummaryField,
  };
};
