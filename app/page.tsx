"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { PerspectiveCard } from "@/components/PerspectiveCard";
import { PERSPECTIVES, PerspectiveType } from "@/types";

export default function Home() {
  const [input, setInput] = useState("");
  const [steelmanContent, setSteelmanContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const fetchPerspective = useCallback(
    async (perspective: PerspectiveType, setContent: (s: string) => void) => {
      const response = await fetch("/api/perspectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, perspective }),
      });

      if (!response.ok) throw new Error("Failed to fetch perspective");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setContent(accumulated);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    },
    [input]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setIsStreaming(true);
    setSteelmanContent("");
    setHasResult(true);

    try {
      await fetchPerspective("steelman", setSteelmanContent);
    } catch (error) {
      console.error("Error:", error);
      setSteelmanContent("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <main className="min-h-screen bg-forge-bg">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-steelman-glow via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-5xl md:text-6xl text-forge-text mb-4">
            Perspective Forge
          </h1>
          <p className="text-forge-muted text-lg">
            See your thinking from every angle
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mb-12"
        >
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share a decision, belief, or idea you're wrestling with..."
              rows={4}
              className="w-full bg-forge-surface border border-forge-border rounded-2xl px-6 py-4 text-forge-text placeholder-forge-muted resize-none focus:ring-2 focus:ring-steelman-primary/30 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute bottom-4 right-4 bg-steelman-primary hover:bg-steelman-primary/90 disabled:bg-forge-border disabled:cursor-not-allowed text-forge-bg px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Forging...
                </>
              ) : (
                <>
                  Forge
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Results - MVP: Steelman only */}
        {hasResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <PerspectiveCard
              config={PERSPECTIVES.steelman}
              content={steelmanContent}
              isStreaming={isStreaming}
              isLoading={isLoading}
            />

            {/* Placeholder for future sections */}
            {!isLoading && steelmanContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center"
              >
                <p className="text-forge-muted text-sm">
                  🚧 More perspectives coming soon: Optimist, Pragmatist,
                  Pessimist, and Blind Spots
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
