
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignStyle } from "../types";

export class GeminiService {
  private static ai = new GoogleGenerativeAI({ apiKey: process.env.API_KEY || '' });

  static async suggestDesignStyle(base64Image: string): Promise<DesignStyle> {
    const ai = new GoogleGenerativeAI({ apiKey: process.env.API_KEY || '' });
    const availableStyles = Object.values(DesignStyle).join(', ');

    const prompt = `Analyze this real estate room image and suggest the single most suitable interior design style from the following options: ${availableStyles}. 
    Consider the existing architecture, lighting, and general ambiance. 
    Respond ONLY with a JSON object containing a 'style' field, like so: {"style": "Modern"}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              style: {
                type: Type.STRING,
                description: 'The suggested design style from the DesignStyle enum.',
                enum: Object.values(DesignStyle)
              },
            },
            required: ['style'],
          },
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.style && Object.values(DesignStyle).includes(parsed.style)) {
          return parsed.style as DesignStyle;
        }
      }
    } catch (error) {
      console.error("AI style suggestion failed:", error);
    }
    return DesignStyle.CONTEMPORARY; 
  }

  static async stageImage(
    base64Image: string, 
    style: DesignStyle, 
    isHighQuality: boolean = false
  ): Promise<string> {
    const modelName = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const prompt = `Virtually stage this real estate photo in a ${style} design style. 
    Add appropriate furniture, decor, rugs, and wall art that fits the ${style} aesthetic. 
    Crucially, do NOT change the room's architectural layout, walls, ceiling, floor, windows, doors, or any fixed structural elements. 
    Only add or rearrange portable furniture and decor. 
    Ensure the result looks professional and photorealistic for a real estate listing.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: isHighQuality ? { imageConfig: { imageSize: "2K", aspectRatio: "16:9" } } : undefined
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from AI");
  }

  static async editImage(
    base64Image: string, 
    instruction: string,
    isHighQuality: boolean = false
  ): Promise<string> {
    const modelName = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    const prompt = `Given this real estate room image, apply the following modification: "${instruction}". 
    If the request is to REMOVE something (like a rug on the stairs), cleanly remove it and realistically reconstruct the background floor, surface, or structural material beneath it. 
    If adding something, ensure it matches the room's lighting, scale, and perspective perfectly.
    Maintain strict photorealism suitable for a high-end real estate listing.
    Preserve the existing room's structural integrity unless explicitly asked to modify it.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: isHighQuality ? { imageConfig: { imageSize: "2K", aspectRatio: "16:9" } } : undefined
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from AI");
  }
}
