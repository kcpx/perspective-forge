export interface Preset {
  id: string;
  label: string;
  icon: string;
  template: string;
}

export const PRESETS: Preset[] = [
  {
    id: "career",
    label: "Career",
    icon: "💼",
    template: "I'm considering leaving my job to pursue a new opportunity...",
  },
  {
    id: "startup",
    label: "Startup",
    icon: "🚀",
    template: "I'm thinking about starting a business that...",
  },
  {
    id: "relationship",
    label: "Relationship",
    icon: "💬",
    template: "I'm wrestling with a decision about a relationship...",
  },
  {
    id: "move",
    label: "Big Move",
    icon: "🏠",
    template: "I'm considering relocating to a new city because...",
  },
  {
    id: "investment",
    label: "Money",
    icon: "💰",
    template: "I'm debating whether to invest in / spend money on...",
  },
];
