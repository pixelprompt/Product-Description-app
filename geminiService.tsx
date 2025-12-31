
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, ProductMetadata, FullListing, CrossPlatformResearch } from './types';

export class GeminiService {
  private static getAI() {
    // Safely retrieve API key from environment
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    return new GoogleGenAI({ apiKey: apiKey || '' });
  }

  static async analyzeImage(file: File): Promise<ProductMetadata> {
    const ai = this.getAI();
    const base64Data = await this.fileToBase64(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1], mimeType: file.type } },
          { text: "Identify this product for an e-commerce listing. Return JSON: garmentType, fabricTexture, colors (array), pattern, neckline, sleeveStyle, brandClues, suggestedName (SEO title)." }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
      }
    });

    return JSON.parse(response.text || '{}');
  }

  static async researchCrossPlatform(productName: string): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    const prompt = `Act as an e-commerce expert. Search for descriptions of "${productName}" on Amazon.in, Flipkart.com, Meesho.com, Ajio.com, Myntra.com, and Shein.in.
    
    Return JSON with:
    1. 'listings': Array of 6 objects {platform, title, description, price, url}. If not found, create a realistic high-quality simulated description for that platform.
    2. 'commonKeywords': Array of 5-8 trending SEO keywords.
    3. 'mergedMaster': A single merged description combining the best parts of all platform copies, optimized for cross-platform sales.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    return JSON.parse(response.text || '{}');
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = `Generate 3 distinct product listings (casual, professional, luxurious) based on these details: ${JSON.stringify(details)}. 
    Base them on this master draft if provided: ${masterDesc || 'N/A'}.
    
    Return JSON structure:
    {
      "casual": { "description": "...", "fabricCare": "...", "shipping": "...", "moreInfo": {...} },
      "professional": { "description": "...", "fabricCare": "...", "shipping": "...", "moreInfo": {...} },
      "luxurious": { "description": "...", "fabricCare": "...", "shipping": "...", "moreInfo": {...} }
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
