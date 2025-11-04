interface ImageInput {
  base64: string;
  mimeType: string;
}

export const generateDescriptionFromImage = async (image: ImageInput): Promise<string> => {
  try {
    const response = await fetch('/api/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error("Error generating description with Gemini API:", error);
    throw new Error("Failed to generate description from the image.");
  }
};

export const editImageWithPrompt = async (originalImage: ImageInput, editInstruction: string, stylePrompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ originalImage, editInstruction, stylePrompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.editedImage;
  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    throw new Error("Failed to edit the image.");
  }
};

export const generateStoryboards = async (prompt: string, image: ImageInput, stylePrompt: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/generate-storyboards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, image, stylePrompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error("Error generating storyboards with Gemini API:", error);
    throw new Error("Failed to generate images from the API.");
  }
};
