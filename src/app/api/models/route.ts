import { CHAT_MODELS, type ChatModelOption, getChatModelLabel } from "@/lib/models";

const DEFAULT_INFERENCE_URL = "https://api-ai.polary.fr";

interface OllamaTagsResponse {
    models?: Array<{
        name?: unknown;
        model?: unknown;
    }>;
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

function toModelOption(model: { name?: unknown; model?: unknown }): ChatModelOption | null {
    const id =
        typeof model.model === "string"
            ? model.model
            : typeof model.name === "string"
              ? model.name
              : null;

    if (!id) {
        return null;
    }

    return {
        id,
        label: getChatModelLabel(id),
    };
}

export async function GET() {
    try {
        const response = await fetch(`${getInferenceUrl()}/api/tags`, {
            cache: "no-store",
        });

        if (!response.ok) {
            return Response.json({ models: CHAT_MODELS }, { status: 200 });
        }

        const payload = (await response.json()) as OllamaTagsResponse;
        const models = (payload.models ?? [])
            .map(toModelOption)
            .filter((model): model is ChatModelOption => model !== null);

        return Response.json({
            models: models.length > 0 ? models : CHAT_MODELS,
        });
    } catch {
        return Response.json({ models: CHAT_MODELS }, { status: 200 });
    }
}
