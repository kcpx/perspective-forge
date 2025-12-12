"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Clock, ChevronRight } from "lucide-react";
import { PerspectiveCard } from "@/components/PerspectiveCard";
import { DebateModal } from "@/components/DebateModal";
import { HistoryPanel } from "@/components/HistoryPanel";
import { VoiceInput } from "@/components/VoiceInput";
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

  return (
    <main className="min-h-screen bg-forge-bg">
      {/* Split Screen Layout */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* LEFT SIDE - Input (sticky on desktop) */}
        <div className="lg:w-[42%] xl:w-[38%] lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-forge-border bg-forge-bg">
          <div className="p-6 lg:p-10 xl:p-14 flex flex-col min-h-full">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-12 lg:mb-16"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-steelman-primary/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-steelman-primary" />
                </div>
                <span className="text-sm font-medium text-forge-text tracking-tight">Perspective Forge</span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-forge-muted hover:text-forge-text transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
              )}
            </motion.header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center max-w-md">
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h1 className="font-display text-4xl md:text-5xl text-forge-text leading-tight mb-4">
                  What decision are you weighing?
                </h1>
                <p className="text-forge-muted text-base leading-relaxed">
                  Describe your situation. We&apos;ll explore it from multiple perspectives to help you think it through.
                </p>
              </motion.div>

              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="I'm considering..."
                      rows={5}
                      className="w-full bg-forge-surface border border-forge-border rounded-xl px-4 py-4 pr-14 text-forge-text text-base placeholder-forge-muted/60 resize-none focus:border-steelman-primary/40 focus:ring-2 focus:ring-steelman-primary/10 transition-all"
                    />
                    {/* Voice Input Button */}
                    <div className="absolute right-3 bottom-3">
                      <VoiceInput
                        onTranscript={(text) => setInput((prev) => prev + (prev ? " " : "") + text)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-full bg-forge-text hover:bg-forge-text/90 disabled:bg-forge-border disabled:text-forge-muted disabled:cursor-not-allowed text-forge-bg py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Explore perspectives
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Presets */}
                <div className="mt-6 pt-6 border-t border-forge-border">
                  <p className="text-xs text-forge-muted mb-3">Quick starts</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setInput(preset.template)}
                        className="text-sm px-3 py-1.5 rounded-full bg-forge-accent border border-forge-border text-forge-muted hover:text-forge-text hover:border-forge-text/20 transition-all"
                      >
                        {preset.icon} {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Results (scrollable) */}
        <div className="lg:w-[58%] xl:w-[62%] lg:ml-[42%] xl:ml-[38%] min-h-screen">
          {!hasResult ? (
            // Empty state
            <div className="h-full min-h-[50vh] lg:min-h-screen flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center max-w-sm"
              >
                <div className="flex justify-center gap-2 mb-6">
                  {["steelman", "optimist", "pragmatist", "pessimist", "blindspots"].map((type, i) => (
                    <div
                      key={type}
                      className={`w-2 h-2 rounded-full opacity-${20 + i * 15}`}
                      style={{
                        backgroundColor: type === "steelman" ? "#B8860B" :
                          type === "optimist" ? "#D97706" :
                          type === "pragmatist" ? "#6B7280" :
                          type === "pessimist" ? "#4B5563" : "#7C3AED",
                        opacity: 0.2 + i * 0.15
                      }}
                    />
                  ))}
                </div>
                <p className="text-forge-muted text-base">
                  Five perspectives will appear here to help you think through your decision.
                </p>
              </motion.div>
            </div>
          ) : (
            // Results
            <div className="p-6 lg:p-10 xl:p-14">
              {/* User's Question */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 pb-8 border-b border-forge-border"
              >
                <p className="text-xs font-medium text-forge-muted uppercase tracking-wider mb-3">Exploring</p>
                <p className="text-xl text-forge-text font-display leading-relaxed">
                  {input}
                </p>
              </motion.div>

              {/* Section 1: Steelman */}
              <div className="mb-10">
                <PerspectiveCard
                  config={PERSPECTIVES.steelman}
                  content={steelmanContent}
                  isStreaming={streamingPerspective === "steelman"}
                  isLoading={currentPhase === "steelman" && !steelmanContent}
                  variant="hero"
                />
              </div>

              {/* Section 2: The Trifecta */}
              {showTrifecta && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-10"
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-forge-text">Three lenses</h2>
                    <p className="text-sm text-forge-muted">Different ways to see your situation</p>
                  </div>

                  <div className="space-y-4">
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
                      delay={0.15}
                      variant="trifecta"
                    />
                    <PerspectiveCard
                      config={PERSPECTIVES.pessimist}
                      content={pessimistContent}
                      isStreaming={streamingPerspective === "pessimist"}
                      isLoading={!pessimistContent && currentPhase === "trifecta"}
                      delay={0.2}
                      variant="trifecta"
                    />
                  </div>
                </motion.div>
              )}

              {/* Section 3: Blind Spots */}
              {showBlindspots && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-10"
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
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="pt-8 border-t border-forge-border"
                >
                  <div className="mb-5">
                    <h2 className="text-lg font-medium text-forge-text">Go deeper</h2>
                    <p className="text-sm text-forge-muted">Continue the conversation with any perspective</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { config: PERSPECTIVES.optimist, content: optimistContent },
                      { config: PERSPECTIVES.pragmatist, content: pragmatistContent },
                      { config: PERSPECTIVES.pessimist, content: pessimistContent },
                    ].map(({ config, content }) => (
                      <button
                        key={config.colorClass}
                        onClick={() => openDebate(config, content)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-forge-surface border border-forge-border text-forge-text hover:border-forge-text/20 transition-all text-sm"
                      >
                        <span>{config.icon}</span>
                        <span>{config.name.replace("The ", "")}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-forge-muted" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
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
