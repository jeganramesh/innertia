/**
 * Admin User Bulk Upload Page
 * Allows admin to upload CSV/Excel files to create multiple users at once
 */

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
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
    const csvContent = 'full_name,email,role,is_active\nJohn Doe,john.doe@example.com,student,true\nJane Smith,jane.smith@example.com,faculty,true\nAdmin User,admin@example.com,admin,true';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk User Upload</h1>
          <p className="text-slate-500 mt-1">
            Upload a CSV or Excel file to create or update multiple users at once
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </Button>
      </div>

      {/* Upload Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Upload File</h2>
        
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="w-12 h-12 text-green-600 mb-3" />
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={handleClear}
                className="mt-3 text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-slate-600 mb-1">
                Drag and drop your file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-slate-500">
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
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
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
            className="inline-flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
      </Card>

      {/* Results Card */}
      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Results</h2>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{result.created_count}</p>
              <p className="text-sm text-green-600">Created</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{result.updated_count}</p>
              <p className="text-sm text-blue-600">Updated</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{result.failed_rows.length}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
          </div>

          {/* Failed Rows Table */}
          {result.failed_rows.length > 0 && (
            <div>
              <h3 className="font-medium text-slate-900 mb-3">Failed Rows</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Row</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Email</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failed_rows.map((row, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-900">{row.row}</td>
                        <td className="py-2 px-3 text-slate-600">{row.email || '-'}</td>
                        <td className="py-2 px-3 text-red-600">{row.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result.failed_rows.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                All {result.created_count + result.updated_count} users were processed successfully!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Instructions Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">File Format Instructions</h2>
        <div className="prose prose-sm max-w-none text-slate-600">
          <p className="mb-3">Your file must contain the following columns:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>full_name</strong> - User's full name</li>
            <li><strong>email</strong> - User's email address (must be unique)</li>
            <li><strong>role</strong> - User role: <code>student</code>, <code>faculty</code>, or <code>admin</code></li>
            <li><strong>is_active</strong> - Account status: <code>true</code> or <code>false</code></li>
          </ul>
          <p className="mt-3">
            <strong>Note:</strong> If a user with the same email already exists, their information will be updated instead of creating a new user.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UserBulkUpload;
