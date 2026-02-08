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
    status?: "EN ESPERA" | "CONTROL BOT" | "ATENDIDA";
    leadEmail?: string;
    leadBusiness?: string;
    leadOffer?: string;
};
