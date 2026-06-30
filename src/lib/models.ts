export interface ChatModelOption {
  id: string;
  label: string;
}

export const CHAT_MODELS = [
  { id: "gemma4:e2b", label: "Gemma 4" },
  { id: "phi3.5:latest", label: "Phi-3.5" },
  { id: "liliaquispelopez/phi3-financial:latest", label: "Phi-3 Financial" },
] as const satisfies readonly ChatModelOption[];

export const DEFAULT_CHAT_MODEL = CHAT_MODELS[0].id;

export function getChatModelLabel(
  modelId: string,
  models: readonly ChatModelOption[] = CHAT_MODELS
): string {
  return models.find((model) => model.id === modelId)?.label ?? modelId;
}

export function isKnownChatModel(modelId: string): boolean {
  return CHAT_MODELS.some((model) => model.id === modelId);
}
