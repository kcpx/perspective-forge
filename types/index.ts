// Perspective types - add new perspectives here
export type PerspectiveType = 
  | "steelman" 
  | "optimist" 
  | "pragmatist" 
  | "pessimist"
  | "blindspots";

export interface PerspectiveConfig {
  id: PerspectiveType;
  name: string;
  icon: string;
  description: string;
  colorClass: string;
}

export interface PerspectiveResult {
  type: PerspectiveType;
  content: string;
  isStreaming: boolean;
}

export interface AnalysisRequest {
  input: string;
  perspectives: PerspectiveType[];
}

// Registry of all perspectives - extend this to add new ones
export const PERSPECTIVES: Record<PerspectiveType, PerspectiveConfig> = {
  steelman: {
    id: "steelman",
    name: "Your Position — Steelmanned",
    icon: "✦",
    description: "The strongest, most charitable version of your thinking",
    colorClass: "steelman",
  },
  optimist: {
    id: "optimist",
    name: "The Optimist",
    icon: "🌅",
    description: "Best case scenarios, opportunities, growth potential",
    colorClass: "optimist",
  },
  pragmatist: {
    id: "pragmatist",
    name: "The Pragmatist",
    icon: "⚖️",
    description: "Trade-offs, evidence, practical constraints",
    colorClass: "pragmatist",
  },
  pessimist: {
    id: "pessimist",
    name: "The Pessimist",
    icon: "🌧️",
    description: "Failure modes, hidden costs, devil's advocate",
    colorClass: "pessimist",
  },
  blindspots: {
    id: "blindspots",
    name: "Blind Spots",
    icon: "🔮",
    description: "What all perspectives missed or assumed",
    colorClass: "blindspots",
  },
};
