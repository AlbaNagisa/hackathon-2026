"use client";

import { getChatModelLabel } from "@/lib/models";
import type { ChatModelOption } from "@/lib/models";

export default function TopBar({
  selectedModel,
  models,
}: {
  selectedModel: string;
  models: ChatModelOption[];
}) {
  return (
    <header className="flex items-center px-4 py-3">
      <h1 className="text-sm font-semibold text-zinc-500">
        TechCorp · {getChatModelLabel(selectedModel, models)}
      </h1>
    </header>
  );
}
