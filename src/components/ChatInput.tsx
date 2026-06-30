"use client";

import { useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string, model: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("phi-3.5-financial");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text, selectedModel);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  return (
    <div className="px-4 pb-4">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <div className="flex shrink-0 items-center">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="h-8 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label="Sélectionner un modèle"
          >
            <option value="phi-3.5-financial">Phi-3.5 Financial</option>
            <option value="phi-3.5">Phi-3.5</option>
            <option value="gemma4:e2b">Gemma 4</option>
          </select>
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-3xl border border-zinc-300 bg-white px-4 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Écrivez votre message…"
            className="max-h-48 flex-1 resize-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            aria-label="Envoyer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-30 dark:bg-white dark:text-zinc-900"
          >
            ↑
          </button>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-zinc-400">
        Phi-3.5-Financial peut faire des erreurs. Vérifiez les informations importantes.
      </p>
    </div>
  );
}
