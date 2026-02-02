import { redisSafe } from "../lib/redis-safe";

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
};

const key = (phone: string) => `convo:${phone}`;

/**
 * Obtiene una conversación existente o crea una nueva si no existe.
 * En localhost, usa un fallback en memoria sin Redis.
 */
export async function getConversation(phone: string): Promise<Conversation> {
    const raw = await redisSafe.get(key(phone));

    if (raw) return JSON.parse(raw);

    const convo: Conversation = {
        phone,
        messages: [],
        lastMessageAt: 0,
        mode: "bot",
        needsHuman: false,
    };

    await redisSafe.set(key(phone), JSON.stringify(convo));
    return convo;
}

/**
 * Guarda un mensaje en la conversación
 */
export async function saveMessage(
    phone: string,
    from: ChatMessage["from"],
    text: string
) {
    const convo = await getConversation(phone);

    convo.messages.push({
        from,
        text,
        ts: Date.now(),
    });

    convo.lastMessageAt = Date.now();

    if (from === "user" && convo.mode !== "human") {
        convo.needsHuman = true;
    }

    await redisSafe.set(key(phone), JSON.stringify(convo));
}

/**
 * Cambia el modo de la conversación (bot/human)
 */
export async function setMode(phone: string, mode: ConversationMode) {
    const convo = await getConversation(phone);

    convo.mode = mode;
    if (mode === "human") convo.needsHuman = false;

    await redisSafe.set(key(phone), JSON.stringify(convo));
}

/**
 * Lista todas las conversaciones
 */
export async function listConversations(): Promise<Conversation[]> {
    const keys = await redisSafe.keys("convo:*");
    if (!keys.length) return [];

    // Tipamos values como (string | null)[]
    const values: (string | null)[] = await redisSafe.mget(keys);

    const conversations: Conversation[] = values
        .filter((v): v is string => v !== null) // Type guard: descarta null
        .map((v) => JSON.parse(v) as Conversation) // Parse seguro
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return conversations;
}