import React from "react";
import { 
  Download, 
  Copy, 
  Trash2, 
  CheckSquare, 
  Square, 
  Search, 
  ArrowUpDown, 
  FileArchive,
  Sparkles
} from "lucide-react";

interface ToolbarProps {
  totalCount: number;
  selectedCount: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  sortBy: "name-asc" | "name-desc";
  onSortChange: (val: "name-asc" | "name-desc") => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onCopyAllUrls: () => void;
  onDownloadSelected: () => void;
  onDownloadAllZip: () => void;
  onClear: () => void;
  isDemoMode: boolean;
  address: string;
}

export default function Toolbar({
  totalCount,
  selectedCount,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  onSelectAll,
  onUnselectAll,
  onCopyAllUrls,
  onDownloadSelected,
  onDownloadAllZip,
  onClear,
  isDemoMode,
  address,
}: ToolbarProps) {
  return (
    <div className="space-y-6">
      {/* Property Title & Address Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Active Extraction</p>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
            {address || "Zillow Listing"}
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800">
              {totalCount} {totalCount === 1 ? "image" : "images"} found
            </span>
            {selectedCount > 0 && (
              <span className="text-blue-600 dark:text-blue-500 font-semibold">
                • {selectedCount} selected for download
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isDemoMode && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/20 text-amber-600 dark:text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
              <span>Failsafe Demo Active</span>
            </div>
          )}
          <button
            onClick={onClear}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-red-500/10 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/20 dark:hover:border-red-500/20 active:scale-95 transition-all text-xs font-medium cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Results
          </button>
        </div>
      </div>

      {/* Main Filter & Action Row */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search images by name (e.g. kitchen, pool)..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-600 rounded-xl text-zinc-800 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-600 focus:outline-none text-xs md:text-sm transition-all focus:ring-4 focus:ring-blue-600/5"
            />
          </div>

          {/* Sort Selection */}
          <div className="relative shrink-0 flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Sort:</span>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="pl-9 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 focus:border-blue-600 rounded-xl text-zinc-700 dark:text-white text-xs md:text-sm focus:outline-none appearance-none cursor-pointer font-medium shadow-sm"
              >
                <option value="name-asc">Filename (A-Z)</option>
                <option value="name-desc">Filename (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action buttons (Zip, Copy, Bulk actions) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select all buttons */}
          <div className="flex items-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 gap-1 shadow-sm">
            <button
              onClick={onSelectAll}
              title="Select all"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-750 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
              <span className="hidden sm:inline">Select All</span>
            </button>
            <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />
            <button
              onClick={onUnselectAll}
              title="Unselect all"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="hidden sm:inline">None</span>
            </button>
          </div>

          {/* Copy URLs */}
          <button
            onClick={onCopyAllUrls}
            title="Copy image source URLs to clipboard"
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
            <span className="hidden md:inline">Copy URLs</span>
          </button>

          {/* Download selected */}
          <button
            onClick={onDownloadSelected}
            disabled={selectedCount === 0}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 hover:text-blue-900 dark:hover:text-white active:scale-95 transition-all text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ({selectedCount})</span>
          </button>

          {/* Download all as ZIP */}
          <button
            onClick={onDownloadAllZip}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white active:scale-95 transition-all text-xs font-bold cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <FileArchive className="w-4 h-4 text-white" />
            <span>ZIP All ({totalCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
