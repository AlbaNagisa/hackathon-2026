import type { Message } from "./types";

// TODO: brancher le vrai serveur d'inférence Phi-3.5-Financial via POST /api/chat
// (proxy vers Ollama :11434 / Triton :8000 / serveur maison INFRA). Voir CLAUDE.md.
export async function generateReply(messages: Message[]): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  return (
    "🤖 Réponse simulée — le serveur d'inférence Phi-3.5-Financial n'est pas encore branché.\n\n" +
    `Tu as écrit : « ${last} »`
  );
}
