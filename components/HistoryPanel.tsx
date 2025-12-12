"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Clock } from "lucide-react";
import { HistorySession, formatTimestamp, deleteSession, clearHistory } from "@/lib/history";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistorySession[];
  onSelect: (session: HistorySession) => void;
  onHistoryChange: () => void;
}

export function HistoryPanel({
  isOpen,
  onClose,
  history,
  onSelect,
  onHistoryChange,
}: HistoryPanelProps) {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    onHistoryChange();
  };

  const handleClear = () => {
    if (confirm("Clear all history? This cannot be undone.")) {
      clearHistory();
      onHistoryChange();
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-forge-text/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-forge-bg border-l border-forge-border shadow-elevated z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-forge-border">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-forge-muted" />
                <h2 className="text-lg font-medium text-forge-text">History</h2>
                <span className="text-sm text-forge-muted">({history.length})</span>
              </div>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-sm text-forge-muted hover:text-red-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-forge-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-forge-muted" />
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-10 h-10 text-forge-border mx-auto mb-4" />
                  <p className="text-forge-muted">No history yet</p>
                  <p className="text-sm text-forge-muted/70 mt-1">
                    Your explorations will appear here
                  </p>
                </div>
              ) : (
                history.map((session) => (
                  <motion.button
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      onSelect(session);
                      onClose();
                    }}
                    className="w-full text-left p-4 rounded-xl bg-forge-surface border border-forge-border hover:border-steelman-primary/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-forge-text line-clamp-2 text-sm flex-1 leading-relaxed">
                        {session.input}
                      </p>
                      <button
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <p className="text-xs text-forge-muted mt-2">
                      {formatTimestamp(session.timestamp)}
                    </p>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
