import { redisSafe } from "../lib/redis-safe";
import { Conversation, ChatMessage, ConversationMode } from "../models/Conversations";
import { normalizePhone } from "../services/phone.util";

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

    // Solo marcar necesita atención si está en modo bot
    if (from === "user" && convo.mode === "bot") {
        convo.needsHuman = true;
    }

    convo.messages.push({
        from,
        text,
        ts: Date.now(),
    });

    convo.lastMessageAt = Date.now();

    await redisSafe.set(key(phone), JSON.stringify(convo));
}


/**
 * Cambia el modo de la conversación (bot/human)
 */
export async function setMode(phone: string, mode: ConversationMode) {
    const convo = await getConversation(phone);

    convo.mode = mode;
    if (mode === "human") {
        convo.needsHuman = false;
        convo.status = "ATENDIDA";
    } else {
        convo.status = convo.finished ? "EN ESPERA" : "CONTROL BOT";
    }

    await redisSafe.set(key(phone), JSON.stringify(convo));
}

/**
 * Lista todas las conversaciones
 */
export async function listConversations(): Promise<Conversation[]> {
    const keys = await redisSafe.keys("convo:*");
    if (!keys.length) return [];

    const values: (string | null)[] = await redisSafe.mget(keys);

    // Parsear y normalizar
    const rawConversations: Conversation[] = values
        .filter((v): v is string => v !== null)
        .map((v) => JSON.parse(v) as Conversation)
        .map((c) => ({
            ...c,
            phone: normalizePhone(c.phone),
        }));

    // Eliminar duplicados dejando solo el último mensaje
    const convoMap = new Map<string, Conversation>();
    for (const convo of rawConversations) {
        const existing = convoMap.get(convo.phone);
        if (!existing || convo.lastMessageAt > existing.lastMessageAt) {
            convoMap.set(convo.phone, convo);
        }
    }

    // Convertir a arreglo y ordenar por último mensaje
    const conversations = Array.from(convoMap.values()).sort(
        (a, b) => b.lastMessageAt - a.lastMessageAt
    );

    return conversations;
}

export async function finishConversation(phone: string) {
    const convo = await getConversation(phone);

    convo.finished = true;
    convo.mode = "bot";
    convo.needsHuman = false;

    convo.status = "EN ESPERA"; // 🔥 aquí definimos el status

    await redisSafe.set(key(phone), JSON.stringify(convo));
    return convo;
}