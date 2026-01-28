export type ConversationMode = "bot" | "human";

export type ChatMessage = {
    from: "user" | "bot" | "human";
    text: string;
    timestamp: Date;
};

export type Conversation = {
    phone: string;
    messages: ChatMessage[];
    lastMessageAt: Date;
    mode: ConversationMode;
    needsHuman: boolean; // 👈 NUEVO
};

const conversations = new Map<string, Conversation>();

/** Obtiene o crea una conversación */
export function getConversation(phone: string): Conversation {
    let convo = conversations.get(phone);

    if (!convo) {
        convo = {
            phone,
            messages: [],
            lastMessageAt: new Date(0),
            mode: "bot",
            needsHuman: true, // 👈 inicial
        };
        conversations.set(phone, convo);
    }

    return convo;
}

/** Guarda un mensaje en el historial */
export function saveMessage(
    phone: string,
    from: ChatMessage["from"],
    text: string
) {
    const convo = getConversation(phone);

    convo.messages.push({
        from,
        text,
        timestamp: new Date(),
    });

    convo.lastMessageAt = new Date();

    // 👤 Si el cliente escribe y NO está en modo humano → marcar espera
    if (from === "user" && convo.mode !== "human") {
        convo.needsHuman = true;
    }
}

/** Cambia el modo de la conversación */
export function setMode(phone: string, mode: ConversationMode) {
    const convo = getConversation(phone);

    convo.mode = mode;

    // ✅ Al tomar control humano, ya no está en espera
    if (mode === "human") {
        convo.needsHuman = false;
    }
}

/** Lista conversaciones (ordenadas por último mensaje) */
export function listConversations(): Conversation[] {
    return Array.from(conversations.values()).sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
}

/** Verifica si está dentro de la ventana de 24h (WhatsApp) */
export function canReply(phone: string): boolean {
    const convo = conversations.get(phone);
    if (!convo) return false;

    const diffMs = Date.now() - convo.lastMessageAt.getTime();
    return diffMs <= 24 * 60 * 60 * 1000;
}

/** Limpieza opcional (tests/dev) */
export function clearConversations() {
    conversations.clear();
}
