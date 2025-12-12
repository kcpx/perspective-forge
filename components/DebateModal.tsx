"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquare } from "lucide-react";
import { PerspectiveConfig, PerspectiveType } from "@/types";

interface DebateMessage {
  role: "user" | "perspective";
  content: string;
}

interface DebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  perspective: PerspectiveConfig;
  originalInput: string;
  perspectiveResponse: string;
}

const borderColors: Record<string, string> = {
  steelman: "border-steelman-primary/30",
  optimist: "border-optimist-primary/30",
  pragmatist: "border-pragmatist-primary/30",
  pessimist: "border-pessimist-primary/30",
  blindspots: "border-blindspots-primary/30",
};

const buttonColors: Record<string, string> = {
  steelman: "bg-steelman-primary hover:bg-steelman-primary/90",
  optimist: "bg-optimist-primary hover:bg-optimist-primary/90",
  pragmatist: "bg-pragmatist-primary hover:bg-pragmatist-primary/90",
  pessimist: "bg-pessimist-primary hover:bg-pessimist-primary/90",
  blindspots: "bg-blindspots-primary hover:bg-blindspots-primary/90",
};

const cursorColors: Record<string, string> = {
  steelman: "bg-steelman-primary",
  optimist: "bg-optimist-primary",
  pragmatist: "bg-pragmatist-primary",
  pessimist: "bg-pessimist-primary",
  blindspots: "bg-blindspots-primary",
};

export function DebateModal({
  isOpen,
  onClose,
  perspective,
  originalInput,
  perspectiveResponse,
}: DebateModalProps) {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [challenge, setChallenge] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const borderColor = borderColors[perspective.colorClass] || "border-forge-border";
  const buttonColor = buttonColors[perspective.colorClass] || "bg-forge-muted";
  const cursorColor = cursorColors[perspective.colorClass] || "bg-forge-muted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge.trim() || isStreaming) return;

    const userMessage = challenge.trim();
    setChallenge("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    // Get the last perspective response for context
    const lastPerspectiveResponse =
      messages.length > 0
        ? messages.filter((m) => m.role === "perspective").pop()?.content ||
          perspectiveResponse
        : perspectiveResponse;

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perspective: perspective.id,
          originalInput,
          perspectiveResponse: lastPerspectiveResponse,
          challenge: userMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let accumulated = "";

      // Add empty perspective message that we'll update
      setMessages((prev) => [...prev, { role: "perspective", content: "" }]);

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
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "perspective",
                    content: accumulated,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Debate error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "perspective",
          content: "Something went wrong. Please try again.",
        };
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setChallenge("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-forge-surface rounded-2xl border border-forge-border z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{perspective.icon}</span>
                <div>
                  <h3 className="font-display text-lg text-forge-text">
                    Debate: {perspective.name}
                  </h3>
                  <p className="text-sm text-forge-muted">
                    Challenge this perspective
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-forge-border rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-forge-muted" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Original perspective response */}
              <div className={`p-4 rounded-xl card-${perspective.colorClass}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{perspective.icon}</span>
                  <span className="text-sm font-medium text-forge-text">
                    {perspective.name}
                  </span>
                </div>
                <p className="text-sm text-forge-text leading-relaxed">
                  {perspectiveResponse}
                </p>
              </div>

              {/* Debate messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${
                    message.role === "user"
                      ? "bg-forge-border/50 ml-8"
                      : `card-${perspective.colorClass} mr-8`
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.role === "user" ? (
                      <>
                        <MessageSquare className="w-4 h-4 text-forge-muted" />
                        <span className="text-sm font-medium text-forge-muted">
                          You
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{perspective.icon}</span>
                        <span className="text-sm font-medium text-forge-text">
                          {perspective.name}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-forge-text leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {isStreaming &&
                      message.role === "perspective" &&
                      index === messages.length - 1 && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className={`inline-block w-2 h-4 ${cursorColor} ml-1 align-middle`}
                        />
                      )}
                  </p>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-forge-border">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  placeholder="Challenge this perspective..."
                  disabled={isStreaming}
                  className="flex-1 bg-forge-bg border border-forge-border rounded-xl px-4 py-3 text-forge-text placeholder-forge-muted focus:ring-2 focus:ring-forge-border transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!challenge.trim() || isStreaming}
                  className={`${buttonColor} disabled:bg-forge-border disabled:cursor-not-allowed text-forge-bg px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
