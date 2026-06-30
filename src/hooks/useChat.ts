"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { Message } from "@/lib/types";
import { streamReply } from "@/lib/api";
import { DEFAULT_CHAT_MODEL } from "@/lib/models";
import { newId } from "@/lib/storage";
import {
  appendMessage,
  deleteChat,
  getServerSnapshot,
  getSnapshot,
  newChat,
  selectChat,
  subscribe,
  updateChatSummary,
  updateMessage,
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
    async (text: string, model: string = DEFAULT_CHAT_MODEL) => {
      const content = text.trim();
      if (!content || sending || !activeId) return;

      const userMsg: Message = { id: newId(), role: "user", content };
      const history = [...(activeSession?.messages ?? []), userMsg];
      appendMessage(activeId, userMsg);

      setSending(true);
      try {
        const assistantId = newId();
        const assistantMsg: Message = {
          id: assistantId,
          role: "assistant",
          content: "",
          reflection: "",
        };

        appendMessage(activeId, assistantMsg);

        let streamedReflection = "";
        let streamedReply = "";

        await streamReply({
          model,
          messages: history,
          summary: activeSession?.summary,
          summarizedMessageCount: activeSession?.summarizedMessageCount,
          onReflectionDelta: (delta) => {
            streamedReflection += delta;
            updateMessage(activeId, assistantId, {
              reflection: streamedReflection,
            });
          },
          onReplyDelta: (delta) => {
            streamedReply += delta;
            updateMessage(activeId, assistantId, {
              content: streamedReply,
            });
          },
          onMetadata: (metadata) => {
            updateChatSummary(
              activeId,
              metadata.summary,
              metadata.summarizedMessageCount
            );
          },
        });
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
