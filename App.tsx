import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import { generateStoryboards, generateDescriptionFromImage, editImageWithPrompt } from './services/geminiService';
import EditModal from './components/EditModal';

interface ImageState {
  base64: string;
  mimeType: string;
}

const styles = [
  {
    id: 'enhanced-shadows',
    name: 'Светотень Pro',
    prompt: `Transform this into a highly detailed, refined sketch composition with emphasis on sophisticated shadow work and lighting.

Style Requirements:
- Medium: Professional pencil/graphite with selective charcoal for deep shadows
- Line Quality: Precise, confident linework with varying line weights (thin for highlights, thick for shadow boundaries)
- Shadow Technique: Use a combination of cross-hatching, gradient shading, and solid blacks
- Tonal Range: Full spectrum from bright highlights to deep, rich blacks with at least 7-9 distinct gray values
- Details: High level of refinement in both foreground and background elements

Lighting and Shadow Instructions:
- Establish a clear, consistent light source direction
- Create dramatic cast shadows with soft, graduated edges where appropriate
- Use core shadows to define three-dimensional form
- Add reflected light in shadow areas for depth and realism
- Employ occlusion shadows in crevices and contact points
- Create atmospheric depth through shadow intensity variation

Composition:
- Maintain strong focal points through contrast and detail density
- Use shadows to guide the viewer's eye through the composition
- Balance detailed areas with simplified passages for visual rest
- Preserve the original composition's intent while elevating execution quality

Technical Execution:
- Avoid flat, uniform tones - always show subtle variation
- Blend transitions between light and shadow smoothly
- Preserve edge quality - sharp where needed, soft where appropriate
- Ensure shadows feel grounded and dimensionally accurate

The final result should feel like a masterful architectural concept sketch or film storyboard - polished, professional, and production-ready with exceptional attention to light, form, and atmosphere through shadow rendering.`
  },
];


