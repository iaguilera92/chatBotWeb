export type ConversationMode = "bot" | "human";

export type ChatMessage = {
    from: "user" | "bot" | "human";
    text: string;
    ts: number;
};

export type Conversation = {
    phone: string;
    messages: ChatMessage[];
    lastMessageAt: number;
    mode: ConversationMode;
    needsHuman: boolean;
    finished?: boolean;
    // opcional: agregar status explícito si quieres
    status?: "EN ESPERA" | "CONTROL BOT" | "ATENDIDA";
};
