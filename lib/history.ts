export interface HistorySession {
  id: string;
  input: string;
  timestamp: number;
  perspectives: {
    steelman: string;
    optimist: string;
    pragmatist: string;
    pessimist: string;
    blindspots: string;
  };
}

const STORAGE_KEY = "perspective-forge-history";
const MAX_HISTORY = 20;

export function getHistory(): HistorySession[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: Omit<HistorySession, "id" | "timestamp">): HistorySession {
  const newSession: HistorySession = {
    ...session,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };

  const history = getHistory();
  const updated = [newSession, ...history].slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full or unavailable
  }

  return newSession;
}

export function deleteSession(id: string): void {
  const history = getHistory();
  const updated = history.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage unavailable
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable
  }
}

export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
