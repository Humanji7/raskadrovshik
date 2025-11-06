import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const imageGenerationModel = 'gemini-2.5-flash-image';

const BASE_PROMPT = `You are a master storyboard artist for a major film studio. Your task is to translate a director's vision into a single, powerful storyboard frame. {STYLE_INSTRUCTIONS} You will be given two inputs: 1. A rough, hand-drawn sketch from the director, which you MUST use for the core composition, object placement, and camera angle. 2. A text prompt describing the scene's details, mood, and action. The output MUST be a monochrome (black and white) image. Focus on cinematic storytelling: clear character poses, dramatic lighting, and a strong sense of mood. Do not create a photorealistic image. This is a sketch meant to convey an idea quickly and effectively. Create the following scene: {prompt}`;

const generateSingleImage = async (prompt: string, image: any, stylePrompt: string): Promise<string> => {
  const fullPrompt = BASE_PROMPT
    .replace('{STYLE_INSTRUCTIONS}', stylePrompt)
    .replace('{prompt}', prompt);

  const response = await ai.models.generateContent({
    model: imageGenerationModel,
    contents: {
      parts: [
        {
          inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
          },
        },
        {
          text: fullPrompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data found in the API response.");
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[generate-storyboards] Request received');

  if (req.method !== 'POST') {
    console.log('[generate-storyboards] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, image, stylePrompt } = req.body;

    console.log('[generate-storyboards] Params:', {
      hasPrompt: !!prompt,
      hasImage: !!image,
      hasStylePrompt: !!stylePrompt,
      imageSize: image?.base64?.length || 0,
    });

    if (!prompt || !image || !stylePrompt) {
      console.log('[generate-storyboards] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: prompt, image, stylePrompt' });
    }

    if (!image.base64 || !image.mimeType) {
      console.log('[generate-storyboards] Invalid image data');
      return res.status(400).json({ error: 'Invalid image data' });
    }

    console.log('[generate-storyboards] Starting generation of 1 image...');
    const startTime = Date.now();

    const generatedImage = await generateSingleImage(prompt, image, stylePrompt);
    const images = [generatedImage];

    const duration = Date.now() - startTime;
    console.log(`[generate-storyboards] Success! Generated 1 image in ${duration}ms`);

    return res.status(200).json({ images });
  } catch (error) {
    console.error("[generate-storyboards] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[generate-storyboards] Error details:", errorMessage);
    return res.status(500).json({
      error: "Failed to generate storyboards.",
      details: errorMessage
    });
  }
}
