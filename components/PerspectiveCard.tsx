"use client";

import { motion } from "framer-motion";
import { PerspectiveConfig } from "@/types";

interface PerspectiveCardProps {
  config: PerspectiveConfig;
  content: string;
  isStreaming: boolean;
  isLoading: boolean;
  delay?: number;
  compact?: boolean;
  variant?: "hero" | "trifecta" | "insight";
}

const cursorColors: Record<string, string> = {
  steelman: "bg-steelman-primary",
  optimist: "bg-optimist-primary",
  pragmatist: "bg-pragmatist-primary",
  pessimist: "bg-pessimist-primary",
  blindspots: "bg-blindspots-primary",
};

const accentColors: Record<string, string> = {
  steelman: "text-steelman-primary",
  optimist: "text-optimist-primary",
  pragmatist: "text-pragmatist-primary",
  pessimist: "text-pessimist-primary",
  blindspots: "text-blindspots-primary",
};

export function PerspectiveCard({
  config,
  content,
  isStreaming,
  isLoading,
  delay = 0,
  compact = false,
  variant = "trifecta",
}: PerspectiveCardProps) {
  const cardClass = `card-${config.colorClass}`;
  const cursorClass = cursorColors[config.colorClass] || "bg-forge-muted";
  const accentClass = accentColors[config.colorClass] || "text-forge-muted";

  // Hero variant - for Steelman (full width, prominent)
  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`rounded-3xl p-8 md:p-10 transition-all duration-300 ${cardClass} relative overflow-hidden`}
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <span className="text-[120px] leading-none">{config.icon}</span>
        </div>

        {/* Label */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-1.5 h-6 rounded-full ${cursorClass}`} />
          <span className={`text-sm font-medium uppercase tracking-widest ${accentClass}`}>
            {config.name}
          </span>
        </div>

        {/* Content */}
        <div className="relative">
          {isLoading && !content ? (
            <div className="space-y-4">
              <div className="h-5 bg-forge-border/50 rounded-lg shimmer w-full" />
              <div className="h-5 bg-forge-border/50 rounded-lg shimmer w-11/12" />
              <div className="h-5 bg-forge-border/50 rounded-lg shimmer w-4/5" />
            </div>
          ) : (
            <p className="text-xl md:text-2xl text-forge-text leading-relaxed font-light">
              {content}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className={`inline-block w-2 h-6 ${cursorClass} ml-1 align-middle rounded-sm`}
                />
              )}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Insight variant - for Blind Spots (special emphasis)
  if (variant === "insight") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`rounded-3xl p-8 transition-all duration-300 ${cardClass} relative overflow-hidden`}
      >
        {/* Icon centered */}
        <div className="flex justify-center mb-4">
          <span className="text-4xl">{config.icon}</span>
        </div>

        {/* Label */}
        <div className="text-center mb-6">
          <span className={`text-sm font-medium uppercase tracking-widest ${accentClass}`}>
            {config.name}
          </span>
          <p className="text-forge-muted text-sm mt-1">{config.description}</p>
        </div>

        {/* Content */}
        <div className="relative">
          {isLoading && !content ? (
            <div className="space-y-3">
              <div className="h-4 bg-forge-border/50 rounded shimmer w-full" />
              <div className="h-4 bg-forge-border/50 rounded shimmer w-5/6 mx-auto" />
              <div className="h-4 bg-forge-border/50 rounded shimmer w-4/6 mx-auto" />
            </div>
          ) : (
            <p className="text-lg text-forge-text leading-relaxed text-center">
              {content}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className={`inline-block w-2 h-5 ${cursorClass} ml-1 align-middle rounded-sm`}
                />
              )}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Trifecta variant (compact cards for the 3-column grid)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-5 transition-all duration-300 ${cardClass} h-full flex flex-col`}
    >
      {/* Header - icon and label */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cardClass} border border-current/10`}>
          <span className="text-lg">{config.icon}</span>
        </div>
        <span className={`text-sm font-semibold uppercase tracking-wider ${accentClass}`}>
          {config.name.replace("The ", "")}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isLoading && !content ? (
          <div className="space-y-2">
            <div className="h-3 bg-forge-border/50 rounded shimmer w-full" />
            <div className="h-3 bg-forge-border/50 rounded shimmer w-5/6" />
            <div className="h-3 bg-forge-border/50 rounded shimmer w-4/6" />
          </div>
        ) : (
          <p className="text-sm text-forge-text/90 leading-relaxed">
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`inline-block w-1.5 h-4 ${cursorClass} ml-1 align-middle rounded-sm`}
              />
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
