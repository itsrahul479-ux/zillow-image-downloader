import React, { useState, useEffect } from "react";
import { Link, Clipboard, Sparkles, Building2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface IntroSectionProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
  onShowRecent: () => void;
  hasRecent: boolean;
}

export default function IntroSection({ onExtract, isLoading, onShowRecent, hasRecent }: IntroSectionProps) {
  const [urlInput, setUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const sampleUrl = "https://www.zillow.com/homedetails/2444-Masonic-Ave-San-Francisco-CA-94127/15148679_zpid/";

  const handlePasteSample = () => {
    setUrlInput(sampleUrl);
    setErrorMsg("");
  };

  const validateAndSubmit = (urlToValidate: string) => {
    const trimmed = urlToValidate.trim();
    if (!trimmed) {
      setErrorMsg("URL cannot be empty.");
      return;
    }

    const isZillow = trimmed.startsWith("https://www.zillow.com/") || trimmed.startsWith("https://zillow.com/");
    if (!isZillow) {
      setErrorMsg("Please enter a valid Zillow URL starting with https://www.zillow.com/");
      return;
    }

    setErrorMsg("");
    onExtract(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit(urlInput);
  };

  // Clipboard paste detection helper
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith("https://") && text.includes("zillow.com")) {
        setUrlInput(text);
        setErrorMsg("");
      }
    } catch (e) {
      // Browser permission denied, ignore
    }
  };

  // Drag and drop support
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const text = e.dataTransfer?.getData("text");
      if (text) {
        setUrlInput(text);
        validateAndSubmit(text);
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-start w-full px-4 py-2 md:py-4 overflow-hidden">
      {/* Clean elegant minimal canvas */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Drag overlay notice */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-4 border-dashed border-zinc-300 dark:border-zinc-700 m-4 rounded-3xl pointer-events-none"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Drop Zillow Link</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-sm">Release to instantly paste and parse the property listing images</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl text-center space-y-6"
      >
        {/* Logo Icon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold tracking-wider uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          Powered by Playwright & AI
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Listing<span className="text-blue-500">Grabber AI</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto font-medium leading-relaxed">
            Paste a Zillow listing URL to instantly extract every available property image in a beautiful minimalist gallery.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="bg-white dark:bg-zinc-900/30 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <Link className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Paste Zillow listing URL here..."
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setErrorMsg("");
                }}
                disabled={isLoading}
                className="w-full pl-11 pr-24 py-4 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-750 focus:border-blue-600 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all font-medium text-sm md:text-base"
              />
              
              {/* Inside paste helper */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 dark:text-red-400 text-xs font-semibold text-left pl-1"
                >
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
              >
                <Building2 className="w-4 h-4" />
                {isLoading ? "Analyzing..." : "Extract Images"}
              </button>

              {hasRecent && (
                <button
                  type="button"
                  onClick={onShowRecent}
                  className="sm:w-auto px-5 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all text-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  History
                </button>
              )}
            </div>
          </form>

          {/* Quick Example */}
          <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2.5">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Example URL:</span>
            <button
              onClick={handlePasteSample}
              type="button"
              className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 hover:underline font-mono truncate max-w-full sm:max-w-xs md:max-w-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
            >
              zillow.com/homedetails/2444-Masonic-Ave...
            </button>
          </div>
        </div>

        {/* Feature benefits list */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 text-left">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h4 className="text-zinc-800 dark:text-zinc-200 font-semibold text-xs md:text-sm mb-1">Max Resolution</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Always extracts the highest quality uncompressed source photos available.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h4 className="text-zinc-800 dark:text-zinc-200 font-semibold text-xs md:text-sm mb-1">Smart Deduplication</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Automatically identifies and cleans duplicate images and empty thumbnails.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm col-span-2 md:col-span-1">
            <h4 className="text-zinc-800 dark:text-zinc-200 font-semibold text-xs md:text-sm mb-1">Instant ZIP Bundle</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Pack select images or the entire gallery into a cleanly named ZIP archive instantly.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
