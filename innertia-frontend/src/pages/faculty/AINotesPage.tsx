import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { NotesInput } from '../../components/ai/NotesInput';
import { NotesViewer } from '../../components/ai/NotesViewer';
import { aiNotesApi, GenerateResponse, AINoteOut } from '../../services/aiNotesApi';
import { facultyApiService, ClassWithEnrollment } from '../../services/facultyApi';
import { Sparkles, FileText, LayoutGrid } from 'lucide-react';

// Mock class for testing when API is not available
const MOCK_CLASSES: ClassWithEnrollment[] = [
  {
    id: 'cryptography-class',
    name: 'cryptography',
    description: 'An introduction to cryptography covering symmetric and asymmetric encryption, hash functions, digital signatures, and cryptographic protocols.',
    is_active: true,
    enrollment_count: 0,
    created_at: new Date().toISOString(),
  },
];

// Types
interface ClassOption {
  id: string;
  name: string;
}

export const AINotesPage: React.FC = () => {
  const { toast } = useToast();
  
  // Default class ID for testing
  const DEFAULT_CLASS_ID = 'cryptography-class';
  
  // State
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(DEFAULT_CLASS_ID);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateResponse | null>(null);
  const [currentLessonTitle, setCurrentLessonTitle] = useState('');
  const [currentRawText, setCurrentRawText] = useState('');
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await facultyApiService.getClasses();
        if (response.length > 0) {
          setClasses(response);
          // Only update selectedClassId if not already set or using default
          if (!selectedClassId || selectedClassId === DEFAULT_CLASS_ID) {
            setSelectedClassId(response[0].id);
          }
        } else {
          // Use mock classes if API returns empty
          setClasses(MOCK_CLASSES);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        // Use mock classes on error for testing
        setClasses(MOCK_CLASSES);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [toast]);

  // Handle generate
  const handleGenerate = async (lessonTitle: string, rawText: string) => {
    if (!selectedClassId) {
      toast({
        title: 'Error',
        description: 'Please select a class first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setCurrentLessonTitle(lessonTitle);
    setCurrentRawText(rawText);

    try {
      const response = await aiNotesApi.generateNotes({
        class_id: selectedClassId,
        lesson_title: lessonTitle,
        raw_text: rawText,
      });

      setGeneratedContent(response);
      toast({
        title: 'Success',
        description: 'Immersive notes generated successfully!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error generating notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!generatedContent || !selectedClassId) return;

    setIsSaving(true);

    try {
      // Convert generated content to structured content object
      const structuredContent = {
        title: generatedContent.title,
        overview: generatedContent.overview,
        sections: generatedContent.sections,
        mermaid_diagrams: generatedContent.mermaid_diagrams,
        image_queries: generatedContent.image_queries,
        three_d_suggestions: generatedContent.three_d_suggestions,
        images: generatedContent.images,
      };

      await aiNotesApi.saveNotes({
        class_id: selectedClassId,
        lesson_title: currentLessonTitle,
        raw_text: currentRawText,
        structured_content: structuredContent,
      });

      toast({
        title: 'Success',
        description: 'Notes saved successfully!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            AI Notes Generator
          </h1>
          <p className="text-base text-[#86868b] mt-2">
            Transform raw lesson notes into immersive learning content.
          </p>
        </div>
        {/* Class Selector */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#86868b]" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isLoadingClasses}
            className="px-4 py-2 border border-[#d2d2d7] rounded-xl focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] bg-white min-w-[200px] text-[#1d1d1f]"
          >
            {isLoadingClasses ? (
              <option>Loading classes...</option>
            ) : classes.length > 0 ? (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))
            ) : (
              <option value="">No classes available</option>
            )}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <div className="space-y-4">
          <NotesInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            selectedClassId={selectedClassId}
          />

          {/* Tips Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Tips for Best Results
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Include key terms and definitions in your raw notes</li>
              <li>• Mention processes or relationships you want diagrams for</li>
              <li>• Add context about what students should learn</li>
              <li>• Keep raw notes between 100-2000 characters for best output</li>
            </ul>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-4">
          <NotesViewer
            content={generatedContent}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default AINotesPage;
