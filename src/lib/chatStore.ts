import type { ChatSession, Message } from "./types";
import { loadSessions, newId, saveSessions } from "./storage";

// Store localStorage consommé via useSyncExternalStore.
interface State {
  sessions: ChatSession[];
  activeId: string | null;
}

const EMPTY_STATE: State = { sessions: [], activeId: null };

let state: State | null = null;
const listeners = new Set<() => void>();

function createSession(): ChatSession {
  const now = Date.now();
  return {
    id: newId(),
    title: "Nouvelle conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function titleFromContent(content: string): string {
  const clean = content.trim().replace(/\s+/g, " ");
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean || "Nouvelle conversation";
}

function read(): State {
  if (state === null) {
    const stored = loadSessions();
    const sessions = stored.length > 0 ? stored : [createSession()];
    state = { sessions, activeId: sessions[0].id };
  }
  return state;
}

function commit(next: State): void {
  state = next;
  saveSessions(next.sessions);
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): State {
  return read();
}

export function getServerSnapshot(): State {
  return EMPTY_STATE;
}

export function newChat(): void {
  const current = read();
  const empty = current.sessions.find((s) => s.messages.length === 0);
  if (empty) {
    commit({ ...current, activeId: empty.id });
    return;
  }
  const session = createSession();
  commit({ sessions: [session, ...current.sessions], activeId: session.id });
}

export function selectChat(id: string): void {
  commit({ ...read(), activeId: id });
}

export function deleteChat(id: string): void {
  const current = read();
  const remaining = current.sessions.filter((s) => s.id !== id);
  if (remaining.length === 0) {
    const session = createSession();
    commit({ sessions: [session], activeId: session.id });
    return;
  }
  const activeId = current.activeId === id ? remaining[0].id : current.activeId;
  commit({ sessions: remaining, activeId });
}

export function appendMessage(sessionId: string, message: Message): void {
  const current = read();
  commit({
    ...current,
    sessions: current.sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            title:
              s.messages.length === 0 && message.role === "user"
                ? titleFromContent(message.content)
                : s.title,
            messages: [...s.messages, message],
            updatedAt: Date.now(),
          }
        : s
    ),
  });
}
