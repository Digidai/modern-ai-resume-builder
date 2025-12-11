import { GoogleGenAI } from "@google/genai";

// Helper to get the API key from env or passed argument
const getApiKey = (key?: string) => {
  return key || (import.meta as any).env.VITE_GEMINI_API_KEY || "";
};

export const improveText = async (text: string, context: string = "resume", apiKey?: string): Promise<string> => {
  if (!text) return "";

  const key = getApiKey(apiKey);
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  try {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateSummary = async (role: string, skills: string[], apiKey?: string): Promise<string> => {
  const key = getApiKey(apiKey);
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  try {
    const prompt = `
      Write a professional resume summary (max 3 sentences) for a ${role}.
      Highlight the following skills: ${skills.join(', ')}.
      The summary should be engaging, modern, and highlight potential value to a company.
      Return ONLY the summary text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};