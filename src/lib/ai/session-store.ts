export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type BookingDraft = {
  service?: string;
  vehicle?: string;
  branch?: string;
  date?: string;
  time?: string;
  confirmed?: boolean;
};

export type SessionState = {
  messages: ChatMessage[];
  draft: BookingDraft;
};

const sessionMap = new Map<string, SessionState>();

export function createSessionId(prefix = "autocare") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSession(sessionId: string): SessionState {
  const existing = sessionMap.get(sessionId);

  if (existing) {
    return existing;
  }

  const created: SessionState = {
    messages: [],
    draft: {},
  };

  sessionMap.set(sessionId, created);
  return created;
}

export function appendMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const session = getSession(sessionId);
  session.messages.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  if (session.messages.length > 12) {
    session.messages = session.messages.slice(-12);
  }
}

export function updateDraft(sessionId: string, patch: Partial<BookingDraft>) {
  const session = getSession(sessionId);
  session.draft = { ...session.draft, ...patch };
}

export function getRecentHistory(sessionId: string, limit = 8) {
  return getSession(sessionId).messages.slice(-limit);
}

export function clearSession(sessionId: string) {
  sessionMap.delete(sessionId);
}
