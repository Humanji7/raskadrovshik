import React, { useState, useCallback, ChangeEvent } from 'react';

interface ImageUploaderProps {
  onImageSelect: (image: { base64: string; mimeType: string }) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        // Remove the data URL prefix for the API call
        const base64String = result.split(',')[1];
        onImageSelect({ base64: base64String, mimeType: file.type });
      };
      reader.readAsDataURL(file);
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