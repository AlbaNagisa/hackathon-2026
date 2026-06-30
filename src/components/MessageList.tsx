"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
        <MarkdownMessage content={message.content} isUser={isUser} />
      </div>
    </div>
  );
}

function MarkdownMessage({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-3 whitespace-pre-wrap last:mb-0">{children}</p>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`underline underline-offset-2 ${
              isUser
                ? "text-white decoration-white/70"
                : "text-blue-600 decoration-blue-600/60 dark:text-blue-300 dark:decoration-blue-300/60"
            }`}
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote
            className={`mb-3 border-l-2 pl-3 italic last:mb-0 ${
              isUser
                ? "border-white/50 text-white/85"
                : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
            }`}
          >
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = Boolean(className);

          if (isBlock) {
            return (
              <code className={`${className ?? ""} block whitespace-pre-wrap`}>
                {children}
              </code>
            );
          }

          return (
            <code
              className={`rounded px-1 py-0.5 text-[0.9em] ${
                isUser
                  ? "bg-white/15 text-white"
                  : "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
              }`}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre
            className={`mb-3 overflow-x-auto rounded-xl p-3 text-xs last:mb-0 ${
              isUser
                ? "bg-black/25 text-white"
                : "bg-zinc-950 text-zinc-100 dark:bg-black"
            }`}
          >
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-left text-xs">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-300 px-2 py-1 font-semibold dark:border-zinc-600">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-600">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
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
