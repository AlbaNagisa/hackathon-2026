"use client";

// TODO: brancher l'authentification (connexion / inscription / déconnexion)
export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <h1 className="text-sm font-semibold text-zinc-500">TechCorp · Phi-3.5-Financial</h1>
      <div className="flex items-center gap-2">
        <button
          disabled
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Connexion
        </button>
        <button
          disabled
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          Inscription
        </button>
      </div>
    </header>
  );
}
