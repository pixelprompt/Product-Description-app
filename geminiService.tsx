
import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, ProductMetadata, FullListing, CrossPlatformResearch } from './types';

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  static async analyzeImage(file: File): Promise<ProductMetadata> {
    const ai = this.getAI();
    const base64Data = await this.fileToBase64(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1], mimeType: file.type } },
          { text: "Analyze this product image. Return a JSON object with these keys: garmentType, fabricTexture, colors (array of strings), pattern, neckline, sleeveStyle, brandClues, suggestedName (a concise SEO title)." }
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

    return JSON.parse(response.text);
  }

  static async researchCrossPlatform(productName: string): Promise<CrossPlatformResearch> {
    const ai = this.getAI();
    const prompt = `Research and fetch product listings for "${productName}" specifically from these 6 platforms: Amazon.in, Flipkart.com, Meesho.com, Ajio.com, Myntra.com, and Shein.in.
    
    Return a JSON object:
    {
      "listings": [
        { "platform": "Amazon", "title": "...", "description": "...", "price": "...", "url": "..." },
        ...one for each platform...
      ],
      "commonKeywords": ["keyword1", "keyword2", ...],
      "mergedMaster": "A single, highly optimized, comprehensive master description that combines the best phrasing and details from all 6 platforms, optimized for conversion."
    }
    If a specific platform is not found, provide a simulated high-quality description for that platform based on its typical style.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    return JSON.parse(response.text);
  }

  static async generateFullListing(details: ProductDetails, masterDesc?: string): Promise<FullListing> {
    const ai = this.getAI();
    const prompt = `Generate a comprehensive multi-tone e-commerce product listing.
    Product Specs: ${JSON.stringify(details)}
    ${masterDesc ? `Initial Master Content Base: ${masterDesc}` : ''}

    Produce 3 versions: Casual, Professional, and Luxurious.
    Each version must follow this JSON structure:
    {
      "description": "...",
      "fabricCare": "...",
      "shipping": "...",
      "moreInfo": {
        "Items Included": "...", "Brand": "...", "Fabric": "...", "Style Code": "...", "Colors": "...", "Top Type": "...", "Bottom Type": "...", "Pattern": "...", "Occasion": "...", "Size": "...", "Sleeve Length": "...", "Neck": "...", "Fabric Care": "...", "Shipping Days": "..."
      }
    }
    Return one root JSON object with keys "casual", "professional", and "luxurious".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });

    return JSON.parse(response.text);
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
