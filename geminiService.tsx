
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, ProductMetadata, FullListing, CrossPlatformResearch, MatchResult } from './types';

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async analyzeBatch(files: { data: string, type: string }[]): Promise<MatchResult> {
    const ai = this.getAI();
    
    const imageParts = files.map(file => ({
      inlineData: { data: file.data.split(',')[1], mimeType: file.type }
    }));

    const promptText = "Analyze these " + files.length + " images of apparel with high precision.\n\n" +
      "TASK 1: Extract a detailed 'Visual Signature' (Exact shade, fabric texture like crepe or knit, design details like mesh or sequins, and silhouette).\n\n" +
      "TASK 2: Check if all images are of the EXACT same garment.\n\n" +
      "Return JSON structure:\n" +
      "{\n" +
      "  \"isMatch\": boolean,\n" +
      "  \"confidence\": number,\n" +
      "  \"reason\": \"string\",\n" +
      "  \"mismatchedIndices\": [number],\n" +
      "  \"mergedMetadata\": {\n" +
      "    \"garmentType\": \"string\",\n" +
      "    \"fabricTexture\": \"string\",\n" +
      "    \"colors\": [\"string\"],\n" +
      "    \"pattern\": \"string\",\n" +
      "    \"neckline\": \"string\",\n" +
      "    \"sleeveStyle\": \"string\",\n" +
      "    \"brandClues\": \"string\",\n" +
      "    \"suggestedName\": \"string\",\n" +
      "    \"visualSignature\": \"string\"\n" +
      "  }\n" +
      "}";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            ...imageParts,
            { text: promptText }
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isMatch: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              mismatchedIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              mergedMetadata: {
                type: Type.OBJECT,
                properties: {
                  garmentType: { type: Type.STRING },
                  fabricTexture: { type: Type.STRING },
                  colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pattern: { type: Type.STRING },
                  neckline: { type: Type.STRING },
                  sleeveStyle: { type: Type.STRING },
                  brandClues: { type: Type.STRING },
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
      if (!text) throw new Error("Empty response from vision model.");
      return JSON.parse(text);
    } catch (err) {
      console.error("Analysis Error:", err);
      throw err;
    }
  }

  static async researchCrossPlatform(metadata: ProductMetadata, iteration: number = 1): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    
    const searchPrompt = "Perform an EXACT MATCH search for this product: \"" + metadata.suggestedName + "\".\n" +
      "VISUAL SIGNATURE: \"" + metadata.visualSignature + "\"\n\n" +
      "MANDATORY:\n" +
      "1. Find actual listings on Amazon.in, Flipkart, Myntra, Ajio, or Meesho.\n" +
      "2. Identify EXACT measurements/dimensions. We need consensus from multiple sources.\n" +
      "3. Return platform names, titles, descriptions, prices, and dimensions.\n" +
      "4. Summary of common keywords.\n" +
      "5. Draft an 'AI-Merged Master Copy' of the description.";

    try {
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: searchPrompt }] },
        config: {
          tools: [{ googleSearch: {} }]
        },
      });

      const rawSearchText = searchResponse.text;
      const groundingSources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Market Source'
      })).filter((s: any) => s.uri) || [];

      const formatPrompt = "Convert the following market research data into a structured JSON object.\n\n" +
        "RESEARCH DATA:\n" + rawSearchText + "\n\n" +
        "JSON SCHEMA:\n" +
        "{\n" +
        "  \"listings\": [\n" +
        "    { \"platform\": \"string\", \"title\": \"string\", \"description\": \"string\", \"price\": \"string\", \"numericPrice\": number, \"url\": \"string\", \"dimensions\": \"string\" }\n" +
        "  ],\n" +
        "  \"commonKeywords\": [\"string\"],\n" +
        "  \"mergedMaster\": \"string\",\n" +
        "  \"confirmedDimensions\": \"string\",\n" +
        "  \"dimensionSourceCount\": number\n" +
        "}\n\n" +
        "Important: numericPrice 0 if unknown. dimensionSourceCount reflects unique platforms.";

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
                    numericPrice: { type: Type.NUMBER },
                    url: { type: Type.STRING },
                    dimensions: { type: Type.STRING }
                  },
                  required: ["platform", "title", "description", "price"]
                }
              },
              commonKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              mergedMaster: { type: Type.STRING },
              confirmedDimensions: { type: Type.STRING },
              dimensionSourceCount: { type: Type.NUMBER }
            },
            required: ["listings", "commonKeywords", "mergedMaster", "confirmedDimensions", "dimensionSourceCount"]
          }
        }
      });

      const finalText = formatResponse.text;
      if (!finalText) throw new Error("JSON formatting failed.");
      const parsed = JSON.parse(finalText);

      return {
        ...parsed,
        groundingSources,
        visualSignature: metadata.visualSignature
      };
    } catch (err) {
      console.error("Research Error:", err);
      throw err;
    }
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = "Generate 3 distinct product listings (casual, professional, luxurious) based on: " + JSON.stringify(details) + ".\n" +
      "Reference master draft: " + (masterDesc || 'N/A') + ".\n\n" +
      "Return JSON structure: { \"casual\": { \"description\": \"...\", \"fabricCare\": \"...\", \"shipping\": \"...\", \"moreInfo\": {} }, \"professional\": { ... }, \"luxurious\": { ... } }";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Generation failed.");
      return JSON.parse(text);
    } catch (err) {
      console.error("Generation Error:", err);
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
