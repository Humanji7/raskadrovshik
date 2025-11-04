import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const imageGenerationModel = 'gemini-2.5-flash-image';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[edit-image] Request received');

  if (req.method !== 'POST') {
    console.log('[edit-image] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originalImage, editInstruction, stylePrompt } = req.body;

    console.log('[edit-image] Params:', {
      hasImage: !!originalImage,
      hasEditInstruction: !!editInstruction,
      hasStylePrompt: !!stylePrompt,
      imageSize: originalImage?.base64?.length || 0,
    });

    if (!originalImage || !editInstruction || !stylePrompt) {
      console.log('[edit-image] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: originalImage, editInstruction, stylePrompt' });
    }

    if (!originalImage.base64 || !originalImage.mimeType) {
      console.log('[edit-image] Invalid image data');
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const editPrompt = `Based on the provided image, apply the following edit: "${editInstruction}". Maintain the original artistic style which is defined as: "${stylePrompt}". Ensure the edit integrates seamlessly with the existing composition and mood.`;

    const response = await ai.models.generateContent({
      model: imageGenerationModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImage.base64,
              mimeType: originalImage.mimeType,
            },
          },
          { text: editPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const editedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log('[edit-image] Success! Image edited');
        return res.status(200).json({ editedImage });
      }
    }

    console.log('[edit-image] No edited image data found');
    throw new Error("No edited image data found in the API response.");
  } catch (error) {
    console.error("[edit-image] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[edit-image] Error details:", errorMessage);
    return res.status(500).json({
      error: "Failed to edit the image.",
      details: errorMessage
    });
  }
}
