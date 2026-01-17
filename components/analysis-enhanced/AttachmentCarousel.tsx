"use client";

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
} from 'lucide-react';
import type { Attachment, AttachmentType } from '@/types/feed';

interface AttachmentCarouselProps {
  attachments: Attachment[];
  className?: string;
}

const getAttachmentIcon = (type: AttachmentType) => {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'csv':
    case 'excel':
      return FileSpreadsheet;
    default:
      return ImageIcon;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AttachmentCarousel = memo(({
  attachments,
  className = '',
}: AttachmentCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % attachments.length);
  }, [attachments.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
  }, [attachments.length]);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const currentAttachment = attachments[currentIndex];
  const isImage = currentAttachment.type === 'image';

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Display */}
        <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-blue-500/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {isImage ? (
                <img
                  src={currentAttachment.url}
                  alt={currentAttachment.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  {React.createElement(getAttachmentIcon(currentAttachment.type), {
                    className: 'w-16 h-16 text-blue-400 mx-auto mb-3',
                  })}
                  <p className="text-white font-medium text-sm">{currentAttachment.name}</p>
                  {currentAttachment.size && (
                    <p className="text-neutral-500 text-xs mt-1">
                      {formatFileSize(currentAttachment.size)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {attachments.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {isImage && (
              <button
                onClick={() => setLightboxOpen(true)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <a
              href={currentAttachment.url}
              download={currentAttachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>

          {/* Counter */}
          {attachments.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
              {currentIndex + 1} / {attachments.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {attachments.length > 1 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
            {attachments.map((attachment, index) => {
              const Icon = getAttachmentIcon(attachment.type);
              const isActive = index === currentIndex;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all
                    ${isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-neutral-700 hover:border-neutral-500'
                    }
                  `}
                >
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-neutral-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && isImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {attachments.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.img
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={currentAttachment.url}
              alt={currentAttachment.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
              <p className="text-white text-sm">{currentAttachment.name}</p>
              {attachments.length > 1 && (
                <p className="text-neutral-400 text-xs mt-1">
                  {currentIndex + 1} / {attachments.length}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

AttachmentCarousel.displayName = 'AttachmentCarousel';

export default AttachmentCarousel;
