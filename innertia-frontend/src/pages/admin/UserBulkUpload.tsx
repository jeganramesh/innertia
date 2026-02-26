/**
 * Admin User Bulk Upload Page
 * Allows admin to upload CSV/Excel files to create multiple users at once
 */

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { adminApiService, BulkUploadResponse } from '../../services/adminApi';

export const UserBulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension || '')) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile || null);
  };

  // Upload file
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await adminApiService.bulkUploadUsers(file);
      setResult(uploadResult);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to upload file. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Clear file
  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csvContent = 'full_name,email,role,password,is_active\nJohn Doe,john.doe@example.com,student,changeme123,true\nJane Smith,jane.smith@example.com,faculty,changeme123,true\nAdmin User,admin@example.com,admin,changeme123,true';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Bulk User Upload
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Upload a CSV or Excel file to create or update multiple users at once.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          className="h-11 px-5 rounded-xl flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </Button>
      </div>

      {/* Upload Section - Apple Style */}
      <div className="bg-white rounded-2xl p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Upload File</h2>
        
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-[#0071e3] bg-[#0071e3]/5'
              : file
              ? 'border-green-500 bg-green-50/50'
              : 'border-[#d2d2d7] hover:border-[#0071e3] bg-[#f5f5f7]/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="w-14 h-14 text-green-600 mb-4" />
              <p className="font-medium text-[#1d1d1f] text-lg">{file.name}</p>
              <p className="text-sm text-[#86868b] mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={handleClear}
                className="mt-4 text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-14 h-14 text-[#86868b] mb-4" />
              <p className="text-[#1d1d1f] mb-2">
                Drag and drop your file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#0071e3] hover:underline font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-[#86868b]">
                Supports CSV, XLSX, XLS (max 5MB)
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="h-12 px-8 rounded-xl flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Users
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-2xl p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Upload Results</h2>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-2xl p-5 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-semibold text-green-700">{result.created_count}</p>
              <p className="text-sm text-green-600">Created</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-semibold text-blue-700">{result.updated_count}</p>
              <p className="text-sm text-blue-600">Updated</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-3xl font-semibold text-red-700">{result.failed_rows.length}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
          </div>

          {/* Failed Rows Table */}
          {result.failed_rows.length > 0 && (
            <div>
              <h3 className="font-medium text-[#1d1d1f] mb-3">Failed Rows</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d2d2d7]">
                      <th className="text-left py-3 px-4 font-medium text-[#86868b]">Row</th>
                      <th className="text-left py-3 px-4 font-medium text-[#86868b]">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-[#86868b]">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failed_rows.map((row, index) => (
                      <tr key={index} className="border-b border-[#f5f5f7]">
                        <td className="py-3 px-4 text-[#1d1d1f]">{row.row}</td>
                        <td className="py-3 px-4 text-[#86868b]">{row.email || '-'}</td>
                        <td className="py-3 px-4 text-red-600">{row.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result.failed_rows.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                All {result.created_count + result.updated_count} users were processed successfully!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions - Apple Style */}
      <div className="bg-white rounded-2xl p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">File Format Instructions</h2>
        <div className="text-[#86868b] space-y-3">
          <p className="">Your file must contain the following columns:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>full_name</strong> - User's full name</li>
            <li><strong>email</strong> - User's email address (must be unique)</li>
            <li><strong>role</strong> - User role: <code className="bg-[#f5f5f7] px-2 py-0.5 rounded">student</code>, <code className="bg-[#f5f5f7] px-2 py-0.5 rounded">faculty</code>, or <code className="bg-[#f5f5f7] px-2 py-0.5 rounded">admin</code></li>
            <li><strong>is_active</strong> - Account status: <code className="bg-[#f5f5f7] px-2 py-0.5 rounded">true</code> or <code className="bg-[#f5f5f7] px-2 py-0.5 rounded">false</code></li>
          </ul>
          <p className="mt-4 text-[#1d1d1f]">
            <strong>Note:</strong> If a user with the same email already exists, their information will be updated instead of creating a new user.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserBulkUpload;
