import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = (key?: string) => {
  return key || import.meta.env.VITE_GEMINI_API_KEY || "";
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 30000;

class GeminiError extends Error {
  constructor(message: string, public readonly isRetryable: boolean = false) {
    super(message);
    this.name = 'GeminiError';
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new GeminiError('Request timed out. Please try again.', true)), ms)
    )
  ]);
};

const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await withTimeout(operation(), TIMEOUT_MS);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isRetryable = error instanceof GeminiError ? error.isRetryable : true;
      const isLastAttempt = attempt === retries;
      
      if (!isRetryable || isLastAttempt) {
        break;
      }
      
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  
  throw lastError || new GeminiError('Unknown error occurred');
};

export const improveText = async (
  text: string, 
  context: string = "resume", 
  apiKey?: string
): Promise<string> => {
  if (!text) return "";

  const key = getApiKey(apiKey);
  if (!key) {
    throw new GeminiError("API Key is missing. Please add your Gemini API key.", false);
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `
    You are an expert resume writer and career coach. 
    Please rewrite the following text to be more professional, concise, and impactful.
    Use active verbs and quantifiable metrics where possible.
    Keep the tone modern and professional.
    
    Context: ${context} section of a resume.
    
    Original Text:
    "${text}"
    
    Return ONLY the improved text, no explanations or quotes.
  `;

  return executeWithRetry(async () => {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedText = response.text();
    if (!improvedText) {
      throw new GeminiError('No response generated from AI', false);
    }
    return improvedText.trim() || text;
  });
};

export const generateSummary = async (
  role: string, 
  skills: string[], 
  apiKey?: string
): Promise<string> => {
  const key = getApiKey(apiKey);
  if (!key) {
    throw new GeminiError("API Key is missing. Please add your Gemini API key.", false);
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `
    Write a professional resume summary (max 3 sentences) for a ${role}.
    Highlight the following skills: ${skills.join(', ')}.
    The summary should be engaging, modern, and highlight potential value to a company.
    Return ONLY the summary text.
  `;

  return executeWithRetry(async () => {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    if (!text) {
      throw new GeminiError('Failed to generate summary', false);
    }
    return text.trim();
  });
};
