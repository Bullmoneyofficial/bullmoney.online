"use client";

import React, { memo, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  File,
  Loader2,
  GripVertical
} from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import type { Attachment, AttachmentType } from '@/types/feed';

interface MediaUploaderProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

// Get file type from MIME type
const getFileType = (mimeType: string): AttachmentType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('csv') || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return mimeType.includes('csv') ? 'csv' : 'excel';
  }
  return 'image'; // Default
};

// Get icon for file type
const getFileIcon = (type: AttachmentType) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="w-5 h-5" />;
    case 'pdf':
      return <FileText className="w-5 h-5" />;
    case 'csv':
    case 'excel':
      return <File className="w-5 h-5" />;
    default:
      return <File className="w-5 h-5" />;
  }
};

export const MediaUploader = memo(({
  attachments,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
}: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (attachments.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const newAttachments: Attachment[] = [];

      for (const file of acceptedFiles) {
        // Check file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
          continue;
        }

        // For now, create a local URL. In production, upload to Cloudinary/S3
        const url = URL.createObjectURL(file);
        const type = getFileType(file.type);

        newAttachments.push({
          url,
          type,
          name: file.name,
          size: file.size,
        });
      }

      onChange([...attachments, ...newAttachments]);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, [attachments, maxFiles, maxSizeMB, onChange]);

  const removeAttachment = useCallback((index: number) => {
    SoundEffects.click();
    const newAttachments = [...attachments];
    
    // Revoke object URL to free memory
    if (newAttachments[index].url.startsWith('blob:')) {
      URL.revokeObjectURL(newAttachments[index].url);
    }
    
    newAttachments.splice(index, 1);
    onChange(newAttachments);
  }, [attachments, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: maxFiles - attachments.length,
    disabled: uploading || attachments.length >= maxFiles,
  });

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-white bg-white/10' 
            : 'border-neutral-700 hover:border-white/50'
          }
          ${uploading || attachments.length >= maxFiles 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }
          hover:scale-[1.01] active:scale-[0.99]
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-sm text-neutral-400">Uploading...</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-white" />
            <p className="text-sm text-white">Drop files here</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-neutral-500" />
            <p className="text-sm text-neutral-400">
              Drag & drop files, or <span className="text-white">browse</span>
            </p>
            <p className="text-xs text-neutral-600">
              Images, PDFs, CSV/Excel • Max {maxSizeMB}MB each • {maxFiles - attachments.length} remaining
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Attachment Preview List */}
      <AnimatePresence mode="popLayout">
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {attachments.map((attachment, index) => (
              <motion.div
                key={attachment.url}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700"
              >
                {/* Drag Handle */}
                <GripVertical className="w-4 h-4 text-neutral-600 cursor-grab" />
                
                {/* Preview */}
                {attachment.type === 'image' ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(attachment.type)}
                  </div>
                )}
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{attachment.name}</p>
                  <p className="text-xs text-neutral-500">
                    {attachment.type.toUpperCase()}
                    {attachment.size && ` • ${(attachment.size / 1024 / 1024).toFixed(2)}MB`}
                  </p>
                </div>
                
                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeAttachment(index)}
                  className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MediaUploader.displayName = 'MediaUploader';

export default MediaUploader;
