"use client";

import { useChat } from "@/hooks/useChat";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatApp() {
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
        <TopBar />
        <MessageList messages={activeSession?.messages ?? []} sending={sending} />
        <ChatInput onSend={sendMessage} disabled={sending} />
      </main>
    </div>
  );
}
