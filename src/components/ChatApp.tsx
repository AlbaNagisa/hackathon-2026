"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { CHAT_MODELS, DEFAULT_CHAT_MODEL, type ChatModelOption } from "@/lib/models";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatApp() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const [models, setModels] = useState<ChatModelOption[]>([...CHAT_MODELS]);
  const {
    sessions,
    activeSession,
    activeId,
    sending,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
  } = useChat();

  useEffect(() => {
    let ignore = false;

    async function loadModels() {
      const response = await fetch("/api/models");
      const payload = (await response.json().catch(() => null)) as
        | { models?: ChatModelOption[] }
        | null;
      const nextModels = payload?.models?.filter((model) => model.id && model.label);

      if (ignore || !nextModels || nextModels.length === 0) {
        return;
      }

      setModels(nextModels);
      setSelectedModel((currentModel) =>
        nextModels.some((model) => model.id === currentModel)
          ? currentModel
          : nextModels[0].id
      );
    }

    loadModels().catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNewChat={newChat}
        onSelect={selectChat}
        onDelete={deleteChat}
      />

      <main className="flex flex-1 flex-col bg-white dark:bg-zinc-900">
        <TopBar selectedModel={selectedModel} models={models} />
        <MessageList
          messages={activeSession?.messages ?? []}
          sending={sending}
          selectedModel={selectedModel}
          models={models}
        />
        <ChatInput
          onSend={sendMessage}
          disabled={sending}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          models={models}
        />
      </main>
    </div>
  );
}
