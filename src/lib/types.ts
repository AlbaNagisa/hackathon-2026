export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  reflection?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  summary?: string;
  summarizedMessageCount?: number;
  createdAt: number;
  updatedAt: number;
}
