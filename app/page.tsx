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
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-steelman-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blindspots-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
          {/* Nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-16"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-steelman-primary" />
              <span className="text-sm text-forge-muted font-medium">Perspective Forge</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forge-surface/50 border border-forge-border hover:border-steelman-primary/30 transition-all group"
              >
                <Clock className="w-4 h-4 text-forge-muted group-hover:text-steelman-primary transition-colors" />
                <span className="text-sm text-forge-muted group-hover:text-forge-text transition-colors">
                  {history.length} past {history.length === 1 ? "session" : "sessions"}
                </span>
              </button>
            )}
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-forge-text mb-6 leading-tight">
              What&apos;s on your mind?
            </h1>
            <p className="text-forge-muted text-lg md:text-xl max-w-2xl mx-auto">
              Share a decision you&apos;re wrestling with. We&apos;ll help you see it from every angle.
            </p>
          </motion.div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            {/* Presets as subtle suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="text-sm text-forge-muted/60">Try:</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setInput(preset.template)}
                  className="text-sm text-forge-muted hover:text-steelman-primary transition-colors"
                >
                  {preset.icon} {preset.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-steelman-primary/20 via-optimist-primary/20 to-pessimist-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-forge-surface border border-forge-border rounded-2xl p-2 focus-within:border-steelman-primary/30 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="I'm thinking about..."
                    rows={3}
                    className="w-full bg-transparent px-4 py-3 text-forge-text text-lg placeholder-forge-muted/50 resize-none focus:outline-none"
                  />
                  <div className="flex justify-end px-2 pb-2">
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="bg-steelman-primary hover:bg-steelman-primary/90 disabled:bg-forge-border disabled:cursor-not-allowed text-forge-bg px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          Explore
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Results */}
        {hasResult && (
          <div className="bg-forge-surface/30 border-t border-forge-border">
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
              {/* User's Question - Echo back what they asked */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-forge-muted text-sm uppercase tracking-widest mb-3">Your Question</p>
                <p className="text-xl md:text-2xl text-forge-text font-display italic max-w-2xl mx-auto">
                  &ldquo;{input}&rdquo;
                </p>
              </motion.div>

              {/* Section 1: Steelman - Hero Card */}
              <PerspectiveCard
                config={PERSPECTIVES.steelman}
                content={steelmanContent}
                isStreaming={streamingPerspective === "steelman"}
                isLoading={currentPhase === "steelman" && !steelmanContent}
                variant="hero"
              />

              {/* Section 2: The Trifecta */}
              {showTrifecta && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Section Header */}
                  <div className="text-center">
                    <p className="text-forge-muted text-sm uppercase tracking-widest mb-2">Three Lenses</p>
                    <h2 className="font-display text-2xl md:text-3xl text-forge-text">
                      See it from every angle
                    </h2>
                  </div>

                  {/* Three perspective cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PerspectiveCard
                      config={PERSPECTIVES.optimist}
                      content={optimistContent}
                      isStreaming={streamingPerspective === "optimist"}
                      isLoading={!optimistContent && currentPhase === "trifecta"}
                      delay={0.1}
                      variant="trifecta"
                    />
                    <PerspectiveCard
                      config={PERSPECTIVES.pragmatist}
                      content={pragmatistContent}
                      isStreaming={streamingPerspective === "pragmatist"}
                      isLoading={!pragmatistContent && currentPhase === "trifecta"}
                      delay={0.2}
                      variant="trifecta"
                    />
                    <PerspectiveCard
                      config={PERSPECTIVES.pessimist}
                      content={pessimistContent}
                      isStreaming={streamingPerspective === "pessimist"}
                      isLoading={!pessimistContent && currentPhase === "trifecta"}
                      delay={0.3}
                      variant="trifecta"
                    />
                  </div>
                </motion.div>
              )}

              {/* Section 3: Blind Spots - Insight Card */}
              {showBlindspots && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-2xl mx-auto"
                >
                  <PerspectiveCard
                    config={PERSPECTIVES.blindspots}
                    content={blindspotsContent}
                    isStreaming={streamingPerspective === "blindspots"}
                    isLoading={currentPhase === "blindspots" && !blindspotsContent}
                    variant="insight"
                  />
                </motion.div>
              )}

              {/* Section 4: Debate Mode */}
              {currentPhase === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-center space-y-6"
                >
                  <div>
                    <p className="text-forge-muted text-sm uppercase tracking-widest mb-2">Not convinced?</p>
                    <h2 className="font-display text-2xl text-forge-text">
                      Challenge a perspective
                    </h2>
                  </div>

                  {/* Debate Buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => openDebate(PERSPECTIVES.optimist, optimistContent)}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-forge-bg border border-optimist-primary/30 text-optimist-primary hover:bg-optimist-primary/10 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Push back on Optimist
                    </button>
                    <button
                      onClick={() => openDebate(PERSPECTIVES.pragmatist, pragmatistContent)}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-forge-bg border border-pragmatist-primary/30 text-pragmatist-primary hover:bg-pragmatist-primary/10 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Push back on Pragmatist
                    </button>
                    <button
                      onClick={() => openDebate(PERSPECTIVES.pessimist, pessimistContent)}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-forge-bg border border-pessimist-primary/30 text-pessimist-primary hover:bg-pessimist-primary/10 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Push back on Pessimist
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
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
