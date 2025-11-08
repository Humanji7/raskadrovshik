import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v3.0-qwen-image-edit';
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_ENDPOINT = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

if (!QWEN_API_KEY) {
  throw new Error("QWEN_API_KEY environment variable not set");
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[edit-image ${API_VERSION}] Request received`);

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

    const editPrompt = `Based on the provided image, apply the following edit: "${editInstruction}".

Maintain the original artistic style which is defined as: "${stylePrompt}".

Requirements:
- Integrate the edit seamlessly with the existing composition
- Preserve the original mood and atmosphere
- Use only black and white (monochrome)
- Maintain professional storyboard quality`;

    const payload = {
      model: 'qwen-image-edit-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: `data:${originalImage.mimeType};base64,${originalImage.base64}` },
              { text: editPrompt }
            ]
          }
        ]
      },
      parameters: {
        n: 1,
        watermark: false
      }
    };

    console.log('[edit-image] Calling Qwen Image Edit API...');
    const startTime = Date.now();

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
      console.error('[edit-image] Qwen API error:', errorText);
      throw new Error(`Qwen API error (${response.status}): ${errorText}`);
    }

    const data: QwenImageResponse = await response.json();

    if (data.output.task_status !== 'SUCCEEDED') {
      throw new Error(`Task failed with status: ${data.output.task_status}`);
    }

    const result = data.output.results[0];

    let editedImage: string;
    if (result.url) {
      // Download the image and convert to base64
      const imgResponse = await fetch(result.url);
      const buffer = await imgResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      editedImage = `data:image/png;base64,${base64}`;
    } else if (result.b64_image) {
      editedImage = `data:image/png;base64,${result.b64_image}`;
    } else {
      throw new Error("No image data found in Qwen API response");
    }

    const duration = Date.now() - startTime;
    console.log(`[edit-image ${API_VERSION}] Success! Edited in ${duration}ms`);

    return res.status(200).json({ editedImage, version: API_VERSION });
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
