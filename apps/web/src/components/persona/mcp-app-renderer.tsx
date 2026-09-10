// Re-export canonical implementation — do not duplicate.
// The chat-scoped renderer is the single source of truth; this alias preserves
// the `@/components/persona/mcp-app-renderer` import path while ensuring a
// single design-system migration surface (shadcn Card/Alert/Button).
export * from "@/components/persona/chat/mcp-app-renderer";
