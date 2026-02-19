import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface NotesInputProps {
  onGenerate: (lessonTitle: string, rawText: string) => void;
  isGenerating: boolean;
  selectedClassId: string;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  onGenerate,
  isGenerating,
  selectedClassId,
}) => {
  const [lessonTitle, setLessonTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxCharacters = 10000;
  const currentCharacters = rawText.length;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lessonTitle.trim() && rawText.trim()) {
      onGenerate(lessonTitle, rawText);
    }
  };

  const isDisabled = !lessonTitle.trim() || !rawText.trim() || isGenerating || !selectedClassId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Lesson Content</h2>
          <p className="text-sm text-gray-500">Enter raw notes to transform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="lessonTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Lesson Title
          </label>
          <input
            type="text"
            id="lessonTitle"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder="e.g., Introduction to Photosynthesis"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isGenerating}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="rawText" className="block text-sm font-medium text-gray-700">
              Raw Notes
            </label>
            <span className={`text-xs ${currentCharacters > maxCharacters ? 'text-red-500' : 'text-gray-400'}`}>
              {currentCharacters.toLocaleString()} / {maxCharacters.toLocaleString()}
            </span>
          </div>
          <textarea
            id="rawText"
            value={rawText}
            onChange={(e) => setRawText(e.target.value.slice(0, maxCharacters))}
            placeholder="Paste your lesson notes here...

Example:
Photosynthesis is the process by which plants convert light energy into chemical energy. This occurs in chloroplasts using chlorophyll. The main inputs are carbon dioxide and water, and the outputs are glucose and oxygen."
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm"
            disabled={isGenerating}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt"
            className="hidden"
            disabled={isGenerating}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload .txt
          </Button>

          <Button
            type="submit"
            disabled={isDisabled}
            className="flex items-center gap-2 ml-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Immersive Notes
              </>
            )}
          </Button>
        </div>

        {!selectedClassId && (
          <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            Please select a class from the dropdown above to generate notes.
          </p>
        )}
      </form>
    </div>
  );
};

export default NotesInput;
