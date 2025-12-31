import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, ProductMetadata, FullListing, CrossPlatformResearch, MatchResult } from './types';

export class GeminiService {
  // Always create a fresh instance before making calls to ensure the latest API configuration
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async analyzeBatch(files: { data: string, type: string }[]): Promise<MatchResult> {
    const ai = this.getAI();
    
    // Extracting base64 data from data URLs
    const imageParts = files.map(file => ({
      inlineData: { data: file.data.split(',')[1], mimeType: file.type }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: `Analyze these ${files.length} images of apparel. 
          Task 1: Determine if they are all of the EXACT SAME physical product (same fabric, color, pattern, garment type, and silhouette). 
          Shade variations +/- 10% are acceptable due to lighting.
          Task 2: If they match, extract merged metadata. 
          If they don't match, identify which image indices (0-indexed) are the odd ones out.
          
          Return JSON:
          {
            "isMatch": boolean,
            "confidence": number (0-100),
            "reason": "string explaining the match or discrepancy",
            "mismatchedIndices": [number],
            "mergedMetadata": {
              "garmentType": "string",
              "fabricTexture": "string",
              "colors": ["string"],
              "pattern": "string",
              "neckline": "string",
              "sleeveStyle": "string",
              "brandClues": "string",
              "suggestedName": "string"
            }
          }` }
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
              },
              required: ["garmentType", "colors", "suggestedName"]
            }
          },
          required: ["isMatch", "confidence", "reason"]
        }
      }
    });

    // Accessing .text property directly as per guidelines
    const text = response.text;
    if (!text) throw new Error("No response from AI vision model.");
    return JSON.parse(text);
  }

  static async researchCrossPlatform(productName: string): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    
    const prompt = `Act as an e-commerce market intelligence expert. Perform an EXHAUSTIVE web search for "${productName}" with a primary focus on the INDIAN e-commerce market.
    
    CRITICAL INSTRUCTIONS:
    1. TARGET SITES: Amazon.in, Flipkart, Meesho, Ajio, Myntra, Nykaa, Snapdeal.
    2. QUANTITY: You MUST return data from AT LEAST 10 DIFFERENT website domains.
    3. CURRENCY: Standardize prices to INR (₹).
    
    JSON STRUCTURE REQUIREMENTS:
    - 'listings': Array of AT LEAST 10 objects. Each must have platform, title, description, price, numericPrice, and unique url.
    - 'commonKeywords': Best 10 SEO keywords found.
    - 'mergedMaster': A high-conversion description synthesized from findings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        // Only googleSearch is allowed in tools when used for search grounding
        tools: [{ googleSearch: {} }],
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
                  url: { type: Type.STRING }
                },
                required: ["platform", "title", "description", "price", "numericPrice", "url"]
              }
            },
            commonKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            mergedMaster: { type: Type.STRING }
          },
          required: ["listings", "commonKeywords", "mergedMaster"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from research model.");
    
    const parsed: CrossPlatformResearch = JSON.parse(text);

    // Mandatorily extracting grounding sources for citations on the web app
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Search Source'
    })).filter((s: any) => s.uri) || [];

    return {
      ...parsed,
      groundingSources
    };
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = `Generate 3 distinct product listings (casual, professional, luxurious) based on: ${JSON.stringify(details)}. 
    Base them on this master draft: ${masterDesc || 'N/A'}.
    
    Return JSON with structure: { "casual": { "description": "...", "fabricCare": "...", "shipping": "...", "moreInfo": {} }, "professional": { ... }, "luxurious": { ... } }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        // Using thinkingBudget for complex creative writing tasks in Gemini 3 series
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from generation model.");
    return JSON.parse(text);
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
