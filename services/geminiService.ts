
import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { GenerateContentPart, CsvTableData } from "../types";

// Ensure API_KEY is available in the environment
if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable is not set. Gemini API calls may fail.");
}

// Global instance for now, but in a more complex app, might be passed via context or factory.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const TEXT_MODEL = 'gemini-2.5-flash';
const MULTIMODAL_MODEL = 'gemini-2.5-flash'; // Same model for image and text

interface StreamConfig {
  systemInstruction?: string;
  maxOutputTokens?: number;
  thinkingConfig?: { thinkingBudget?: number };
}

export const geminiService = {
  async sendMessageStream(
    parts: GenerateContentPart[],
    config: StreamConfig = {}
  ): Promise<AsyncIterable<GenerateContentResponse>> {
    const modelParts: Part[] = parts.map(part => {
      if (part.text) return { text: part.text };
      if (part.inlineData) return { inlineData: part.inlineData };
      return {};
    });

    try {
      const response = await ai.models.generateContentStream({
        model: MULTIMODAL_MODEL, // Use multimodal for any parts
        contents: { parts: modelParts },
        config: {
          systemInstruction: config.systemInstruction,
          maxOutputTokens: config.maxOutputTokens,
          thinkingConfig: config.thinkingConfig,
        },
      });
      return response;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Failed to get response from Gemini API.");
    }
  },

  async sendCsvContextMessage(
    prompt: string,
    csvContext: CsvTableData
  ): Promise<GenerateContentResponse> {
    const csvContentString = `CSV Data:\nHeaders: ${csvContext.headers.join(', ')}\nRows: ${csvContext.rows.map(row => row.join(', ')).join('\n')}`;

    const fullPrompt = `Here is some CSV data:\n\n${csvContentString}\n\nBased on this data, ${prompt}`;

    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: fullPrompt,
        config: {
          systemInstruction: 'You are an AI assistant specialized in analyzing CSV data. Provide clear and concise answers based on the provided CSV context. If asked to summarize or provide stats, do so concisely.',
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 256 },
        }
      });
      return response;
    } catch (error) {
      console.error("Error calling Gemini API for CSV context:", error);
      throw new Error("Failed to get CSV analysis from Gemini API.");
    }
  },

  async sendSearchQuery(prompt: string): Promise<GenerateContentResponse> {
    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return response;
    } catch (error) {
      console.error("Error calling Gemini API with Google Search:", error);
      throw new Error("Failed to get search results from Gemini API.");
    }
  },

  async sendMapsQuery(prompt: string, latitude: number, longitude: number): Promise<GenerateContentResponse> {
    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude,
                longitude,
              },
            },
          },
        },
      });
      return response;
    } catch (error) {
      console.error("Error calling Gemini API with Google Maps:", error);
      throw new Error("Failed to get maps results from Gemini API.");
    }
  },
};
