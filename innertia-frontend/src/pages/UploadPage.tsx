import { useEffect, useState } from 'react';
import { MainLayout, ContentWrapper } from '../components/layout/MainLayout';
import { UploadZone } from '../components/faculty/UploadZone';
import { FileList } from '../components/upload/FileList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useUploadStore } from '../stores/uploadStore';
import { useToast } from '../components/ui/Toast';
import {
  CloudUpload,
  FileText,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  Info,
} from 'lucide-react';

export const UploadPage = () => {
  const { uploadQueue, uploadedFiles, cancelUpload, retryUpload, deleteFile, fetchUploadedFiles, isUploading } = useUploadStore();
  const { addToast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();

  useEffect(() => {
    fetchUploadedFiles();
  }, [fetchUploadedFiles]);

  const handleUploadComplete = (fileId: string) => {
    addToast({
      title: 'Upload complete',
      description: 'Your file is being processed by AI',
      variant: 'success',
    });
  };

  const handleRemove = (fileId: string) => {
    cancelUpload(fileId);
    addToast({
      title: 'Upload cancelled',
      variant: 'info',
    });
  };

  const handleRetry = (fileId: string) => {
    retryUpload(fileId);
    addToast({
      title: 'Retrying upload',
      variant: 'info',
    });
  };

  const handleDelete = (fileId: string) => {
    deleteFile(fileId);
    addToast({
      title: 'File deleted',
      variant: 'info',
    });
  };

  const handleDownload = (fileId: string) => {
    addToast({
      title: 'Download started',
      variant: 'success',
    });
  };

  const handlePreview = (fileId: string) => {
    addToast({
      title: 'Opening preview',
      variant: 'info',
    });
  };

  // Calculate overall progress
  const totalFiles = uploadQueue.length;
  const completedUploads = uploadQueue.filter(u => u.status === 'completed').length;
  const overallProgress = totalFiles > 0 ? Math.round((completedUploads / totalFiles) * 100) : 0;

  return (
    <MainLayout
      headerTitle="Upload Content"
      headerBreadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Upload Content' },
      ]}
    >
      <ContentWrapper maxWidth="4xl">
        {/* Header Section - Apple-inspired */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <CloudUpload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Upload Content
              </h1>
              <p className="text-sm text-gray-500">
                AI-enhanced course material processing
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <UploadZone
          classId={selectedClassId}
          onUploadComplete={handleUploadComplete}
        />

        {/* Processing Status */}
        {uploadQueue.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <CardTitle className="text-sm font-medium">
                    AI Processing Status
                  </CardTitle>
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {overallProgress}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ProgressBar
                value={overallProgress}
                size="md"
                animated={isUploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Processing {totalFiles} file(s) with AI features enabled
              </p>
            </CardContent>
          </Card>
        )}

        {/* File List */}
        {(uploadQueue.length > 0 || uploadedFiles.length > 0) && (
          <div className="mt-6">
            <FileList
              uploads={uploadQueue}
              files={uploadedFiles}
              onRemove={handleRemove}
              onRetry={handleRetry}
              onCancel={handleRemove}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onPreview={handlePreview}
            />
          </div>
        )}

        {/* Upload Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" />
              <CardTitle>Upload Guidelines</CardTitle>
            </div>
            <CardDescription>
              Follow these guidelines for optimal AI-enhanced results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Supported File Types
                    </h4>
                    <p className="text-sm text-gray-500">
                      PowerPoint (PPTX, PPT), PDF documents
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      File Size Limit
                    </h4>
                    <p className="text-sm text-gray-500">
                      Maximum 100MB per file for optimal processing
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      AI Features
                    </h4>
                    <p className="text-sm text-gray-500">
                      Text extraction, embeddings, summaries, questions
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Processing Time
                    </h4>
                    <p className="text-sm text-gray-500">
                      Typically 5-30 seconds depending on file size
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ContentWrapper>
    </MainLayout>
  );
};
