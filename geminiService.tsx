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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: `Analyze these ${files.length} images of apparel with Google Lens-level precision.
          
          TASK 1: Extract an 'Exact Visual Signature'. This is a hyper-detailed technical fingerprint including:
          - Exact shade and finish (e.g., 'Matte Emerald' vs 'Shiny Forest Green')
          - Specific fabric texture (e.g., 'heavyweight crepe', 'ribbed knit')
          - Distinct design details (embroidery patterns, specific button types, unique stitching, mesh inserts, embellishments).
          - silhouette features (e.g., 'asymmetric high slit', 'sweetheart neckline').
          
          TASK 2: Determine if all images are of the EXACT same garment.
          
          Return JSON:
          {
            "isMatch": boolean,
            "confidence": number,
            "reason": "string",
            "mismatchedIndices": [number],
            "mergedMetadata": {
              "garmentType": "string",
              "fabricTexture": "string",
              "colors": ["string"],
              "pattern": "string",
              "neckline": "string",
              "sleeveStyle": "string",
              "brandClues": "string",
              "suggestedName": "string",
              "visualSignature": "string"
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
    if (!text) throw new Error("No response from AI vision model.");
    return JSON.parse(text);
  }

  static async researchCrossPlatform(metadata: ProductMetadata, iteration: number = 1): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    
    const prompt = `Perform an EXACT MATCH Google Lens style search for this product: "${metadata.suggestedName}".
    
    VISUAL SIGNATURE: "${metadata.visualSignature}"
    
    CRITICAL SEARCH INSTRUCTIONS:
    1. EXACT CLOTH ONLY: Search for listings that match the visual signature 95%+.
    2. DIMENSIONS: Extract EXACT measurements/dimensions from EACH listing. We MANDATORILY require at least 3 DIFFERENT WEBSITES with matching/similar dimensions (within 15% variance).
    3. TARGET: Focus on Indian Marketplaces (Amazon.in, Flipkart, Myntra, Ajio, Meesho) + Global (Zara, ASOS, H&M).
    4. ITERATION DEPTH: ${iteration > 1 ? 'Perform a MUCH DEEPER search. We need more dimension sources.' : 'Perform primary market search.'}
    
    Return JSON:
    {
      "listings": [
        {
          "platform": "string",
          "title": "string",
          "description": "string",
          "price": "string",
          "numericPrice": number,
          "url": "string",
          "dimensions": "string"
        }
      ],
      "commonKeywords": ["string"],
      "mergedMaster": "string",
      "confirmedDimensions": "string (The final agreed value)",
      "dimensionSourceCount": number (Count of sources agreeing on this value)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
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
                  url: { type: Type.STRING },
                  dimensions: { type: Type.STRING }
                },
                required: ["platform", "title", "description", "price", "numericPrice", "url", "dimensions"]
              }
            },
            commonKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            mergedMaster: { type: Type.STRING },
            confirmedDimensions: { type: Type.STRING },
            dimensionSourceCount: { type: Type.NUMBER }
          },
          required: ["listings", "commonKeywords", "mergedMaster", "confirmedDimensions", "dimensionSourceCount"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from research model.");
    
    const parsed: CrossPlatformResearch = JSON.parse(text);

    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Exact Source'
    })).filter((s: any) => s.uri) || [];

    return {
      ...parsed,
      groundingSources,
      visualSignature: metadata.visualSignature
    };
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = `Generate 3 distinct product listings (casual, professional, luxurious) based on: ${JSON.stringify(details)}. 
    Base them on this EXACT MATCH master draft: ${masterDesc || 'N/A'}.
    
    Return JSON structure: { "casual": { "description": "...", "fabricCare": "...", "shipping": "...", "moreInfo": {} }, "professional": { ... }, "luxurious": { ... } }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
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
