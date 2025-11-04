import React, { useState, useCallback, ChangeEvent } from 'react';

interface ImageUploaderProps {
  onImageSelect: (image: { base64: string; mimeType: string }) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const compressImage = (file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (max 1024px on longest side)
          const maxSize = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with quality 0.8
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64String = compressedDataUrl.split(',')[1];

          console.log('[ImageUploader] Original size:', file.size, 'Compressed base64 length:', base64String.length);

          resolve({
            base64: base64String,
            mimeType: 'image/jpeg',
            dataUrl: compressedDataUrl
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPreviewUrl(compressed.dataUrl);
        onImageSelect({ base64: compressed.base64, mimeType: compressed.mimeType });
      } catch (error) {
        console.error('[ImageUploader] Error compressing image:', error);
        alert('Не удалось обработать изображение. Попробуй другое.');
      }
    }
  }, [onImageSelect]);

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-yellow-500 hover:text-yellow-500 transition-colors">
          {previewUrl ? (
            <img src={previewUrl} alt="Sketch preview" className="max-h-full max-w-full object-contain rounded-md" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-semibold">Жми или тащи сюда свой скетч</p>
              <p className="text-xs">PNG или JPG. Без разницы.</p>
            </>
          )}
        </div>
      </label>
      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
    </div>
  );
};

export default ImageUploader;