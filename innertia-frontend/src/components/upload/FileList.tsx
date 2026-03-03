import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge, ProgressBadge, type StatusType } from '../ui/StatusBadge';
import { ProgressBar, MultiStepProgress } from '../ui/ProgressBar';
import { formatFileSize, formatDate, getFileType } from '../../utils/formatters';
import type { UploadProgress, UploadedFile, AIFeatures } from '../../types';

interface FileListProps {
  uploads: UploadProgress[];
  files: UploadedFile[];
  onRemove?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onCancel?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  onPreview?: (fileId: string) => void;
  className?: string;
}

const getFileIcon = (fileName: string) => {
  const type = getFileType(fileName);
  const iconClass = 'w-10 h-10';

  switch (type) {
    case 'ppt':
      return (
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <Presentation className="w-5 h-5 text-orange-600" />
        </div>
      );
    case 'pdf':
      return (
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-red-600" />
        </div>
      );
    case 'docx':
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
      );
    case 'xlsx':
      return (
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <File className="w-5 h-5 text-gray-600" />
        </div>
      );
  }
};

const getStatusType = (status: string): StatusType => {
  switch (status) {
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'error':
      return 'error';
    case 'queued':
      return 'queued';
    default:
      return 'uploading';
  }
};

// Processing Steps for AI
const processingSteps = [
  { id: 'extract', label: 'Extract', status: 'pending' },
  { id: 'embed', label: 'Embed', status: 'pending' },
  { id: 'summary', label: 'Summary', status: 'pending' },
  { id: 'questions', label: 'Questions', status: 'pending' },
  { id: 'keywords', label: 'Keywords', status: 'pending' },
];

export const FileList = ({
  uploads,
  files,
  onRemove,
  onRetry,
  onCancel,
  onDelete,
  onDownload,
  onPreview,
  className,
}: FileListProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Combine uploads and completed files
  const allFiles = [
    ...uploads.map((u) => ({
      ...u,
      type: u.file.name.split('.').pop()?.toLowerCase() || 'unknown',
      size: u.file.size,
      modified: new Date(),
    })),
    ...files,
  ];

  if (allFiles.length === 0) {
    return null;
  }

  return (
    <div className={twMerge(clsx('space-y-4', className))}>
      {/* Upload Queue */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              Processing Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploads.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                onRemove={() => onRemove?.(upload.id)}
                onRetry={() => onRetry?.(upload.id)}
                onCancel={() => onCancel?.(upload.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Processed Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onDelete={() => onDelete?.(file.id)}
                onDownload={() => onDownload?.(file.id)}
                onPreview={() => onPreview?.(file.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Upload Item Component
interface UploadItemProps {
  upload: UploadProgress;
  onRemove: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

const UploadItem = ({ upload, onRemove, onRetry, onCancel }: UploadItemProps) => {
  const isProcessing = upload.status === 'processing';

  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {getFileIcon(upload.file.name)}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{upload.file.name}</span>
            <StatusBadge status={getStatusType(upload.status)} size="sm" />
          </div>
          <span className="text-sm text-gray-500">{formatFileSize(upload.file.size)}</span>
        </div>

        {isProcessing ? (
          <MultiStepProgress
            steps={processingSteps}
            progress={upload.progress}
            currentStep="Processing slides for AI..."
          />
        ) : (
          <ProgressBar
            value={upload.progress}
            size="sm"
            showLabel={false}
            animated={upload.status === 'uploading'}
          />
        )}

        {upload.error && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {upload.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {upload.status === 'error' && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
        {(upload.status === 'uploading' || upload.status === 'queued') && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

// File Item Component
interface FileItemProps {
  file: UploadedFile;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
}

const FileItem = ({ file, onDelete, onDownload, onPreview }: FileItemProps) => {
  const allFeaturesComplete = file.aiFeatures && Object.values(file.aiFeatures).every(Boolean);

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      {getFileIcon(file.name)}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{file.name}</span>
            {allFeaturesComplete && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Sparkles className="w-3 h-3" />
                AI Ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
            <StatusBadge status={getStatusType(file.status)} size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Modified: {formatDate(file.uploadedAt)}</span>
          {file.processingDetails?.slidesProcessed && (
            <span>
              {file.processingDetails.slidesProcessed} slides processed
            </span>
          )}
        </div>

        {/* AI Features */}
        {file.aiFeatures && (
          <div className="flex flex-wrap gap-2 mt-3">
            <AIFeatureBadge label="Text" active={file.aiFeatures.textExtracted} />
            <AIFeatureBadge label="Embeddings" active={file.aiFeatures.embeddingsGenerated} />
            <AIFeatureBadge label="Summary" active={file.aiFeatures.summaryGenerated} />
            <AIFeatureBadge label="Questions" active={file.aiFeatures.questionsGenerated} />
            <AIFeatureBadge label="Keywords" active={file.aiFeatures.keywordsExtracted} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPreview}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// AI Feature Badge
interface AIFeatureBadgeProps {
  label: string;
  active: boolean;
}

const AIFeatureBadge = ({ label, active }: AIFeatureBadgeProps) => (
  <span
    className={twMerge(
      clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors',
        active
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-50 text-gray-500 border-gray-200'
      )
    )}
  >
    {active ? (
      <CheckCircle className="w-3 h-3" />
    ) : (
      <Clock className="w-3 h-3" />
    )}
    {label}
  </span>
);
