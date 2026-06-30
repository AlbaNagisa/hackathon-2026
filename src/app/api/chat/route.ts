import type { Message } from "@/lib/types";

function getInferenceUrl() {
    const value = process.env.INFERENCE_URL?.trim();

    if (!value) {
        throw new Error("INFERENCE_URL n'est pas configuree.");
    }

    return value.replace(/\/$/, "");
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

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as { messages?: Message[] };
        const messages = body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return Response.json({ error: "Le tableau messages est requis." }, { status: 400 });
        }

        const upstreamResponse = await fetch(`${getInferenceUrl()}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "phi3.5-financial",
                stream: false,
                messages: messages.map(({ role, content }) => ({ role, content })),
            }),
        });

        const data = (await upstreamResponse.json().catch(() => null)) as unknown;

        if (!upstreamResponse.ok) {
            return Response.json(
                {
                    error:
                        (data && typeof data === "object" && "error" in data && typeof data.error === "string"
                            ? data.error
                            : null) ?? "Le serveur d'inference a renvoye une erreur.",
                },
                { status: upstreamResponse.status }
            );
        }

        const reply = extractReply(data);

        if (!reply) {
            return Response.json(
                { error: "Reponse du serveur d'inference invalide." },
                { status: 502 }
            );
        }

        return Response.json({ reply });
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