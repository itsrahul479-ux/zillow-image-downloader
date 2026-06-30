import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { ListingImage } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PreviewModalProps {
  images: ListingImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onDownloadSingle: (img: ListingImage) => void;
}

export default function PreviewModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onDownloadSingle,
}: PreviewModalProps) {
  const [scale, setScale] = useState(1);
  const activeImage = images[currentIndex];

  useEffect(() => {
    // Reset zoom level on image switch
    setScale(1);
  }, [currentIndex]);

  useEffect(() => {
    // Keyboard navigation listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        onNavigate((currentIndex + 1) % images.length);
      }
      if (e.key === "ArrowLeft") {
        onNavigate((currentIndex - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  if (!activeImage) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.75));
  const handleResetZoom = () => setScale(1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md overflow-hidden select-none">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 backdrop-blur-md bg-black/40 z-10">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
              {activeImage.filename}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span>{activeImage.width} × {activeImage.height}</span>
              <span>•</span>
              <span>Image {currentIndex + 1} of {images.length}</span>
            </div>
          </div>

          {/* Controls menu */}
          <div className="flex items-center gap-3">
            {/* Zoom functions */}
            <div className="flex items-center rounded-xl bg-zinc-900 p-1 border border-zinc-800 gap-1">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.75}
                title="Zoom Out"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset zoom"
                className="px-2.5 py-1 text-xs font-mono font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="Zoom In"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Download */}
            <button
              onClick={() => onDownloadSingle(activeImage)}
              title="Download original file"
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white active:scale-95 border border-blue-400/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Separator */}
            <div className="w-[1px] h-6 bg-zinc-800" />

            {/* Close */}
            <button
              onClick={onClose}
              title="Close modal (ESC)"
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Display & Navigation */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Navigation Arrows */}
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-6 z-10 p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 text-white hover:scale-105 border border-zinc-800 active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Active Image container */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-4"
          >
            <img
              src={activeImage.url}
              alt={activeImage.filename}
              draggable={false}
              referrerPolicy="no-referrer"
              style={{ transform: `scale(${scale})` }}
              className="max-w-[85vw] max-h-[70vh] object-contain rounded-xl shadow-2xl transition-transform duration-150 ease-out border border-zinc-800 pointer-events-auto"
            />
          </motion.div>

          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            className="absolute right-6 z-10 p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 text-white hover:scale-105 border border-zinc-800 active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Thumbnail Strip */}
        <div className="p-4 bg-black/80 border-t border-zinc-900 backdrop-blur-md flex justify-center items-center gap-2 overflow-x-auto select-none py-4.5">
          {images.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={img.url}
                onClick={() => onNavigate(idx)}
                className={`relative shrink-0 w-14 h-10 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  isActive ? "border-blue-500 scale-105" : "border-transparent opacity-40 hover:opacity-80"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>
    </AnimatePresence>
  );
}
