"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare, Clock } from "lucide-react";
import { PerspectiveCard } from "@/components/PerspectiveCard";
import { DebateModal } from "@/components/DebateModal";
import { HistoryPanel } from "@/components/HistoryPanel";
import { PERSPECTIVES, PerspectiveType, PerspectiveConfig } from "@/types";
import { PRESETS } from "@/lib/presets";
import { getHistory, saveSession, HistorySession } from "@/lib/history";

export default function Home() {
  const [input, setInput] = useState("");
  const [steelmanContent, setSteelmanContent] = useState("");
  const [optimistContent, setOptimistContent] = useState("");
  const [pragmatistContent, setPragmatistContent] = useState("");
  const [pessimistContent, setPessimistContent] = useState("");
  const [blindspotsContent, setBlindspotsContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingPerspective, setStreamingPerspective] = useState<PerspectiveType | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"steelman" | "trifecta" | "blindspots" | "done">("steelman");

  // Debate mode state
  const [debateOpen, setDebateOpen] = useState(false);
  const [debatePerspective, setDebatePerspective] = useState<PerspectiveConfig | null>(null);
  const [debateResponse, setDebateResponse] = useState("");

  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  const fetchPerspective = useCallback(
    async (perspective: PerspectiveType, setContent: (s: string) => void) => {
      setStreamingPerspective(perspective);
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
      setStreamingPerspective(null);
    },
    [input]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setSteelmanContent("");
    setOptimistContent("");
    setPragmatistContent("");
    setPessimistContent("");
    setBlindspotsContent("");
    setHasResult(true);
    setCurrentPhase("steelman");

    try {
      // Phase 1: Steelman
      await fetchPerspective("steelman", setSteelmanContent);

      // Phase 2: Trifecta (in parallel)
      setCurrentPhase("trifecta");
      await Promise.all([
        fetchPerspective("optimist", setOptimistContent),
        fetchPerspective("pragmatist", setPragmatistContent),
        fetchPerspective("pessimist", setPessimistContent),
      ]);

      // Phase 3: Blind Spots
      setCurrentPhase("blindspots");
      await fetchPerspective("blindspots", setBlindspotsContent);

      setCurrentPhase("done");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setStreamingPerspective(null);
    }
  };

  // Save to history after all perspectives complete
  useEffect(() => {
    if (currentPhase === "done" && steelmanContent && optimistContent && pragmatistContent && pessimistContent && blindspotsContent) {
      saveSession({
        input,
        perspectives: {
          steelman: steelmanContent,
          optimist: optimistContent,
          pragmatist: pragmatistContent,
          pessimist: pessimistContent,
          blindspots: blindspotsContent,
        },
      });
      refreshHistory();
    }
  }, [currentPhase, input, steelmanContent, optimistContent, pragmatistContent, pessimistContent, blindspotsContent]);

  // Load a session from history
  const loadSession = (session: HistorySession) => {
    setInput(session.input);
    setSteelmanContent(session.perspectives.steelman);
    setOptimistContent(session.perspectives.optimist);
    setPragmatistContent(session.perspectives.pragmatist);
    setPessimistContent(session.perspectives.pessimist);
    setBlindspotsContent(session.perspectives.blindspots);
    setHasResult(true);
    setCurrentPhase("done");
  };

  const showTrifecta = currentPhase === "trifecta" || currentPhase === "blindspots" || currentPhase === "done";
  const showBlindspots = currentPhase === "blindspots" || currentPhase === "done";

  const openDebate = (perspective: PerspectiveConfig, response: string) => {
    setDebatePerspective(perspective);
    setDebateResponse(response);
    setDebateOpen(true);
  };

  const perspectiveContents: Record<PerspectiveType, string> = {
    steelman: steelmanContent,
    optimist: optimistContent,
    pragmatist: pragmatistContent,
    pessimist: pessimistContent,
    blindspots: blindspotsContent,
  };

  return (
    <main className="min-h-screen bg-forge-bg">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-steelman-glow via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="font-display text-5xl md:text-6xl text-forge-text">
              Perspective Forge
            </h1>
            {history.length > 0 && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="p-2.5 rounded-xl bg-forge-surface border border-forge-border hover:border-steelman-primary/30 transition-all group"
                title="View history"
              >
                <Clock className="w-5 h-5 text-forge-muted group-hover:text-steelman-primary transition-colors" />
              </button>
            )}
          </div>
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
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setInput(preset.template)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-forge-surface border border-forge-border hover:border-steelman-primary/30 text-forge-muted hover:text-forge-text transition-all"
              >
                <span>{preset.icon}</span>
                {preset.label}
              </button>
            ))}
          </div>

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

        {/* Results */}
        {hasResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            {/* Section 1: Steelman */}
            <PerspectiveCard
              config={PERSPECTIVES.steelman}
              content={steelmanContent}
              isStreaming={streamingPerspective === "steelman"}
              isLoading={currentPhase === "steelman" && !steelmanContent}
            />

            {/* Section 2: The Trifecta */}
            {showTrifecta && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Section Label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-forge-border" />
                  <span className="text-forge-muted text-sm font-medium uppercase tracking-wider">
                    The Trifecta
                  </span>
                  <div className="h-px flex-1 bg-forge-border" />
                </div>

                {/* Three perspective cards in a row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PerspectiveCard
                    config={PERSPECTIVES.optimist}
                    content={optimistContent}
                    isStreaming={streamingPerspective === "optimist"}
                    isLoading={!optimistContent && currentPhase === "trifecta"}
                    delay={0.1}
                    compact
                  />
                  <PerspectiveCard
                    config={PERSPECTIVES.pragmatist}
                    content={pragmatistContent}
                    isStreaming={streamingPerspective === "pragmatist"}
                    isLoading={!pragmatistContent && currentPhase === "trifecta"}
                    delay={0.2}
                    compact
                  />
                  <PerspectiveCard
                    config={PERSPECTIVES.pessimist}
                    content={pessimistContent}
                    isStreaming={streamingPerspective === "pessimist"}
                    isLoading={!pessimistContent && currentPhase === "trifecta"}
                    delay={0.3}
                    compact
                  />
                </div>
              </motion.div>
            )}

            {/* Section 3: Blind Spots */}
            {showBlindspots && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Section Label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-forge-border" />
                  <span className="text-forge-muted text-sm font-medium uppercase tracking-wider">
                    The Aha Moment
                  </span>
                  <div className="h-px flex-1 bg-forge-border" />
                </div>

                <PerspectiveCard
                  config={PERSPECTIVES.blindspots}
                  content={blindspotsContent}
                  isStreaming={streamingPerspective === "blindspots"}
                  isLoading={currentPhase === "blindspots" && !blindspotsContent}
                />
              </motion.div>
            )}

            {/* Section 4: Debate Mode */}
            {currentPhase === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Section Label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-forge-border" />
                  <span className="text-forge-muted text-sm font-medium uppercase tracking-wider">
                    Go Deeper
                  </span>
                  <div className="h-px flex-1 bg-forge-border" />
                </div>

                {/* Debate Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => openDebate(PERSPECTIVES.optimist, optimistContent)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-optimist-glow border border-optimist-primary/30 text-optimist-primary hover:bg-optimist-primary/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Debate Optimist
                  </button>
                  <button
                    onClick={() => openDebate(PERSPECTIVES.pragmatist, pragmatistContent)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pragmatist-glow border border-pragmatist-primary/30 text-pragmatist-primary hover:bg-pragmatist-primary/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Debate Pragmatist
                  </button>
                  <button
                    onClick={() => openDebate(PERSPECTIVES.pessimist, pessimistContent)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pessimist-glow border border-pessimist-primary/30 text-pessimist-primary hover:bg-pessimist-primary/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Debate Pessimist
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Debate Modal */}
      {debatePerspective && (
        <DebateModal
          isOpen={debateOpen}
          onClose={() => setDebateOpen(false)}
          perspective={debatePerspective}
          originalInput={input}
          perspectiveResponse={debateResponse}
        />
      )}

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelect={loadSession}
        onHistoryChange={refreshHistory}
      />
    </main>
  );
}
