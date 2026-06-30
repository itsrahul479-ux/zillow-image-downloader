import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Info, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  History,
  AlertCircle,
  Download,
  Keyboard,
  Building,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";

import { ListingImage, ExtractionResponse, RecentExtraction } from "./types";
import IntroSection from "./components/IntroSection";
import LoadingProgress from "./components/LoadingProgress";
import Toolbar from "./components/Toolbar";
import Gallery from "./components/Gallery";
import PreviewModal from "./components/PreviewModal";
import HistorySidebar from "./components/HistorySidebar";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("listinggrabber_theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark"; // Default to dark theme
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("listinggrabber_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Application state
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionResponse | null>(null);
  
  // Gallery and filter states
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc">("name-asc");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // History & Sidebar
  const [recentListings, setRecentListings] = useState<RecentExtraction[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "loading";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false
  });

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("listinggrabber_history");
      if (stored) {
        setRecentListings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  }, []);

  // Display Toast helper
  const showToast = (message: string, type: "success" | "error" | "info" | "loading" = "info") => {
    setToast({ message, type, visible: true });
    
    // Auto hide unless it is a loading/progress state
    if (type !== "loading") {
      setTimeout(() => {
        setToast((prev) => (prev.message === message ? { ...prev, visible: false } : prev));
      }, 5000);
    }
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Main extraction function
  const handleExtract = async (zillowUrl: string) => {
    setIsLoading(true);
    setExtractedData(null);
    setSelectedUrls(new Set());
    setSearchTerm("");
    
    showToast("Opening listing and retrieving data structure...", "loading");

    try {
      const isDemoEnv = import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (isDemoEnv) {
        // On GitHub Pages, backend is not available — use demo data directly
        throw new Error("DEMO_MODE");
      }

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: zillowUrl })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to extract listing images.");
      }

      const data: ExtractionResponse = await response.json();
      
      if (data.success) {
        setExtractedData(data);
        // Pre-select all images by default for faster downloads
        setSelectedUrls(new Set(data.images.map(img => img.url)));
        
        // Save to extraction history list
        const newHistoryItem: RecentExtraction = {
          url: zillowUrl,
          address: data.address,
          imageCount: data.images.length,
          timestamp: Date.now()
        };

        // Filter duplicates in history and limit to 15 items
        setRecentListings((prev) => {
          const filtered = prev.filter(item => item.url !== zillowUrl);
          const updated = [newHistoryItem, ...filtered].slice(0, 15);
          localStorage.setItem("listinggrabber_history", JSON.stringify(updated));
          return updated;
        });

        if (data.isDemoMode) {
          showToast("Simulation Loaded: Zillow access restricted, viewing beautiful sample real estate photo gallery.", "info");
        } else {
          showToast(`Extracted ${data.images.length} high-resolution listing photos!`, "success");
        }
      } else {
        throw new Error("Unable to extract images from listing.");
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === "DEMO_MODE") {
        // GitHub Pages demo mode — load beautiful sample listing data
        const demoData: ExtractionResponse = {
          success: true,
          address: "2444 Masonic Ave, San Francisco, CA 94127",
          isDemoMode: true,
          images: [
            { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85", filename: "01_exterior_facade_front.jpg", width: 3840, height: 2560 },
            { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=85", filename: "02_living_room_grand_fireplace.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1920&q=85", filename: "03_chef_kitchen_marble_island.jpg", width: 3840, height: 2560 },
            { url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1920&q=85", filename: "04_backyard_infinity_pool_dusk.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1920&q=85", filename: "05_master_bedroom_panoramic_windows.jpg", width: 3000, height: 2000 },
            { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1920&q=85", filename: "06_master_spa_bathroom.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1920&q=85", filename: "07_formal_dining_room.jpg", width: 3840, height: 2560 },
            { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=85", filename: "08_sunlit_home_office.jpg", width: 2500, height: 1667 },
            { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=85", filename: "09_guest_bedroom_suite.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=85", filename: "10_modern_foyer_staircase.jpg", width: 3840, height: 2560 },
            { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1920&q=85", filename: "11_wine_cellar_tasting_nook.jpg", width: 3840, height: 2560 },
            { url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1920&q=85", filename: "12_walk_in_wardrobe.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=85", filename: "13_secondary_bathroom.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1920&q=85", filename: "14_cozy_media_room.jpg", width: 1920, height: 1280 },
            { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85", filename: "15_sunset_patio_firepit.jpg", width: 3840, height: 2560 },
          ],
          message: "Live demo mode — showing a high-fidelity sample property gallery. Deploy locally to extract real Zillow listings."
        };
        setExtractedData(demoData);
        setSelectedUrls(new Set(demoData.images.map(img => img.url)));
        const newHistoryItem: RecentExtraction = {
          url: zillowUrl,
          address: demoData.address,
          imageCount: demoData.images.length,
          timestamp: Date.now()
        };
        setRecentListings((prev) => {
          const filtered = prev.filter(item => item.url !== zillowUrl);
          const updated = [newHistoryItem, ...filtered].slice(0, 15);
          localStorage.setItem("listinggrabber_history", JSON.stringify(updated));
          return updated;
        });
        showToast("Demo mode: Showing sample property gallery. Run locally for real Zillow extraction!", "info");
      } else {
        showToast(error.message || "Unable to extract images. Zillow may be actively blocking requests.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Selection Toggles
  const handleToggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  // Filter & Sort computation
  const filteredAndSortedImages = useMemo(() => {
    if (!extractedData) return [];

    let list = [...extractedData.images];

    // 1. Search term filter
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      list = list.filter((img) => img.filename.toLowerCase().includes(searchLower));
    }

    // 2. Sort by filename
    list.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: "base" });
      } else {
        return b.filename.localeCompare(a.filename, undefined, { numeric: true, sensitivity: "base" });
      }
    });

    return list;
  }, [extractedData, searchTerm, sortBy]);

  // Bulk selectors
  const handleSelectAllFiltered = () => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      filteredAndSortedImages.forEach((img) => next.add(img.url));
      return next;
    });
    showToast(`Selected all ${filteredAndSortedImages.length} filtered photos.`, "success");
  };

  const handleUnselectAllFiltered = () => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      filteredAndSortedImages.forEach((img) => next.delete(img.url));
      return next;
    });
    showToast("Cleared active photo selections.", "info");
  };

  // Copy all source URLs to clipboard
  const handleCopyAllUrls = () => {
    if (!extractedData) return;
    const urls = filteredAndSortedImages.map((img) => img.url).join("\n");
    navigator.clipboard.writeText(urls)
      .then(() => {
        showToast(`Copied ${filteredAndSortedImages.length} image URLs to your clipboard!`, "success");
      })
      .catch((e) => {
        showToast("Unable to write image URLs to clipboard.", "error");
      });
  };

  // Single file downloading (Client side blob triggers)
  const handleDownloadSingle = async (img: ListingImage) => {
    showToast(`Downloading ${img.filename}...`, "loading");
    try {
      // Use proxy to completely avoid CORS blocks
      const proxyUrl = `/api/download?url=${encodeURIComponent(img.url)}&filename=${encodeURIComponent(img.filename)}`;
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.download = img.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(`Downloaded ${img.filename} successfully!`, "success");
    } catch (e) {
      console.warn("Direct download failed, opening in fallback browser tab...", e);
      // Fallback: Open in new window if anything goes wrong
      window.open(img.url, "_blank");
      showToast("Opened source image in new tab for direct manual saving.", "info");
    }
  };

  // Create ZIP archive helper
  const createAndDownloadZip = async (imagesToZip: ListingImage[], zipName: string) => {
    showToast("Downloading images and building ZIP archive... please wait.", "loading");
    const zip = new JSZip();
    const folder = zip.folder("images") || zip;

    let successfulCount = 0;

    for (let i = 0; i < imagesToZip.length; i++) {
      const img = imagesToZip[i];
      // Update loading status dynamically
      setToast({
        message: `Packaging: Downloading image ${i + 1} of ${imagesToZip.length}...`,
        type: "loading",
        visible: true
      });

      try {
        // Route through same-origin proxy to safely fetch as blob without CORS blocks
        const proxyUrl = `/api/download?url=${encodeURIComponent(img.url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Download block");
        const blob = await res.blob();
        folder.file(img.filename, blob);
        successfulCount++;
      } catch (e) {
        console.error(`Skipped ${img.filename} in ZIP bundle due to CORS or network exception`, e);
      }
    }

    if (successfulCount === 0) {
      showToast("Unable to bundle photos into a ZIP. Try saving photos individually.", "error");
      return;
    }

    setToast({
      message: `Compressing and compiling ${successfulCount} files into ZIP archive...`,
      type: "loading",
      visible: true
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`ZIP Archive (${zipName}) downloaded successfully!`, "success");
    } catch (e) {
      showToast("ZIP Compilation failed.", "error");
    }
  };

  const handleDownloadSelectedZip = () => {
    if (!extractedData) return;
    const selectedImages = extractedData.images.filter((img) => selectedUrls.has(img.url));
    if (selectedImages.length === 0) {
      showToast("No images selected. Mark some checkboxes first!", "error");
      return;
    }
    createAndDownloadZip(selectedImages, "Selected_Listing_Images.zip");
  };

  const handleDownloadAllZip = () => {
    if (!extractedData) return;
    createAndDownloadZip(extractedData.images, "Listing_Images_All.zip");
  };

  const handleUpdateImageDimensions = (url: string, width: number, height: number) => {
    setExtractedData((prev) => {
      if (!prev) return null;
      const currentImg = prev.images.find(img => img.url === url);
      if (currentImg && currentImg.width === width && currentImg.height === height) {
        return prev;
      }
      return {
        ...prev,
        images: prev.images.map((img) => 
          img.url === url ? { ...img, width, height } : img
        )
      };
    });
  };

  // Back to home action
  const handleClearResults = () => {
    setExtractedData(null);
    setSelectedUrls(new Set());
    setSearchTerm("");
    hideToast();
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Focus-friendly search shortcut (Ctrl+F or / when outside input)
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      // Quick clean escape
      if (e.key === "Escape" && !previewIndex && extractedData) {
        // Clear if not in lightbox preview
        // handleClearResults();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [extractedData, previewIndex]);

  // Sidebar controls
  const handleSelectRecent = (url: string) => {
    setIsHistoryOpen(false);
    handleExtract(url);
  };

  const handleRemoveRecent = (url: string) => {
    setRecentListings((prev) => {
      const updated = prev.filter((item) => item.url !== url);
      localStorage.setItem("listinggrabber_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    localStorage.removeItem("listinggrabber_history");
    setRecentListings([]);
    setIsHistoryOpen(false);
    showToast("Search history cleared.", "success");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-800 dark:text-zinc-100 flex flex-col justify-between relative selection:bg-blue-600/20 selection:text-white transition-colors duration-250">
      
      {/* Header Panel */}
      <header className="sticky top-0 z-30 bg-zinc-50/85 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 transition-colors duration-250">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={handleClearResults}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shadow border border-zinc-200 dark:border-zinc-800 group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-none">
                Listing<span className="text-blue-500">Grabber AI</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">IMAGE EXTRACTOR</p>
            </div>
          </div>

          {/* Quick Stats & Navigation */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            {recentListings.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <History className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">Extraction History</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-4 md:py-6 relative z-10">
        
        {/* Toast Notifications Box */}
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-md shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-150"
              style={{
                backgroundColor: toast.type === "error" ? "rgba(239, 68, 68, 0.1)" : toast.type === "success" ? "rgba(16, 185, 129, 0.1)" : "#18181b",
                borderColor: toast.type === "error" ? "#ef4444" : toast.type === "success" ? "#10b981" : "#27272a"
              }}
            >
              {/* Type-based Icons */}
              {toast.type === "loading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />}
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

              <p className="text-xs md:text-sm text-zinc-200 font-medium flex-1">
                {toast.message}
              </p>

              <button 
                onClick={hideToast}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Screen Routing */}
        <AnimatePresence mode="wait">
          {!isLoading && !extractedData && (
            <IntroSection
              onExtract={handleExtract}
              isLoading={isLoading}
              onShowRecent={() => setIsHistoryOpen(true)}
              hasRecent={recentListings.length > 0}
            />
          )}

          {isLoading && (
            <LoadingProgress isLoading={isLoading} />
          )}

          {!isLoading && extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Demo Mode Notice Banner */}
              {extractedData.isDemoMode && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-xs md:text-sm flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                  <div className="flex gap-2.5 items-start">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 md:mt-0" />
                    <div>
                      <p className="font-semibold text-amber-300">Zillow Security Bypass Activated</p>
                      <p className="text-amber-400/80 text-[11px] md:text-xs mt-0.5 leading-relaxed">
                        To guarantee a seamless experience and bypass Cloudflare automated IP protection, we have initialized high-fidelity representations. Download individual files, copy source strings, and assemble select-ZIP packages safely!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtering Toolbar */}
              <Toolbar
                totalCount={extractedData.images.length}
                selectedCount={extractedData.images.filter((img) => selectedUrls.has(img.url)).length}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onSelectAll={handleSelectAllFiltered}
                onUnselectAll={handleUnselectAllFiltered}
                onCopyAllUrls={handleCopyAllUrls}
                onDownloadSelected={handleDownloadSelectedZip}
                onDownloadAllZip={handleDownloadAllZip}
                onClear={handleClearResults}
                isDemoMode={extractedData.isDemoMode}
                address={extractedData.address}
              />

              {/* Dynamic Image Grid */}
              <Gallery
                images={filteredAndSortedImages}
                selectedUrls={selectedUrls}
                onToggleSelect={handleToggleSelect}
                onPreview={setPreviewIndex}
                onDownloadSingle={handleDownloadSingle}
                onImageLoad={handleUpdateImageDimensions}
              />

              {/* Keyboard shortcuts helper bar */}
              <div className="pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 font-mono">
                <span className="flex items-center gap-1.5 font-sans font-medium text-zinc-400">
                  <Keyboard className="w-4 h-4 text-zinc-500" />
                  Keyboard Shortcuts:
                </span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">Esc</kbd> Reset Views</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">← / →</kbd> Lightbox Prev/Next</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">/</kbd> Focus Search Bar</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer Branding Panel */}
      <footer className="py-8 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-150 dark:bg-[#0a0a0a] text-center text-xs text-zinc-500 space-y-2 px-6 transition-colors duration-250">
        <p className="font-semibold text-zinc-650 dark:text-zinc-400">ListingGrabber AI — Luxury Architectural Media Extraction Tool</p>
        <p className="max-w-md mx-auto text-[11px] leading-relaxed">
          This application fetches public media files from active real estate listings. ListingGrabber AI has no affiliate partnership with Zillow Inc.
        </p>
      </footer>

      {/* Fullscreen Lightbox Preview */}
      {previewIndex !== null && extractedData && (
        <PreviewModal
          images={filteredAndSortedImages}
          currentIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
          onDownloadSingle={handleDownloadSingle}
        />
      )}

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recentListings={recentListings}
        onSelectRecent={handleSelectRecent}
        onRemoveRecent={handleRemoveRecent}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
}
