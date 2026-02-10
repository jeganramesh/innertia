import { useState, useCallback, useRef } from 'react';
import { Upload as UploadIcon, FileText, X, CheckCircle, AlertCircle, File, Presentation, CloudUpload, ArrowUpTray } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { useUploadStore } from '../../stores/uploadStore';
import { useToast } from '../ui/Toast';
import { formatFileSize, isValidFileType, isValidFileSize, getFileType, generateId } from '../../utils/formatters';
import type { UploadProgress } from '../../types';

interface UploadZoneProps {
  classId?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
  onUploadComplete?: (fileId: string) => void;
}

const DEFAULT_ALLOWED_TYPES = ['ppt', 'pptx', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
const DEFAULT_MAX_SIZE_MB = 100;

export const UploadZone = ({
  classId,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  onUploadComplete,
}: UploadZoneProps) => {
  const { uploadFile, uploadQueue, cancelUpload, retryUpload, isUploading } = useUploadStore();
  const { addToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [classId]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [classId]
  );

  const validateFile = (file: File): string | null => {
    if (!isValidFileType(file, allowedTypes)) {
      return `Invalid file type. Allowed: ${allowedTypes.join(', ').toUpperCase()}`;
    }
    if (!isValidFileSize(file, maxSizeMB)) {
      return `File too large. Maximum size is ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      const error = validateFile(file);
      if (error) {
        addToast({
          title: 'Invalid file',
          description: error,
          variant: 'error',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    addToast({
      title: 'Files queued',
      description: `${validFiles.length} file(s) ready for upload`,
      variant: 'success',
    });

    // Add files to upload queue
    for (const file of validFiles) {
      try {
        const fileId = generateId();
        await uploadFile(file, classId);
        onUploadComplete?.(fileId);
      } catch (error) {
        addToast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'error',
        });
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const type = getFileType(fileName);
    const iconClass = 'w-5 h-5';

    switch (type) {
      case 'ppt':
        return <Presentation className={iconClass} />;
      case 'pdf':
        return <FileText className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone - Apple-inspired design */}
      <Card
        className={`
          border-2 border-dashed transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}
          ${isUploading ? 'opacity-60 pointer-events-none' : ''}
          cursor-pointer
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <CardContent className="py-16 px-8">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Upload Icon - Apple-style */}
            <div
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
                transition-all duration-300
              `}
            >
              <CloudUpload
                size={32}
                className={`
                  transition-colors duration-300
                  ${isDragging ? 'text-blue-600' : 'text-gray-400'}
                `}
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload course materials for AI-enhanced features
            </h3>
            
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Drag & drop PPT or PDF files here, or{' '}
              <button
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
              >
                click to browse
              </button>
            </p>

            {/* File Type Badges */}
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                .PPTX
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                .PDF
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
                .DOCX
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Maximum file size: {maxSizeMB}MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.map((t) => `.${t}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={isUploading}
      />

      {/* Upload Progress - Only show active uploads */}
      {uploadQueue.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">
              Processing files for AI...
            </h4>
            <span className="text-sm text-gray-500">
              {uploadQueue.length} file(s)
            </span>
          </div>

          <div className="space-y-4">
            {uploadQueue.map((upload) => (
              <UploadProgressItem
                key={upload.id}
                upload={upload}
                onCancel={() => cancelUpload(upload.id)}
                onRetry={() => retryUpload(upload.id)}
                getFileIcon={getFileIcon}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface UploadProgressItemProps {
  upload: UploadProgress;
  onCancel: () => void;
  onRetry: () => void;
  getFileIcon: (fileName: string) => React.ReactNode;
}

const UploadProgressItem = ({ upload, onCancel, onRetry, getFileIcon }: UploadProgressItemProps) => {
  const { file, progress, status, error } = upload;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* File Icon */}
      <div className="flex-shrink-0">
        {getFileIcon(file.name)}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </span>
            <StatusBadge
              status={status === 'processing' ? 'processing' : status === 'completed' ? 'completed' : status === 'error' ? 'error' : 'uploading'}
              size="sm"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={progress}
          size="sm"
          showLabel={false}
          animated={status === 'uploading' || status === 'processing'}
        />

        {/* Error Message */}
        {status === 'error' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>{error || 'Upload failed'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {status === 'error' ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : status !== 'completed' ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null
        }
      </div>
    </div>
  );
};
