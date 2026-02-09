import { redisSafe } from "../lib/redis";
import { Conversation, ChatMessage, ConversationMode } from "../models/Conversations";
import { normalizePhone } from "../services/phone.util";

/* Keys helpers */
const key = (phone: string) => `convo:${phone}`;
const deletedKey = (phone: string) => `convo:deleted:${phone}`;

/*  Obtener conversación */
export async function getConversation(phone: string): Promise<Conversation> {
    phone = normalizePhone(phone);

    const isDeleted = await redisSafe.get(deletedKey(phone));
    if (isDeleted) {
        throw new Error("CONVERSATION_DELETED");
    }

    const raw = await redisSafe.get(key(phone));
    if (raw) {
        return JSON.parse(raw);
    }

    const convo: Conversation = {
        phone,
        messages: [],
        lastMessageAt: 0,
        mode: "bot",
        needsHuman: false,
        finished: false,
        status: "CONTROL BOT",
    };

    await redisSafe.set(key(phone), JSON.stringify(convo));
    return convo;
}

/*  Guardar mensaje */
export async function saveMessage(
    phone: string,
    from: ChatMessage["from"],
    text: string
) {
    phone = normalizePhone(phone);

    // ⛔ No revivir conversaciones eliminadas
    const isDeleted = await redisSafe.get(deletedKey(phone));
    if (isDeleted) return;

    const convo = await getConversation(phone);

    // Solo marcar atención humana si está en modo bot
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

/*  Cambiar modo */
export async function setMode(phone: string, mode: ConversationMode) {
    phone = normalizePhone(phone);

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

/*  Finalizar conversación */
export async function finishConversation(
    phone: string,
    extras?: { leadEmail?: string; leadBusiness?: string; leadOffer?: string }
) {
    const convo = await getConversation(phone);

    convo.finished = true;
    convo.mode = "bot";
    convo.needsHuman = false;
    convo.status = "EN ESPERA";

    // Asegurar que lastMessageAt exista
    if (convo.messages.length > 0) {
        convo.lastMessageAt = convo.messages[convo.messages.length - 1].ts;
    } else {
        convo.lastMessageAt = Date.now();
    }

    // Agregar los datos extra si vienen
    if (extras) {
        convo.leadEmail = extras.leadEmail;
        convo.leadBusiness = extras.leadBusiness;
        convo.leadOffer = extras.leadOffer;
    }

    await redisSafe.set(key(phone), JSON.stringify(convo));
    return convo;
}

/*  Eliminar conversación */
export async function deleteConversation(phone: string) {
    phone = normalizePhone(phone);

    await redisSafe.del(key(phone));

    // 🪦 Tombstone para evitar recreación
    await redisSafe.set(deletedKey(phone), "1");
}

/*  Listar conversaciones */
export async function listConversations(): Promise<Conversation[]> {
    const keys = await redisSafe.keys("convo:*");
    if (!keys.length) return [];

    const values = await redisSafe.mget(keys);

    const conversations: Conversation[] = [];

    for (const raw of values) {
        if (!raw) continue;

        const convo = JSON.parse(raw) as Conversation;
        const phone = normalizePhone(convo.phone);

        const isDeleted = await redisSafe.get(deletedKey(phone));
        if (isDeleted) continue;

        conversations.push(convo);
    }

    // Eliminar duplicados (por seguridad) y ordenar
    const convoMap = new Map<string, Conversation>();
    for (const convo of conversations) {
        const existing = convoMap.get(convo.phone);
        if (!existing || convo.lastMessageAt > existing.lastMessageAt) {
            convoMap.set(convo.phone, convo);
        }
    }

    return Array.from(convoMap.values()).sort(
        (a, b) => b.lastMessageAt - a.lastMessageAt
    );
}