const APP_VERSION = 'v3.0-qwen-api'; // Updated: migrated to Qwen API

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<ImageState | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDescribing, setIsDescribing] = useState<boolean>(false);
  const [varyingIndex, setVaryingIndex] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<{ index: number; src: string } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(styles[0].id);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const handleImageSelect = useCallback((selectedImage: ImageState) => {
    setImage(selectedImage);
  }, []);

  const handleGenerateDescription = async () => {
    if (!image) {
      setError('Сначала загрузи эскиз, гений.');
      return;
    }
    setIsDescribing(true);
    setError(null);

    try {
      const description = await generateDescriptionFromImage(image);
      setPrompt(description);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Не смог сгенерить описание: ${errorMessage}`);
    } finally {
      setIsDescribing(false);
    }
  };

  const handleSubmit = async () => {
    const styleDefinition = styles.find(s => s.id === selectedStyle);
    if (!prompt || !image || !styleDefinition) {
      setError('Нужен эскиз, описание и стиль. Без этого никак.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const images = await generateStoryboards(prompt, image, styleDefinition.prompt);
      setGeneratedImages(images);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка генерации: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVaryImage = async (index: number) => {
    const styleDefinition = styles.find(s => s.id === selectedStyle);
    if (!prompt || !generatedImages[index] || !styleDefinition) {
      setError('Не могу создать вариации без промпта, стиля или исходника.');
      return;
    }
    setVaryingIndex(index);
    setError(null);

    try {
      const sourceImageSrc = generatedImages[index];
      const match = sourceImageSrc.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Неправильный формат картинки');
      }
      const varyingImage: ImageState = {
        mimeType: match[1],
        base64: match[2],
      };

      const images = await generateStoryboards(prompt, varyingImage, styleDefinition.prompt);
      setGeneratedImages(images);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Не вышло сделать вариации: ${errorMessage}`);
    } finally {
      setVaryingIndex(null);
    }
  };

  const handleApplyEdit = async (editPrompt: string) => {
    const styleDefinition = styles.find(s => s.id === selectedStyle);
    if (!editingImage || !editPrompt || !styleDefinition) {
        return;
    }
    setIsEditing(true);
    setError(null);
    try {
      const { index, src } = editingImage;
      const match = src.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Неправильный формат картинки');
      }
      const sourceImage: ImageState = {
        mimeType: match[1],
        base64: match[2],
      };
      const newImageSrc = await editImageWithPrompt(sourceImage, editPrompt, styleDefinition.prompt);
      setGeneratedImages(prev => {
        const newImages = [...prev];
        newImages[index] = newImageSrc;
        return newImages;
      });
      setEditingImage(null);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Не смог применить правку: ${errorMessage}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownloadImage = (imgSrc: string, index: number) => {
    const link = document.createElement('a');
    const fileExtension = imgSrc.split(';')[0].split('/')[1] || 'png';
    link.href = imgSrc;
    link.download = `banana-board-шедевр-${index + 1}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isButtonDisabled = !prompt || !image || isLoading || isDescribing || varyingIndex !== null;
  const isDescribeButtonDisabled = !image || isLoading || isDescribing || varyingIndex !== null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-center">
          <span className="text-yellow-400">🚬</span> Раскадровщик курильщика
        </h1>
        <p className="text-center text-gray-400 text-sm">давай действуй, я не знаю <span className="text-gray-600 text-xs">({APP_VERSION})</span></p>
      </header>

      <main className="flex-grow container mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="flex flex-col space-y-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-yellow-400">1. Закинь свой набросок</h2>
            <p className="text-sm text-gray-400 mb-4">Кидай сюда свой черновой эскиз. AI поймёт твою гениальную композицию.</p>
            <ImageUploader onImageSelect={handleImageSelect} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-lg font-semibold text-yellow-400">2. Диктуй, что рисовать</h2>
               <button
                onClick={handleGenerateDescription}
                disabled={isDescribeButtonDisabled}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 flex items-center
                  ${isDescribeButtonDisabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40'
                  }`}
              >
                {isDescribing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Думаю...
                  </>
                ) : '✨ Пусть AI придумает'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Расскажи про персов, свет, атмосферу. Или доверься AI.</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Пример: Крупный план, рука старика сжимает компас. На фоне — размытый лес. Тревожный вечерний свет."
              className="w-full h-40 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`w-full py-3 px-4 font-bold text-lg rounded-md transition-all duration-300 ease-in-out flex items-center justify-center
              ${isButtonDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 transform hover:scale-105'
              }`}
          >
            {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Магия в процессе...
                </>
              ) : 'Создать шедевры!'}
          </button>
        </div>

        {/* Output Panel */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">3. Вот что вышло</h2>

          {/* Main Preview Area */}
          <div className="flex-grow w-full bg-gray-900 rounded-md flex items-center justify-center p-4 min-h-[400px] lg:min-h-[500px] relative">
            {isLoading && (
              <div className="text-center">
                 <svg className="animate-spin mx-auto h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                <p className="mt-4 text-gray-400">Рисую твои раскадровки...</p>
              </div>
            )}
            {error && <p className="text-red-400">{error}</p>}
            {!isLoading && !error && generatedImages.length === 0 && (
              <p className="text-gray-500">Здесь появится твой будущий шедевр в стиле "Светотень Pro".</p>
            )}
            {generatedImages.length > 0 && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={generatedImages[selectedImageIndex]}
                  alt={`Сгенерированный кадр ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                {varyingIndex === selectedImageIndex && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-md">
                    <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm mt-2 text-gray-300">Ищу варианты...</span>
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleVaryImage(selectedImageIndex)}
                    title="Создать вариации"
                    disabled={isLoading || varyingIndex !== null || editingImage !== null}
                    className="flex items-center p-3 bg-gray-200/90 text-gray-900 font-bold rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg transition-all"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2.586l-1.707-1.707a1 1 0 00-1.414 0L5 14.586V5z" />
                      <path d="M15 12a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1h1.586l1.707-1.707a1 1 0 011.414 0L14 9.414V12z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingImage({ index: selectedImageIndex, src: generatedImages[selectedImageIndex] })}
                     title="Доработать напильником"
                    disabled={isLoading || varyingIndex !== null || editingImage !== null}
                    className="flex items-center p-3 bg-yellow-500/90 text-gray-900 font-bold rounded-full hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDownloadImage(generatedImages[selectedImageIndex], selectedImageIndex)}
                    title="Забрать себе"
                    disabled={isLoading || varyingIndex !== null || editingImage !== null}
                    className="flex items-center p-3 bg-gray-200/90 text-gray-900 font-bold rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery at Bottom */}
          {generatedImages.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {generatedImages.map((imgSrc, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-yellow-500 ring-2 ring-yellow-500/50 scale-105'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <img
                    src={imgSrc}
                    alt={`Превью ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {generatedImages.length > 0 && !isLoading && varyingIndex === null && (
            <div className="mt-4">
              <button
                onClick={handleSubmit}
                className="w-full py-2 px-4 font-semibold text-sm rounded-md transition-colors bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                Не то? Давай еще раз!
              </button>
            </div>
          )}
        </div>
      </main>
      {editingImage && (
        <EditModal 
          imageSrc={editingImage.src}
          isEditing={isEditing}
          onClose={() => setEditingImage(null)}
          onApplyEdit={handleApplyEdit}
        />
      )}
    </div>
  );
};

export default App;