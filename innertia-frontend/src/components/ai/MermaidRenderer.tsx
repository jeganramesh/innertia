import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import type { MermaidDiagram } from '../../services/aiNotesApi';

interface MermaidRendererProps {
  diagrams: MermaidDiagram[];
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ diagrams }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedDiagrams, setRenderedDiagrams] = useState<Map<string, string>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const renderDiagrams = async () => {
      const newRendered = new Map<string, string>();
      const newErrors = new Map<string, string>();

      for (const diagram of diagrams) {
        try {
          const id = `mermaid-${diagram.title.replace(/\s+/g, '-').toLowerCase()}`;
          const { svg } = await mermaid.render(id, diagram.code);
          newRendered.set(diagram.title, svg);
        } catch (error) {
          console.error(`Error rendering diagram "${diagram.title}":`, error);
          newErrors.set(diagram.title, 'Failed to render diagram. The diagram code may be invalid.');
        }
      }

      setRenderedDiagrams(newRendered);
      setErrors(newErrors);
    };

    if (diagrams.length > 0) {
      renderDiagrams();
    }
  }, [diagrams]);

  if (diagrams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Flow Diagrams
      </h3>

      <div className="grid gap-6">
        {diagrams.map((diagram) => (
          <div
            key={diagram.title}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">{diagram.title}</h4>
            </div>
            <div className="p-4 overflow-x-auto">
              {errors.has(diagram.title) ? (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errors.get(diagram.title)}
                </div>
              ) : renderedDiagrams.has(diagram.title) ? (
                <div
                  className="flex justify-center"
                  dangerouslySetInnerHTML={{ __html: renderedDiagrams.get(diagram.title) || '' }}
                />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <details className="group">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View diagram code
                </summary>
                <pre className="mt-2 p-3 bg-gray-800 text-gray-100 rounded-lg text-xs overflow-x-auto">
                  <code>{diagram.code}</code>
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MermaidRenderer;
