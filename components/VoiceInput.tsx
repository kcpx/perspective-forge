"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";
      setRecognition(recognitionInstance);
    }
  }, []);

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      setIsListening(true);
      setPermissionDenied(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        onTranscript(final);
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setPermissionDenied(true);
      }
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [recognition, onTranscript]);

  const startListening = useCallback(() => {
    if (recognition && !isListening && !disabled) {
      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
      }
    }
  }, [recognition, isListening, disabled]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setInterimTranscript("");
    }
  }, [recognition, isListening]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      {/* Voice Button */}
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled || permissionDenied}
        className={`
          relative p-2.5 rounded-xl transition-all
          ${isListening
            ? "bg-red-50 text-red-500 border border-red-200"
            : "bg-forge-accent text-forge-muted border border-forge-border hover:text-forge-text hover:border-forge-text/20"
          }
          ${disabled || permissionDenied ? "opacity-50 cursor-not-allowed" : ""}
        `}
        title={
          permissionDenied
            ? "Microphone access denied"
            : isListening
              ? "Stop recording"
              : "Start voice input"
        }
      >
        {isListening ? (
          <>
            <Square className="w-5 h-5" />
            {/* Pulsing ring animation */}
            <motion.span
              className="absolute inset-0 rounded-xl border-2 border-red-400"
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        ) : permissionDenied ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Interim transcript preview */}
      <AnimatePresence>
        {interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-forge-surface border border-forge-border rounded-xl shadow-card min-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs text-forge-muted">Listening...</span>
            </div>
            <p className="text-sm text-forge-text/70 italic">
              {interimTranscript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isListening && !interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-2 p-3 bg-forge-surface border border-forge-border rounded-xl shadow-card"
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs text-forge-muted">Listening...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
