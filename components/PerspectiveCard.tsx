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
}

const cursorColors: Record<string, string> = {
  steelman: "bg-steelman-primary",
  optimist: "bg-optimist-primary",
  pragmatist: "bg-pragmatist-primary",
  pessimist: "bg-pessimist-primary",
};

export function PerspectiveCard({
  config,
  content,
  isStreaming,
  isLoading,
  delay = 0,
  compact = false,
}: PerspectiveCardProps) {
  const cardClass = `card-${config.colorClass}`;
  const cursorClass = cursorColors[config.colorClass] || "bg-forge-muted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl ${compact ? "p-4" : "p-6"} transition-all duration-300 ${cardClass}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 ${compact ? "mb-3" : "mb-4"}`}>
        <span className={compact ? "text-xl" : "text-2xl"}>{config.icon}</span>
        <div>
          <h3 className={`font-display ${compact ? "text-lg" : "text-xl"} text-forge-text`}>{config.name}</h3>
          {!compact && <p className="text-sm text-forge-muted">{config.description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className={compact ? "min-h-[80px]" : "min-h-[100px]"}>
        {isLoading && !content ? (
          <div className="space-y-3">
            <div className="h-4 bg-forge-border rounded shimmer w-full" />
            <div className="h-4 bg-forge-border rounded shimmer w-5/6" />
            <div className="h-4 bg-forge-border rounded shimmer w-4/6" />
          </div>
        ) : (
          <div className={`text-forge-text leading-relaxed whitespace-pre-wrap ${compact ? "text-sm" : ""}`}>
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`inline-block w-2 h-5 ${cursorClass} ml-1 align-middle`}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
