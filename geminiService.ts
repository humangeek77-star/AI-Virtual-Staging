import { GoogleGenAI, Type, Modality } from '@google/genai';
import { DesignStyle, DeclutterMode } from '../types';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

interface StageOptions {
  customPrompt?: string;
  weatherPrompt?: string;
  declutterMode?: DeclutterMode;
  declutterPrompt?: string;
}

export class GeminiService {
  
  /**
   * Helper to extract clean base64 data and mimeType from a data URL or raw string.
   */
  private static getBase64Details(base64String: string): { data: string; mimeType: string } {
    let mimeType = 'image/jpeg';
    let data = base64String;

    // Check for standard data URL format
    const match = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      data = match[2];
    } else if (base64String.includes(',')) {
      // Fallback: split by comma if present but regex didn't match (e.g. whitespace)
      const parts = base64String.split(',');
      data = parts[1];
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    return { data, mimeType };
  }

  /**
   * Resizes an image to ensure it fits within API limits and reduces payload size.
   * Optimized to 1024px and 0.8 quality to prevent payload too large errors.
   */
  private static async resizeImage(base64Str: string, maxDimension: number = 1024): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          // Return as JPEG with 0.8 quality (good balance of quality and size for API transmission)
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(base64Str); // Fallback
        }
      };
      img.onerror = () => {
        resolve(base64Str); // Fallback
      };
    });
  }

  /**
   * Executes an API call with exponential backoff for 429 errors.
   */
  private static async retryWithBackoff<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const isQuotaError = error.message?.includes('429') || 
                           error.message?.includes('Resource exhausted') || 
                           error.status === 429;
      
      if (retries > 0 && isQuotaError) {
        console.warn(`Quota hit. Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Analyzes the room and suggests a design style.
   */
  static async suggestDesignStyle(base64Image: string): Promise<DesignStyle> {
    // Resize for analysis to speed it up, 512px is enough for style detection
    const resizedBase64 = await this.resizeImage(base64Image, 512);
    const { data, mimeType } = this.getBase64Details(resizedBase64);

    const prompt = `
      Analyze this real estate room image. 
      Suggest the single most suitable interior design style from the following list:
      ${Object.values(DesignStyle).join(', ')}.
      Consider the existing architecture, lighting, and general ambiance.
    `;

    try {
      const response = await this.retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [
            { inlineData: { data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              style: {
                type: Type.STRING,
                enum: Object.values(DesignStyle),
                description: 'The suggested design style.'
              }
            },
            required: ['style']
          }
        }
      }));

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.style && Object.values(DesignStyle).includes(parsed.style as DesignStyle)) {
          return parsed.style as DesignStyle;
        }
      }
    } catch (error) {
      console.error("Gemini style suggestion failed:", error);
    }
    
    // Default fallback
    return DesignStyle.CONTEMPORARY;
  }

  /**
   * Virtually stages the room using the selected style.
   */
  static async stageImage(base64Image: string, style: DesignStyle, options: StageOptions = {}): Promise<string> {
    // Resize image to max 1024px to ensure reliable transmission
    const resizedBase64 = await this.resizeImage(base64Image, 1024);
    const { data, mimeType } = this.getBase64Details(resizedBase64);

    // Adjust base instructions based on declutter mode
    // If auto-decluttering, we want to preserve furniture, so we shouldn't say "empty room".
    let baseInstruction = `Virtually stage this empty room in a ${style} interior design style.`;
    let furnitureInstruction = `ONLY add furniture, rugs, wall art, and decor that matches the ${style} aesthetic.`;

    if (options.declutterMode === 'auto') {
       baseInstruction = `Virtually deep clean and declutter this room. Remove all mess, trash, and personal items to prepare it for real estate staging.`;
       furnitureInstruction = `PRESERVE the main furniture pieces (sofas, tables, beds, cabinets) exactly as they are, but REMOVE all small items, clutter, and debris sitting on them or on the floor.`;
    }

    let prompt = `
      ${baseInstruction}
      
      CRITICAL INSTRUCTIONS:
      1. STRICTLY PRESERVE the original room layout, perspective, and structural elements (walls, windows, doors, ceiling, floor type).
      2. Do NOT add, remove, or resize windows or doors.
      3. Do NOT change the camera angle or view.
      4. ${furnitureInstruction}
      5. Ensure the lighting and shadows are realistic and consistent with the original photo.
      6. NEVER change the structural layout. The room geometry must remain identical.
      7. Output a HIGH RESOLUTION, photorealistic image.
      8. WEATHER CONTAINMENT: Any requested weather elements (snow, rain, fog) must be strictly confined to the OUTDOORS (visible through windows). NEVER render snow, rain, or outdoor debris inside the room.
    `;

    // Decluttering Instructions
    if (options.declutterMode === 'auto') {
      prompt += `\n\nDECLUTTERING TASKS (EXECUTE AGGRESSIVELY):
      1. REMOVE ALL CLUTTER: Erase papers, boxes, clothes, toys, trash, dishes, and loose objects from floors, tables, and counters.
      2. CLEAR SURFACES: Ensure all flat surfaces (tables, shelves, counters) are free of small items.
      3. CLEAN FLOOR: The floor must be completely visible and free of debris.
      4. PRESERVE MAIN FURNITURE: Do not remove large furniture like tables, chairs, or sofas, but ensure they are tidy.
      5. INPAINT: Fill in the background behind removed items seamlessly to match the room's existing textures.`;
    } else if (options.declutterMode === 'manual' && options.declutterPrompt) {
      prompt += `\n\nDECLUTTERING: Remove the following specific items from the image: "${options.declutterPrompt}". Ensure the background behind these items is filled in naturally.`;
    }

    // Weather Instructions
    if (options.weatherPrompt && options.weatherPrompt.trim()) {
      prompt += `\n\nWEATHER & ENVIRONMENT INSTRUCTIONS: Apply the following weather conditions and environmental context: "${options.weatherPrompt.trim()}". 
      - If windows are visible, ensure the outdoor view matches this description.
      - CRITICAL: Weather elements (snow, rain, fog) must remain STRICTLY OUTSIDE. Do NOT render snow or rain inside the room.
      - Adjust interior lighting to match this ambiance (e.g. gloomy for rain, bright for sun).`;
    }

    // Custom User Instructions
    if (options.customPrompt && options.customPrompt.trim()) {
      prompt += `\n\nADDITIONAL USER INSTRUCTIONS (Prioritize these details while maintaining the ${style} style): "${options.customPrompt.trim()}"`;
    }

    prompt += `\n\nThe output must be a high-quality, photorealistic real estate image that looks exactly like the original room but furnished.`;

    try {
      const response = await this.retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          role: 'user',
          parts: [
            { inlineData: { data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
      }));

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];

        // Check for safety blocking
        if (candidate.finishReason === 'SAFETY') {
          throw new Error("Generation blocked by safety filters. Try a different image.");
        }

        const parts = candidate.content.parts;
        
        // 1. Try to find the image part
        const imagePart = parts.find(p => p.inlineData && p.inlineData.data);
        if (imagePart && imagePart.inlineData) {
          return `data:image/png;base64,${imagePart.inlineData.data}`;
        }

        // 2. If no image, check if the model returned text explaining why
        const textPart = parts.find(p => p.text);
        if (textPart && textPart.text) {
          throw new Error(textPart.text);
        }
      }
      
      throw new Error("No image generated. The model may have refused the request.");
    } catch (error: any) {
      console.error("Gemini staging failed:", error);
      throw new Error(error.message || "Failed to generate image");
    }
  }

  /**
   * Edits the image based on custom instructions.
   */
  static async editImage(base64Image: string, instruction: string): Promise<string> {
    // Resize for editing as well
    const resizedBase64 = await this.resizeImage(base64Image, 1024);
    const { data, mimeType } = this.getBase64Details(resizedBase64);

    // Determine intent
    const isStructuralEdit = instruction.toLowerCase().includes('door') || 
                             instruction.toLowerCase().includes('window') || 
                             instruction.toLowerCase().includes('wall') ||
                             instruction.toLowerCase().includes('paint') ||
                             instruction.toLowerCase().includes('floor') ||
                             instruction.toLowerCase().includes('remove') ||
                             instruction.toLowerCase().includes('add');

    let preservationInstruction = `
      1. PRESERVE EXISTING FURNITURE: Do NOT remove, move, or alter the existing furniture, rugs, or decor unless the instruction specifically asks to remove or change them.
      2. PRESERVE STRUCTURE: Maintain the original perspective, walls, windows, floor, and ceiling exactly.
    `;

    if (isStructuralEdit) {
      preservationInstruction = `
      1. PRESERVE EXISTING FURNITURE: Keep furniture unless asked to remove it.
      2. ALLOW STRUCTURAL CHANGES: You are authorized to modify walls, doors, windows, or paint if the instruction requires it.
      `;
    }

    const prompt = `
      Edit this real estate image according to the following instruction: "${instruction}".
      
      CRITICAL INSTRUCTIONS:
      ${preservationInstruction}
      3. LIGHTING & SHADOWS: If the instruction implies a change in lighting (e.g., "remove sunlight", "make it night", "cloudy day"), YOU MUST ADJUST the interior lighting and shadows to match the new condition. Overwrite original hard shadows if they contradict the instruction.
      4. WEATHER/OUTDOOR: If changing weather, ONLY modify the view through the windows. DO NOT add rain, snow, or fog inside the room.
      5. PHOTOREALISM: Ensure the edit looks like a real photograph.
    `;

    try {
      const response = await this.retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          role: 'user',
          parts: [
            { inlineData: { data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
      }));

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];

        if (candidate.finishReason === 'SAFETY') {
          throw new Error("Generation blocked by safety filters.");
        }

        const parts = candidate.content.parts;
        
        const imagePart = parts.find(p => p.inlineData && p.inlineData.data);
        if (imagePart && imagePart.inlineData) {
          return `data:image/png;base64,${imagePart.inlineData.data}`;
        }

        const textPart = parts.find(p => p.text);
        if (textPart && textPart.text) {
          throw new Error(textPart.text);
        }
      }

      throw new Error("No image generated.");
    } catch (error: any) {
      console.error("Gemini editing failed:", error);
      throw new Error(error.message || "Failed to generate image");
    }
  }

  /**
   * Generates a 2D or 3D plan of the room.
   */
  static async generatePlan(base64Image: string, type: '2D' | '3D'): Promise<string> {
    const resizedBase64 = await this.resizeImage(base64Image, 1024);
    const { data, mimeType } = this.getBase64Details(resizedBase64);

    let prompt = '';
    if (type === '2D') {
      prompt = `
        Generate a professional 2D architectural floor plan based on this room image.
        - View: Top-down, flat 2D.
        - Style: Clean black and white line drawing, architectural schematic.
        - Content: Show walls, windows, doors, and the footprint of the furniture visible in the image.
        - Output: A high-contrast, clear floor plan image.
      `;
    } else {
      prompt = `
        Generate a 3D isometric cutaway render of this room.
        - View: High-angle isometric perspective (approx 45 degrees).
        - Style: Photorealistic 3D architectural visualization.
        - Content: Recreate the room's layout, walls, floor, and furniture placement in 3D.
        - Lighting: Bright, studio lighting.
        - Output: A high-quality 3D render of the room layout.
      `;
    }

    try {
      const response = await this.retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          role: 'user',
          parts: [
            { inlineData: { data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
      }));

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        const parts = candidate.content.parts;
        const imagePart = parts.find(p => p.inlineData && p.inlineData.data);
        if (imagePart && imagePart.inlineData) {
          return `data:image/png;base64,${imagePart.inlineData.data}`;
        }
      }
      throw new Error("No plan generated.");
    } catch (error: any) {
      console.error("Gemini plan generation failed:", error);
      throw new Error(error.message || "Failed to generate plan");
    }
  }
}
