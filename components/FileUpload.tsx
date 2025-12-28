import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  label: string;
  accept: string;
  fileData?: FileData;
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, accept, fileData, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      
      {!fileData ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            id={`file-upload-${label}`}
          />
          <label htmlFor={`file-upload-${label}`} className="flex flex-col items-center cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-400 mt-1">PDF or CSV</p>
          </label>
        </div>
      ) : (
        <div className={`
          border rounded-xl p-4 flex items-center justify-between
          ${fileData.status === 'ERROR' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}
        `}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${fileData.status === 'READY' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-slate-800 truncate">{fileData.file.name}</span>
              <span className="text-xs text-slate-500">{(fileData.file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fileData.status === 'PARSING' && (
              <div className="flex items-center gap-2 text-blue-600 text-xs font-medium bg-blue-50 px-3 py-1 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                Parsing...
              </div>
            )}
            {fileData.status === 'READY' && (
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Ready
              </div>
            )}
            {fileData.status === 'ERROR' && (
               <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 px-3 py-1 rounded-full">
               <AlertCircle className="w-3 h-3" />
               Error
             </div>
            )}
          </div>
        </div>
      )}
      {fileData?.error && (
        <p className="text-xs text-red-500 mt-1">{fileData.error}</p>
      )}
    </div>
  );
};
