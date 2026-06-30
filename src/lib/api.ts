import type { Message } from "./types";

interface StreamReplyParams {
  model?: string;
  messages: Message[];
  summary?: string;
  summarizedMessageCount?: number;
  onReflectionDelta: (delta: string) => void;
  onReplyDelta: (delta: string) => void;
  onMetadata: (metadata: {
    summary?: string;
    summarizedMessageCount?: number;
  }) => void;
}

export async function streamReply({
  model,
  messages,
  summary,
  summarizedMessageCount,
  onReflectionDelta,
  onReplyDelta,
  onMetadata,
}: StreamReplyParams): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, summary, summarizedMessageCount }),
  });

  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error ?? "La requete au serveur IA a echoue.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  function handleEvent(event: string, data: string) {
    if (!data) {
      return;
    }

    if (event === "reflection_delta") {
      onReflectionDelta(data);
      return;
    }

    if (event === "reply_delta") {
      onReplyDelta(data);
      return;
    }

    if (event === "metadata") {
      onMetadata(JSON.parse(data) as {
        summary?: string;
        summarizedMessageCount?: number;
      });
      return;
    }

    if (event === "error") {
      throw new Error(data);
    }
  }

  function readEvent(raw: string) {
    const lines = raw.split("\n");
    const event = lines
      .find((line) => line.startsWith("event: "))
      ?.slice("event: ".length);
    const data = lines
      .filter((line) => line.startsWith("data: "))
      .map((line) => line.slice("data: ".length))
      .join("\n");

    if (event) {
      handleEvent(event, data);
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    events.forEach(readEvent);

    if (done) {
      if (buffer) {
        readEvent(buffer);
      }
      break;
    }
  }
}

export async function generateReply(messages: Message[]): Promise<string> {
  let reply = "";

  await streamReply({
    messages,
    onReflectionDelta: () => undefined,
    onReplyDelta: (delta) => {
      reply += delta;
    },
    onMetadata: () => undefined,
  });

  return reply;
}
