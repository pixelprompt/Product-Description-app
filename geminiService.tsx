
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, ProductMetadata, FullListing, CrossPlatformResearch, MatchResult } from './types';

export class GeminiService {
  private static getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found in environment.");
    return new GoogleGenAI({ apiKey });
  }

  static async analyzeBatch(files: { data: string, type: string }[]): Promise<MatchResult> {
    const ai = this.getAI();
    
    const imageParts = files.map(file => ({
      inlineData: { data: file.data.split(',')[1], mimeType: file.type }
    }));

    const promptText = "Examine these " + files.length + " apparel images.\n" +
      "1. Verify if they are the EXACT same item.\n" +
      "2. Extract visual characteristics (type, fabric, color, pattern, neckline, sleeve).\n" +
      "3. Suggest a clear product name.\n\n" +
      "Response must be JSON.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [...imageParts, { text: promptText }],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isMatch: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              mergedMetadata: {
                type: Type.OBJECT,
                properties: {
                  garmentType: { type: Type.STRING },
                  fabricTexture: { type: Type.STRING },
                  colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pattern: { type: Type.STRING },
                  neckline: { type: Type.STRING },
                  sleeveStyle: { type: Type.STRING },
                  suggestedName: { type: Type.STRING },
                  visualSignature: { type: Type.STRING }
                },
                required: ["garmentType", "colors", "suggestedName", "visualSignature"]
              }
            },
            required: ["isMatch", "confidence", "reason"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Vision model returned no data.");
      return JSON.parse(text);
    } catch (err) {
      console.error("Analysis Failure:", err);
      throw err;
    }
  }

  static async researchCrossPlatform(metadata: ProductMetadata): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    
    // Step 1: Real-time search using Google Search Grounding
    const searchPrompt = "Find current online listings (Amazon, Flipkart, etc.) for: " + metadata.suggestedName + 
      ". Visual DNA: " + metadata.visualSignature + 
      ". Identify typical pricing, descriptions, and exact measurements.";

    try {
      console.log("Step 1: Grounded Search...");
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: searchPrompt }] },
        config: { tools: [{ googleSearch: {} }] },
      });

      // Extract text from parts and grounding metadata
      const rawSearchText = searchResponse.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || "No data found.";
      const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const groundingSources = groundingChunks.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'External Source'
      })).filter((s: any) => s.uri);

      console.log("Step 2: JSON Formatting...");
      // Step 2: Format search results into the required JSON schema
      const formatPrompt = "Format this market research into JSON:\n\n" + rawSearchText;

      const formatResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: formatPrompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              listings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    price: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["platform", "title", "description"]
                }
              },
              commonKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              mergedMaster: { type: Type.STRING },
              confirmedDimensions: { type: Type.STRING },
              dimensionSourceCount: { type: Type.NUMBER }
            },
            required: ["listings", "commonKeywords", "mergedMaster", "dimensionSourceCount"]
          }
        }
      });

      const finalText = formatResponse.text;
      if (!finalText) throw new Error("JSON synthesis failed.");
      const parsed = JSON.parse(finalText);

      return {
        ...parsed,
        groundingSources,
        visualSignature: metadata.visualSignature
      };
    } catch (err) {
      console.error("Research Phase Failure:", err);
      throw err;
    }
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = "Generate 3 listing styles (casual, professional, luxurious) for: " + JSON.stringify(details) + 
      ". Incorporate these market insights: " + (masterDesc || 'N/A');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              casual: {
                type: Type.OBJECT,
                properties: { description: { type: Type.STRING }, fabricCare: { type: Type.STRING } },
                required: ["description", "fabricCare"]
              },
              professional: {
                type: Type.OBJECT,
                properties: { description: { type: Type.STRING }, fabricCare: { type: Type.STRING } },
                required: ["description", "fabricCare"]
              },
              luxurious: {
                type: Type.OBJECT,
                properties: { description: { type: Type.STRING }, fabricCare: { type: Type.STRING } },
                required: ["description", "fabricCare"]
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Copy generation failed.");
      return JSON.parse(text);
    } catch (err) {
      console.error("Copy Generation Failure:", err);
      throw err;
    }
  }

  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
