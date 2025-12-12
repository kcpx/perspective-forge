"use client";

import { motion } from "framer-motion";
import { PerspectiveConfig } from "@/types";

interface PerspectiveCardProps {
  config: PerspectiveConfig;
  content: string;
  isStreaming: boolean;
  isLoading: boolean;
  delay?: number;
}

export function PerspectiveCard({
  config,
  content,
  isStreaming,
  isLoading,
  delay = 0,
}: PerspectiveCardProps) {
  const cardClass = `card-${config.colorClass}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-6 transition-all duration-300 ${cardClass}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h3 className="font-display text-xl text-forge-text">{config.name}</h3>
          <p className="text-sm text-forge-muted">{config.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[100px]">
        {isLoading && !content ? (
          <div className="space-y-3">
            <div className="h-4 bg-forge-border rounded shimmer w-full" />
            <div className="h-4 bg-forge-border rounded shimmer w-5/6" />
            <div className="h-4 bg-forge-border rounded shimmer w-4/6" />
          </div>
        ) : (
          <div className="text-forge-text leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-2 h-5 bg-steelman-primary ml-1 align-middle"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
