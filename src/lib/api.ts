import type { Message } from "./types";

export async function generateReply(messages: Message[]): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { reply?: string; error?: string }
    | null;

  if (!response.ok || !payload?.reply) {
    throw new Error(payload?.error ?? "La requete au serveur IA a echoue.");
  }

  return payload.reply;
}
