"use client";

import type { ChatSession } from "@/lib/types";

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  sessions,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-zinc-900 text-zinc-100">
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          <span className="text-lg leading-none">＋</span>
          Nouveau chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <p className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Conversations
        </p>
        <ul className="flex flex-col gap-0.5">
          {sessions.map((session) => {
            const isActive = session.id === activeId;
            return (
              <li key={session.id}>
                <div
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  <button
                    onClick={() => onSelect(session.id)}
                    className="flex-1 truncate text-left"
                    title={session.title}
                  >
                    {session.title}
                  </button>
                  <button
                    onClick={() => onDelete(session.id)}
                    aria-label="Supprimer la conversation"
                    className="shrink-0 rounded p-1 text-zinc-400 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* TODO: brancher le compte utilisateur réel (avatar, nom, menu) */}
      <div className="border-t border-white/10 p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10">
          <span className="text-base">⚙️</span>
          Options
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs">
            U
          </span>
          <span className="truncate text-zinc-300">Utilisateur</span>
        </button>
      </div>
    </aside>
  );
}
