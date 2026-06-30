import type { Message } from "@/lib/types";
import { DEFAULT_CHAT_MODEL } from "@/lib/models";

const DEFAULT_LAST_MESSAGES_COUNT = 10;
const DEFAULT_MAX_SUMMARY_CHARS = 2400;
const DEFAULT_INFERENCE_URL = "https://api-ai.polary.fr";
const DEFAULT_INFERENCE_MODEL = DEFAULT_CHAT_MODEL;

type UpstreamRole = "system" | "user" | "assistant";
type UpstreamMessage = { role: UpstreamRole; content: string };

interface ChatRequestBody {
    model?: unknown;
    messages?: Message[];
    summary?: unknown;
    summarizedMessageCount?: unknown;
}

interface PreparedContext {
    messages: UpstreamMessage[];
    summary?: string;
    summarizedMessageCount?: number;
}

function getPositiveIntEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
}

const LAST_MESSAGES_COUNT = getPositiveIntEnv(
    "CHAT_LAST_MESSAGES_COUNT",
    DEFAULT_LAST_MESSAGES_COUNT
);
const MAX_SUMMARY_CHARS = getPositiveIntEnv(
    "CHAT_MAX_SUMMARY_CHARS",
    DEFAULT_MAX_SUMMARY_CHARS
);

function compactText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

function normalizeSummary(summary: unknown): string | undefined {
    if (typeof summary !== "string") {
        return undefined;
    }

    const compacted = compactText(summary);
    return compacted ? compacted : undefined;
}

function normalizeMessageCount(count: unknown, max: number): number {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
        return 0;
    }

    return Math.min(count, max);
}

function limitText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }

    const clipped = text.slice(0, maxLength);
    const lastSentenceEnd = Math.max(
        clipped.lastIndexOf(". "),
        clipped.lastIndexOf("! "),
        clipped.lastIndexOf("? "),
        clipped.lastIndexOf("\n")
    );

    if (lastSentenceEnd > maxLength * 0.6) {
        return clipped.slice(0, lastSentenceEnd + 1).trim();
    }

    return clipped.trim();
}

function formatTranscript(messages: Message[]): string {
    return messages
        .map((message, index) => {
            const speaker = message.role === "user" ? "Utilisateur" : "Assistant";
            return `${index + 1}. ${speaker}: ${compactText(message.content)}`;
        })
        .join("\n");
}

function toUpstreamMessages(messages: Message[]): UpstreamMessage[] {
    return messages.map(({ role, content }) => ({
        role,
        content,
    }));
}

function getFirstEnvValue(names: string[]): string | null {
    for (const name of names) {
        const value = process.env[name]?.trim();

        if (value) {
            return value;
        }
    }

    return null;
}

function getInferenceUrl() {
    const value = getFirstEnvValue(["INFERENCE_URL", "OLLAMA_BASE_URL", "OLLAMA_HOST"]);

    return (value ?? DEFAULT_INFERENCE_URL).replace(/\/$/, "");
}

function normalizeRequestedModel(model: unknown): string | null {
    if (typeof model !== "string") {
        return null;
    }

    const normalized = model.trim();
    if (!normalized || normalized.length > 160) {
        return null;
    }

    return /^[a-zA-Z0-9_.:/-]+$/.test(normalized) ? normalized : null;
}

function getInferenceModel(requestedModel: unknown) {
    return (
        normalizeRequestedModel(requestedModel) ??
        getFirstEnvValue(["INFERENCE_MODEL", "OLLAMA_MODEL"]) ??
        DEFAULT_INFERENCE_MODEL
    );
}

function extractReply(data: unknown): string | null {
    if (!data || typeof data !== "object") {
        return null;
    }

    const payload = data as {
        message?: { content?: unknown };
        response?: unknown;
    };

    if (typeof payload.message?.content === "string") {
        return payload.message.content;
    }

    if (typeof payload.response === "string") {
        return payload.response;
    }

    return null;
}

