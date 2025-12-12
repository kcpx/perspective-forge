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

const accentColors: Record<string, string> = {
  steelman: "text-steelman-primary",
  optimist: "text-optimist-primary",
  pragmatist: "text-pragmatist-primary",
  pessimist: "text-pessimist-primary",
  blindspots: "text-blindspots-primary",
};

const dotColors: Record<string, string> = {
  steelman: "bg-steelman-primary",
  optimist: "bg-optimist-primary",
  pragmatist: "bg-pragmatist-primary",
  pessimist: "bg-pessimist-primary",
  blindspots: "bg-blindspots-primary",
};

export function PerspectiveCard({
  config,
  content,
  isStreaming,
  isLoading,
  delay = 0,
  variant = "trifecta",
}: PerspectiveCardProps) {
  const cardClass = `card-${config.colorClass}`;
  const accentClass = accentColors[config.colorClass] || "text-forge-muted";
  const dotClass = dotColors[config.colorClass] || "bg-forge-muted";

  // Hero variant - for Steelman (prominent, featured)
  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`rounded-2xl p-6 md:p-8 ${cardClass}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className={`text-sm font-medium ${accentClass}`}>
            {config.name}
          </span>
        </div>

        {/* Content */}
        <div>
          {isLoading && !content ? (
            <div className="space-y-3">
              <div className="h-5 bg-forge-border/30 rounded-lg shimmer w-full" />
              <div className="h-5 bg-forge-border/30 rounded-lg shimmer w-11/12" />
              <div className="h-5 bg-forge-border/30 rounded-lg shimmer w-4/5" />
            </div>
          ) : (
            <p className="text-lg md:text-xl text-forge-text leading-relaxed">
              {content}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className={`inline-block w-0.5 h-5 ${dotClass} ml-1 align-middle`}
                />
              )}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Insight variant - for Blind Spots
  if (variant === "insight") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`rounded-2xl p-6 ${cardClass}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className={`text-sm font-medium ${accentClass}`}>
            {config.name}
          </span>
        </div>

        {/* Content */}
        <div>
          {isLoading && !content ? (
            <div className="space-y-2">
              <div className="h-4 bg-forge-border/30 rounded shimmer w-full" />
              <div className="h-4 bg-forge-border/30 rounded shimmer w-5/6" />
              <div className="h-4 bg-forge-border/30 rounded shimmer w-4/6" />
            </div>
          ) : (
            <p className="text-base text-forge-text leading-relaxed">
              {content}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className={`inline-block w-0.5 h-4 ${dotClass} ml-1 align-middle`}
                />
              )}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Trifecta variant (cards for the 3-column layout)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-xl p-5 ${cardClass}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span className={`text-sm font-medium ${accentClass}`}>
          {config.name.replace("The ", "")}
        </span>
      </div>

      {/* Content */}
      <div>
        {isLoading && !content ? (
          <div className="space-y-2">
            <div className="h-3.5 bg-forge-border/30 rounded shimmer w-full" />
            <div className="h-3.5 bg-forge-border/30 rounded shimmer w-5/6" />
            <div className="h-3.5 bg-forge-border/30 rounded shimmer w-4/6" />
          </div>
        ) : (
          <p className="text-sm text-forge-text/90 leading-relaxed">
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className={`inline-block w-0.5 h-3.5 ${dotClass} ml-1 align-middle`}
              />
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
