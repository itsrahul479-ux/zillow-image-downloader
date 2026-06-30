import React from "react";
import { X, Clock, Trash2, ArrowRight, Home } from "lucide-react";
import { RecentExtraction } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentListings: RecentExtraction[];
  onSelectRecent: (url: string) => void;
  onRemoveRecent: (url: string) => void;
  onClearAll: () => void;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  recentListings,
  onSelectRecent,
  onRemoveRecent,
  onClearAll,
}: HistorySidebarProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-45 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Sidebar Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md h-full bg-zinc-50 dark:bg-[#0a0a0a] border-l border-zinc-200 dark:border-zinc-900 shadow-2xl flex flex-col justify-between z-50"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between bg-zinc-100/50 dark:bg-black/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-zinc-800 dark:text-white text-base">Extraction History</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {recentListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-12 space-y-3">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-zinc-800 dark:text-white font-semibold text-sm">No History Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-[200px] mx-auto mt-1">
                    Your parsed Zillow listings will appear here for immediate access.
                  </p>
                </div>
              </div>
            ) : (
              recentListings.map((listing) => (
                <div
                  key={listing.url}
                  className="group relative bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 p-4 rounded-xl flex flex-col justify-between gap-3 text-left overflow-hidden cursor-pointer shadow-sm"
                  onClick={() => onSelectRecent(listing.url)}
                >
                  <div className="space-y-1 pr-6">
                    <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors line-clamp-1">
                      {listing.address}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">
                      {listing.url}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      {listing.imageCount} images
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {new Date(listing.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(listing.url);
                    }}
                    title="Remove from history"
                    className="absolute top-3 right-3 p-1 rounded hover:bg-red-500/10 text-zinc-400 dark:text-zinc-500 hover:text-red-650 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer controls */}
          {recentListings.length > 0 && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-black/10 flex gap-3">
              <button
                onClick={onClearAll}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500/20 hover:bg-red-500/10 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm bg-white dark:bg-transparent"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Close History
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
