// src/models/Chats.ts
export type UiMessage = {
    from: "user" | "bot";
    text?: string | null;
    image?: string;
    video?: string;
    status?: "sent" | "delivered" | "seen";
    timestamp?: string | Date;
};

// Roles para mensajes de AI (GPT)
export type AiRole = "system" | "user" | "assistant";

// Mensaje de AI
export type AiMessage = {
    role: AiRole;
    content: string;
};
