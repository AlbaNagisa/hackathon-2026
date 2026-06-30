"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { getChatModelLabel, type ChatModelOption } from "@/lib/models";

interface MessageListProps {
  messages: Message[];
  sending: boolean;
  selectedModel: string;
  models: ChatModelOption[];
}

export default function MessageList({
  messages,
  sending,
  selectedModel,
  models,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages.filter(
    (message) =>
      message.role === "user" || message.content.trim() || message.reflection?.trim()
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  if (visibleMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200">
          Comment puis-je aider ?
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Posez une question à {getChatModelLabel(selectedModel, models)}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        {visibleMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-700"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {!isUser && message.reflection && (
          <details
            className="mb-3 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
          >
            <summary className="cursor-pointer select-none font-medium text-zinc-600 dark:text-zinc-300">
              Réflexion en cours
            </summary>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
              {message.reflection}
            </p>
          </details>
        )}
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      </div>
    </div>
  );
}