async function callOllamaChat(
    inferenceUrl: string,
    model: string,
    messages: UpstreamMessage[]
): Promise<string> {
    const upstreamResponse = await fetch(`${inferenceUrl}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            stream: false,
            messages,
        }),
    });

    const data = (await upstreamResponse.json().catch(() => null)) as unknown;

    if (!upstreamResponse.ok) {
        const error =
            data && typeof data === "object" && "error" in data && typeof data.error === "string"
                ? data.error
                : "Le serveur d'inference a renvoye une erreur.";

        throw new Error(error);
    }

    const reply = extractReply(data);
    if (!reply) {
        throw new Error("Reponse du serveur d'inference invalide.");
    }

    return reply;
}

async function summarizeMessages(
    inferenceUrl: string,
    model: string,
    currentSummary: string | undefined,
    messages: Message[]
): Promise<string> {
    const transcript = limitText(formatTranscript(messages), MAX_SUMMARY_CHARS * 4);
    const summaryPrompt = currentSummary
        ? `Resume actuel:\n${currentSummary}\n\nNouveaux messages a integrer:\n${transcript}`
        : `Messages a resumer:\n${transcript}`;

    const summary = await callOllamaChat(inferenceUrl, model, [
        {
            role: "system",
            content:
                "Tu maintiens la memoire longue d'une conversation. " +
                "Retourne uniquement un resume factuel en francais, sans markdown. " +
                "Preserve explicitement l'identite de l'utilisateur, ses preferences, " +
                "les contraintes, les decisions et les informations utiles. " +
                "Formule les faits stables directement, par exemple: \"L'utilisateur s'appelle ...\". " +
                "N'ajoute ni compteur, ni mention de longueur, ni analyse du style, ni information inutile. " +
                `Maximum ${MAX_SUMMARY_CHARS} caracteres.`,
        },
        {
            role: "user",
            content: summaryPrompt,
        },
    ]);

    return limitText(compactText(summary), MAX_SUMMARY_CHARS);
}

async function buildInferenceContext(
    messages: Message[],
    body: ChatRequestBody,
    inferenceUrl: string,
    model: string
): Promise<PreparedContext> {
    let summary = normalizeSummary(body.summary);
    let summarizedMessageCount = summary
        ? normalizeMessageCount(body.summarizedMessageCount, messages.length)
        : 0;

    const targetSummarizedMessageCount = Math.max(
        summarizedMessageCount,
        messages.length - LAST_MESSAGES_COUNT
    );
    const messagesToSummarize = messages.slice(
        summarizedMessageCount,
        targetSummarizedMessageCount
    );

    if (messagesToSummarize.length > 0) {
        summary = await summarizeMessages(
            inferenceUrl,
            model,
            summary,
            messagesToSummarize
        );
        summarizedMessageCount = targetSummarizedMessageCount;
    }

    const recentMessages = messages.slice(summarizedMessageCount);
    const upstreamMessages = toUpstreamMessages(recentMessages);

    if (!summary) {
        return {
            messages: upstreamMessages,
            summarizedMessageCount,
        };
    }

    return {
        messages: [
            {
                role: "system",
                content:
                    "Tu es un assistant de chat. Utilise le contexte fourni comme une source fiable, " +
                    "respecte les preferences connues de l'utilisateur et reponds surtout au dernier message.",
            },
            {
                role: "user",
                content: "Contexte fiable des messages precedents:\n" + summary,
            },
            {
                role: "assistant",
                content: "Contexte pris en compte.",
            },
            ...upstreamMessages,
        ],
        summary,
        summarizedMessageCount,
    };
}

function encodeSse(event: string, data = ""): Uint8Array {
    const encoder = new TextEncoder();
    const lines = data
        .split("\n")
        .map((line) => `data: ${line}`)
        .join("\n");

    return encoder.encode(`event: ${event}\n${lines}\n\n`);
}

function buildReplyMessages(messages: UpstreamMessage[]): UpstreamMessage[] {
    return [
        {
            role: "system",
            content:
                "Reponds uniquement au dernier message, dans la langue de l'utilisateur. " +
                "Une reponse courte suffit. N'ecris pas ta reflexion, ne traduis pas la demande, ne fais pas de lecon. " +
                "Si l'utilisateur critique ta reponse, reconnais-le brievement et corrige le tir. " +
                "Ne commence jamais une nouvelle tache, un poeme, un exemple ou un contenu sans rapport.",
        },
        ...messages,
    ];
}

async function streamOllamaDeltas(
    inferenceUrl: string,
    model: string,
    messages: UpstreamMessage[],
    handlers: {
        onThinkingDelta: (delta: string) => void;
        onReplyDelta: (delta: string) => void;
    },
    options?: {
        numPredict?: number;
        temperature?: number;
    }
): Promise<void> {
    const upstreamResponse = await fetch(`${inferenceUrl}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            stream: true,
            options: {
                num_predict: options?.numPredict ?? 160,
                temperature: options?.temperature ?? 0.2,
            },
            messages,
        }),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
        throw new Error("Le serveur d'inference a renvoye une erreur.");
    }

    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();
    let lineBuffer = "";

    while (true) {
        const { done, value } = await reader.read();
        lineBuffer += decoder.decode(value, { stream: !done });

        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }

            const chunk = JSON.parse(trimmed) as {
                message?: { content?: unknown; thinking?: unknown };
                done?: boolean;
                error?: unknown;
            };

            if (typeof chunk.error === "string") {
                throw new Error(chunk.error);
            }

            if (typeof chunk.message?.thinking === "string" && chunk.message.thinking) {
                handlers.onThinkingDelta(chunk.message.thinking);
            }

            if (typeof chunk.message?.content === "string" && chunk.message.content) {
                handlers.onReplyDelta(chunk.message.content);
            }

            if (chunk.done) {
                return;
            }
        }

        if (done) {
            return;
        }
    }
}

function streamReply(
    inferenceUrl: string,
    model: string,
    context: PreparedContext
): Response {
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                await streamOllamaDeltas(
                    inferenceUrl,
                    model,
                    buildReplyMessages(context.messages),
                    {
                        onThinkingDelta: (delta) =>
                            controller.enqueue(encodeSse("reflection_delta", delta)),
                        onReplyDelta: (delta) =>
                            controller.enqueue(encodeSse("reply_delta", delta)),
                    },
                    { numPredict: 768, temperature: 0.1 }
                );

                controller.enqueue(
                    encodeSse(
                        "metadata",
                        JSON.stringify({
                            summary: context.summary,
                            summarizedMessageCount: context.summarizedMessageCount,
                        })
                    )
                );
                controller.enqueue(encodeSse("done"));
                controller.close();
            } catch (error) {
                controller.enqueue(
                    encodeSse(
                        "error",
                        error instanceof Error
                            ? error.message
                            : "Erreur inattendue pendant le stream IA."
                    )
                );
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return Response.json({ error: "Le tableau messages est requis." }, { status: 400 });
        }

        const inferenceUrl = getInferenceUrl();
        const model = getInferenceModel(body.model);
        const context = await buildInferenceContext(messages, body, inferenceUrl, model);

        return streamReply(inferenceUrl, model, context);
    } catch (error) {
        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erreur inattendue pendant l'appel au serveur IA.",
            },
            { status: 500 }
        );
    }
}
