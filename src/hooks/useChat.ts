"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { Message } from "@/lib/types";
import { generateReply } from "@/lib/api";
import { newId } from "@/lib/storage";
import {
  appendMessage,
  deleteChat,
  getServerSnapshot,
  getSnapshot,
  newChat,
  selectChat,
  subscribe,
} from "@/lib/chatStore";

export function useChat() {
  const { sessions, activeId } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [sending, setSending] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending || !activeId) return;

      const userMsg: Message = { id: newId(), role: "user", content };
      const history = [...(activeSession?.messages ?? []), userMsg];
      appendMessage(activeId, userMsg);

      setSending(true);
      try {
        const reply = await generateReply(history);
        appendMessage(activeId, { id: newId(), role: "assistant", content: reply });
      } finally {
        setSending(false);
      }
    },
    [activeId, activeSession, sending]
  );

  return {
    sessions,
    activeSession,
    activeId,
    sending,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
  };
}
