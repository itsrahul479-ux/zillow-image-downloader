import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Sparkles, Server, CheckCircle2 } from "lucide-react";

interface LoadingProgressProps {
  isLoading: boolean;
}

const STEPS = [
  { label: "Opening Listing...", duration: 2200 },
  { label: "Loading Gallery...", duration: 2500 },
  { label: "Extracting Images...", duration: 2400 },
  { label: "Removing Duplicates...", duration: 1800 },
  { label: "Preparing Gallery...", duration: 1500 },
];

export default function LoadingProgress({ isLoading }: LoadingProgressProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIdx(0);
      setProgress(0);
      return;
    }

    // Progress bar speed
    const totalDuration = STEPS.reduce((sum, step) => sum + step.duration, 0);
    const intervalTime = 100;
    const progressStep = (intervalTime / totalDuration) * 100;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 98; // Hold at 98% until server replies
        }
        return prev + progressStep;
      });
    }, intervalTime);

    // Step labels trigger based on accumulated time
    let elapsed = 0;
    const stepTimeouts = STEPS.map((step, idx) => {
      elapsed += step.duration;
      return setTimeout(() => {
        if (idx < STEPS.length - 1) {
          setCurrentStepIdx(idx + 1);
        }
      }, elapsed);
    });

    return () => {
      clearInterval(progressInterval);
      stepTimeouts.forEach(clearTimeout);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 space-y-12">
      {/* Centered progress card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white dark:bg-zinc-900/30 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden text-center space-y-6"
      >
        {/* Loading Spinner */}
        <div className="relative inline-flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative" />
        </div>

        {/* Current Step Label & Progress Counter */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
            {STEPS[currentStepIdx].label}
          </h3>
          <p className="text-xs text-zinc-500 font-mono">
            {Math.round(progress)}% Complete
          </p>
        </div>

        {/* Outer and Inner Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-[#0a0a0a] rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>

        {/* List of active steps */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-left max-w-md mx-auto space-y-2.5">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 transition-colors ${
                  isCompleted ? "text-emerald-600 dark:text-emerald-500" : isActive ? "text-blue-600 dark:text-blue-500 font-semibold" : "text-zinc-400 dark:text-zinc-650"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-650 dark:text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-600 dark:text-blue-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0 flex items-center justify-center text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                    {idx + 1}
                  </div>
                )}
                <span className="text-xs md:text-sm">{step.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Grid of Skeleton Cards for the impending gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
          <span>Staging Grid</span>
          <span>Preparing visual layout...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900/30 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 h-[260px] animate-pulse flex flex-col justify-between p-4 shadow-sm"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-full h-3/5 bg-zinc-150 dark:bg-zinc-800/40 rounded-lg" />
              <div className="space-y-2 pt-4">
                <div className="w-1/3 h-3 bg-zinc-200/80 dark:bg-zinc-800/60 rounded" />
                <div className="w-3/4 h-4 bg-zinc-150 dark:bg-zinc-800/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
