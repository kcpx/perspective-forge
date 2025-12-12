"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User } from "lucide-react";
import { PerspectiveConfig } from "@/types";

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

const dotColors: Record<string, string> = {
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

  const dotColor = dotColors[perspective.colorClass] || "bg-forge-muted";
  const accentColor = accentColors[perspective.colorClass] || "text-forge-muted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge.trim() || isStreaming) return;

    const userMessage = challenge.trim();
    setChallenge("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

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
            className="fixed inset-0 bg-forge-text/10 z-40"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-forge-bg border-l border-forge-border shadow-elevated z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-forge-border">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                <div>
                  <h3 className="text-lg font-medium text-forge-text">
                    {perspective.name}
                  </h3>
                  <p className="text-sm text-forge-muted">
                    Continue the conversation
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-forge-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-forge-muted" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original perspective response */}
              <div className={`p-4 rounded-xl card-${perspective.colorClass}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className={`text-sm font-medium ${accentColor}`}>
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
                      ? "bg-forge-accent ml-6"
                      : `card-${perspective.colorClass} mr-6`
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {message.role === "user" ? (
                      <>
                        <User className="w-3.5 h-3.5 text-forge-muted" />
                        <span className="text-sm font-medium text-forge-muted">
                          You
                        </span>
                      </>
                    ) : (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span className={`text-sm font-medium ${accentColor}`}>
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
                          animate={{ opacity: [1, 0.3] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className={`inline-block w-0.5 h-4 ${dotColor} ml-1 align-middle`}
                        />
                      )}
                  </p>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-5 border-t border-forge-border bg-forge-bg">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  disabled={isStreaming}
                  className="flex-1 bg-forge-surface border border-forge-border rounded-xl px-4 py-3 text-forge-text text-sm placeholder-forge-muted/60 focus:border-steelman-primary/40 focus:ring-2 focus:ring-steelman-primary/10 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!challenge.trim() || isStreaming}
                  className="bg-forge-text hover:bg-forge-text/90 disabled:bg-forge-border disabled:text-forge-muted disabled:cursor-not-allowed text-forge-bg px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
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
