import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, 
  List, 
  GitBranch, 
  Image as ImageIcon, 
  Box, 
  Save, 
  Copy, 
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MermaidRenderer } from './MermaidRenderer';
import { ImageGallery } from './ImageGallery';
import { ThreeDViewer } from './ThreeDViewer';
import type { GenerateResponse } from '../../services/aiNotesApi';

interface NotesViewerProps {
  content: GenerateResponse | null;
  onSave: () => void;
  isSaving: boolean;
}

type TabType = 'overview' | 'details' | 'concepts' | 'diagrams' | 'images' | '3d';

export const NotesViewer: React.FC<NotesViewerProps> = ({ content, onSave, isSaving }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);

  if (!content) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Generated</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter lesson content and click "Generate Immersive Notes" to create structured learning material.
          </p>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    const markdown = generateMarkdown(content);
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'details', label: 'Details', icon: <List className="w-4 h-4" /> },
    { id: 'concepts', label: 'Key Concepts', icon: <List className="w-4 h-4" /> },
    { id: 'diagrams', label: 'Diagrams', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'images', label: 'Images', icon: <ImageIcon className="w-4 h-4" /> },
    { id: '3d', label: '3D View', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Immersive AI-Generated Notes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Markdown'}
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="prose prose-blue max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Overview</h3>
              <p className="text-blue-800 whitespace-pre-wrap">{content.overview}</p>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{section.heading}</h4>
                {section.key_points.length > 0 ? (
                  <ul className="space-y-2">
                    {section.key_points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-2">
                        <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No key points defined for this section.</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'diagrams' && (
          <MermaidRenderer diagrams={content.mermaid_diagrams} />
        )}

        {activeTab === 'images' && (
          <ImageGallery images={content.images} />
        )}

        {activeTab === '3d' && (
          <ThreeDViewer suggestions={content.three_d_suggestions} />
        )}
      </div>
    </div>
  );
};

function generateMarkdown(content: GenerateResponse): string {
  let markdown = `# ${content.title}\n\n`;
  
  markdown += `## Overview\n\n${content.overview}\n\n`;
  
  if (content.sections.length > 0) {
    markdown += `## Detailed Content\n\n`;
    content.sections.forEach((section) => {
      markdown += `### ${section.heading}\n\n`;
      markdown += `${section.content}\n\n`;
      
      if (section.key_points.length > 0) {
        markdown += `**Key Points:**\n`;
        section.key_points.forEach((point) => {
          markdown += `- ${point}\n`;
        });
        markdown += `\n`;
      }
    });
  }
  
  if (content.mermaid_diagrams.length > 0) {
    markdown += `## Diagrams\n\n`;
    content.mermaid_diagrams.forEach((diagram) => {
      markdown += `### ${diagram.title}\n\n`;
      markdown += `\`\`\`mermaid\n${diagram.code}\n\`\`\`\n\n`;
    });
  }
  
  if (content.image_queries.length > 0) {
    markdown += `## Image Queries\n\n`;
    content.image_queries.forEach((query) => {
      markdown += `- ${query}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
}

export default NotesViewer;
