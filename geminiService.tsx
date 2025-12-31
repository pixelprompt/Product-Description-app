
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, ProductMetadata, FullListing, CrossPlatformResearch, MatchResult } from './types';

export class GeminiService {
  private static getAI() {
    // Correctly initialize with a named parameter using process.env.API_KEY directly.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async analyzeBatch(files: { data: string, type: string }[]): Promise<MatchResult> {
    const ai = this.getAI();
    
    const imageParts = files.map(file => ({
      inlineData: { data: file.data.split(',')[1], mimeType: file.type }
    }));

    // Using gemini-3-flash-preview for multi-modal analysis tasks.
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
            "isMatch": boolean (true only if confidence > 95%),
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

    const text = response.text;
    if (!text) throw new Error("No response from AI vision model.");
    return JSON.parse(text);
  }

  static async researchCrossPlatform(productName: string): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    const prompt = `Act as an e-commerce market intelligence expert. Perform a comprehensive web search for "${productName}" across ALL available e-commerce platforms globally. 
    
    Platforms to check: Amazon (.in, .com, .uk), Flipkart, Meesho, Ajio, Myntra, Shein, Nykaa, Snapdeal, Zara, H&M, ASOS, Farfetch, and any other relevant niche boutiques.
    
    Research Goal: Identify as many unique website listings as possible. 
    Price Extraction Rule: Be extremely precise with currencies. Convert all currency symbols (₹, $, £, €, AED, etc.) to a standardized 'price' string and extract the raw value into 'numericPrice'. If multiple prices exist (sale vs MRP), use the current sale price.
    
    Return a valid JSON object with:
    1. 'listings': An array of objects.
    2. 'commonKeywords': Best SEO keywords.
    3. 'mergedMaster': Elite synthesized product description.`;

    // Using gemini-3-pro-preview for advanced research requiring search grounding.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
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
                  price: { type: Type.STRING, description: "Price with currency symbol, e.g., ₹2,499" },
                  numericPrice: { type: Type.NUMBER, description: "Raw numeric value for sorting, e.g., 2499.0" },
                  url: { type: Type.STRING }
                },
                required: ["platform", "title", "description", "price", "numericPrice"]
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
    return JSON.parse(text);
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = `Generate 3 distinct product listings (casual, professional, luxurious) based on: ${JSON.stringify(details)}. 
    Base them on this master draft synthesized from global marketplace data: ${masterDesc || 'N/A'}.
    
    Return JSON with structure: { "casual": { "description": "...", "fabricCare": "...", "shipping": "...", "moreInfo": {} }, "professional": { ... }, "luxurious": { ... } }`;

    // Using gemini-3-pro-preview for complex reasoning and thinking-intensive tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
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
