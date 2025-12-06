import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const improveText = async (text: string, context: string = "resume"): Promise<string> => {
  if (!text) return "";
  
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
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text; // Fallback to original
  }
};

export const generateSummary = async (role: string, skills: string[]): Promise<string> => {
  try {
    const prompt = `
      Write a professional resume summary (max 3 sentences) for a ${role}.
      Highlight the following skills: ${skills.join(', ')}.
      The summary should be engaging, modern, and highlight potential value to a company.
      Return ONLY the summary text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Experienced professional dedicated to delivering high-quality results.";
  }
};