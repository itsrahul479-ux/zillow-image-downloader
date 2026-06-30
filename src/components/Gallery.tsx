import React from "react";
import { Download, ExternalLink, ZoomIn, Check } from "lucide-react";
import { ListingImage } from "../types";
import { motion } from "motion/react";

interface GalleryProps {
  images: ListingImage[];
  selectedUrls: Set<string>;
  onToggleSelect: (url: string) => void;
  onPreview: (idx: number) => void;
  onDownloadSingle: (img: ListingImage) => void;
  onImageLoad?: (url: string, width: number, height: number) => void;
}

export default function Gallery({
  images,
  selectedUrls,
  onToggleSelect,
  onPreview,
  onDownloadSingle,
  onImageLoad,
}: GalleryProps) {
  const handleImageLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight && onImageLoad) {
      onImageLoad(url, img.naturalWidth, img.naturalHeight);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-100 dark:bg-[#0a0a0a] rounded-xl border border-zinc-200 dark:border-zinc-900 p-8 shadow-sm">
        <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium">No images match your active search filter.</p>
        <p className="text-zinc-500 text-xs mt-1">Try resetting your search queries or checking capitalization.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {images.map((image, idx) => {
        const isSelected = selectedUrls.has(image.url);

        return (
          <motion.div
            key={image.url}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 1) }}
            className={`group relative rounded-xl overflow-hidden flex flex-col justify-between border transition-all duration-200 ${
              isSelected 
                ? "border-blue-600 ring-4 ring-blue-600/5 bg-white dark:bg-zinc-900 shadow-md" 
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/30 shadow-sm"
            } h-full`}
          >
            {/* Image container & overlay controls */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
              <img
                src={image.url}
                alt={image.filename}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={(e) => handleImageLoad(image.url, e)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Direct selection checkbox */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(image.url);
                }}
                className="absolute top-3 left-3 z-10 w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? "#2563eb" : "rgba(10, 10, 10, 0.4)",
                  borderColor: isSelected ? "#2563eb" : "rgba(255, 255, 255, 0.2)"
                }}
              >
                {isSelected && <Check className="w-4 h-4 text-white font-extrabold" />}
              </div>

              {/* Hover actions panel */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5">
                {/* Expand / Preview */}
                <button
                  onClick={() => onPreview(idx)}
                  title="Zoom & Inspect Image"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Direct download */}
                <button
                  onClick={() => onDownloadSingle(image)}
                  title="Download Image Directly"
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white backdrop-blur-md border border-blue-400/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Open in new tab */}
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open source image in new tab"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-all flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Title, metadata and details footer */}
            <div className="p-4 bg-zinc-50/60 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span 
                  onClick={() => onPreview(idx)}
                  className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-500 hover:underline cursor-pointer truncate flex-1"
                  title={image.filename}
                >
                  {image.filename}
                </span>
                
                {/* Image resolution */}
                <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shrink-0">
                  {image.width} × {image.height}
                </span>
              </div>

              {/* Action buttons list */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <button
                  type="button"
                  onClick={() => onToggleSelect(image.url)}
                  className="hover:text-blue-600 dark:hover:text-blue-500 font-medium cursor-pointer transition-colors"
                >
                  {isSelected ? "Selected" : "Select image"}
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadSingle(image)}
                  className="hover:text-blue-500 flex items-center gap-1 font-semibold cursor-pointer text-blue-600 dark:text-blue-500 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
