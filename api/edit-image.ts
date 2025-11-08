import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_VERSION = 'v3.0-qwen-image-edit';
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_ENDPOINT = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const QWEN_TASK_ENDPOINT = 'https://dashscope-intl.aliyuncs.com/api/v1/tasks';

if (!QWEN_API_KEY) {
  throw new Error("QWEN_API_KEY environment variable not set");
}

interface QwenImageResponse {
  output: {
    task_id?: string;
    task_status?: string;
    results?: Array<{
      url?: string;
      b64_image?: string;
    }>;
  };
  request_id: string;
}

interface QwenTaskResponse {
  output: {
    task_status: string;
    results?: Array<{
      url?: string;
      b64_image?: string;
    }>;
  };
  request_id: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pollTaskStatus = async (taskId: string, maxAttempts = 60): Promise<QwenTaskResponse> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${QWEN_TASK_ENDPOINT}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to poll task status (${response.status}): ${errorText}`);
    }

    const data: QwenTaskResponse = await response.json();

    console.log(`[poll-task] Attempt ${attempt + 1}: status = ${data.output.task_status}`);

    if (data.output.task_status === 'SUCCEEDED') {
      return data;
    }

    if (data.output.task_status === 'FAILED') {
      throw new Error('Task failed on Qwen API side');
    }

    // Wait 2 seconds before next poll
    await sleep(2000);
  }

  throw new Error('Task polling timeout - image edit took too long');
};

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

    let finalData: QwenImageResponse | QwenTaskResponse;

    // Check if response is async (has task_id) or sync (has results)
    if (data.output.task_id) {
      console.log(`[edit-image] Async mode detected, task_id: ${data.output.task_id}`);
      finalData = await pollTaskStatus(data.output.task_id);
    } else if (data.output.task_status === 'SUCCEEDED' && data.output.results) {
      console.log('[edit-image] Sync mode - results available immediately');
      finalData = data;
    } else {
      throw new Error(`Unexpected response format: ${JSON.stringify(data.output)}`);
    }

    if (!finalData.output.results || finalData.output.results.length === 0) {
      throw new Error("No image results found in Qwen API response");
    }

    const result = finalData.output.results[0];

    let editedImage: string;
    if (result.url) {
      console.log('[edit-image] Downloading image from URL...');
      // Download the image and convert to base64
      const imgResponse = await fetch(result.url);
      const buffer = await imgResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      editedImage = `data:image/png;base64,${base64}`;
    } else if (result.b64_image) {
      console.log('[edit-image] Using base64 image from response');
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
