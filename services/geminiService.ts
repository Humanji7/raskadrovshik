interface ImageInput {
  base64: string;
  mimeType: string;
}

export const generateDescriptionFromImage = async (image: ImageInput): Promise<string> => {
  try {
    console.log('[geminiService] Calling generate-description API...');
    const response = await fetch('/api/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[geminiService] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`API error (${response.status}): ${errorData.details || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('[geminiService] Description generated successfully');
    return data.description;
  } catch (error) {
    console.error("[geminiService] Error generating description:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (originalImage: ImageInput, editInstruction: string, stylePrompt: string): Promise<string> => {
  try {
    console.log('[geminiService] Calling edit-image API...');
    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ originalImage, editInstruction, stylePrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[geminiService] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`API error (${response.status}): ${errorData.details || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('[geminiService] Image edited successfully');
    return data.editedImage;
  } catch (error) {
    console.error("[geminiService] Error editing image:", error);
    throw error;
  }
};

export const generateStoryboards = async (prompt: string, image: ImageInput, stylePrompt: string): Promise<string[]> => {
  try {
    console.log('[geminiService] Calling generate-storyboards API...');
    const response = await fetch('/api/generate-storyboards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, image, stylePrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[geminiService] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`API error (${response.status}): ${errorData.details || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('[geminiService] Storyboards generated successfully, count:', data.images?.length);
    return data.images;
  } catch (error) {
    console.error("[geminiService] Error generating storyboards:", error);
    throw error;
  }
};
