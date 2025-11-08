import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v3.0-qwen-image-edit';
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_ENDPOINT = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

if (!QWEN_API_KEY) {
  throw new Error("QWEN_API_KEY environment variable not set");
}

const BASE_PROMPT = `Transform this rough sketch into a professional monochrome storyboard frame.

{STYLE_INSTRUCTIONS}

Requirements:
- Maintain the exact composition and camera angle from the sketch
- Apply dramatic cinematic lighting
- Use only black and white (monochrome)
- Professional storyboard quality
- Clear character poses and forms

Scene description: {prompt}`;

interface QwenImageResponse {
  output: {
    task_status: string;
    results: Array<{
      url?: string;
      b64_image?: string;
    }>;
  };
  request_id: string;
}

const generateSingleImage = async (
  prompt: string,
  image: { base64: string; mimeType: string },
  stylePrompt: string
): Promise<string> => {
  const fullPrompt = BASE_PROMPT
    .replace('{STYLE_INSTRUCTIONS}', stylePrompt)
    .replace('{prompt}', prompt);

  const payload = {
    model: 'qwen-image-edit-plus',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { image: `data:${image.mimeType};base64,${image.base64}` },
            { text: fullPrompt }
          ]
        }
      ]
    },
    parameters: {
      n: 1,
      watermark: false
    }
  };

  const response = await fetch(QWEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen API error (${response.status}): ${errorText}`);
  }

  const data: QwenImageResponse = await response.json();

  if (data.output.task_status !== 'SUCCEEDED') {
    throw new Error(`Task failed with status: ${data.output.task_status}`);
  }

  const result = data.output.results[0];

  // Qwen возвращает либо URL либо base64
  if (result.url) {
    // Скачиваем изображение и конвертируем в base64
    const imgResponse = await fetch(result.url);
    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } else if (result.b64_image) {
    return `data:image/png;base64,${result.b64_image}`;
  }

  throw new Error("No image data found in Qwen API response");
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[generate-storyboards ${API_VERSION}] Request received`);

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
      return res.status(400).json({
        error: 'Missing required fields: prompt, image, stylePrompt'
      });
    }

    if (!image.base64 || !image.mimeType) {
      console.log('[generate-storyboards] Invalid image data');
      return res.status(400).json({ error: 'Invalid image data' });
    }

    console.log('[generate-storyboards] Starting Qwen image generation...');
    const startTime = Date.now();

    const generatedImage = await generateSingleImage(prompt, image, stylePrompt);
    const images = [generatedImage];

    const duration = Date.now() - startTime;
    console.log(`[generate-storyboards ${API_VERSION}] Success! Generated in ${duration}ms`);

    return res.status(200).json({ images, version: API_VERSION });
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
