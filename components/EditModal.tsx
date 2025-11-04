import React, { useState } from 'react';

interface EditModalProps {
  imageSrc: string;
  isEditing: boolean;
  onClose: () => void;
  onApplyEdit: (editPrompt: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ imageSrc, isEditing, onClose, onApplyEdit }) => {
  const [editPrompt, setEditPrompt] = useState('');

  const handleApply = () => {
    if (editPrompt.trim()) {
      onApplyEdit(editPrompt);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg flex flex-col relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-yellow-400">Доработка по-быстрому</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="w-full aspect-square bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
             <img src={imageSrc} alt="Image to edit" className="max-h-full max-w-full object-contain" />
          </div>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Пример: нарисуй ему шляпу"
            className="w-full h-24 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors placeholder-gray-500"
            disabled={isEditing}
          />
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleApply}
            disabled={isEditing || !editPrompt.trim()}
            className={`w-full py-3 px-4 font-bold rounded-md transition-colors flex items-center justify-center
              ${isEditing || !editPrompt.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
              }`}
          >
            {isEditing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Вношу правки...
              </>
            ) : 'Внести правку'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default EditModal;