import { redis } from "../lib/redis";

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

export async function getConversation(phone: string): Promise<Conversation> {
    const raw = await redis.get(key(phone));

    if (raw) return JSON.parse(raw);

    const convo: Conversation = {
        phone,
        messages: [],
        lastMessageAt: 0,
        mode: "bot",
        needsHuman: false,
    };

    await redis.set(key(phone), JSON.stringify(convo));
    return convo;
}

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

    await redis.set(key(phone), JSON.stringify(convo));
}

export async function setMode(phone: string, mode: ConversationMode) {
    const convo = await getConversation(phone);

    convo.mode = mode;
    if (mode === "human") convo.needsHuman = false;

    await redis.set(key(phone), JSON.stringify(convo));
}

export async function listConversations(): Promise<Conversation[]> {
    const keys = await redis.keys("convo:*");
    if (!keys.length) return [];

    const values = await redis.mget(keys);
    return values
        .filter(Boolean)
        .map(v => JSON.parse(v!))
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}
