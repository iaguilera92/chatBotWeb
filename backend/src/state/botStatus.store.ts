import { redisSafe } from "../lib/redis";
import { BotStatus } from "../state/botStatus.types";
import { getInitialBotStatus } from "../state/botStatus.factory";

const TTL = 60 * 60; // 1 hora

export async function getBotStatus(sessionId: string): Promise<BotStatus> {
    const key = `bot:${sessionId}`;
    const data = await redisSafe.get(key);

    if (!data) {
        const initial = getInitialBotStatus();
        await redisSafe.set(key, JSON.stringify(initial), TTL);
        return initial;
    }

    try {
        return JSON.parse(data) as BotStatus;
    } catch {
        const initial = getInitialBotStatus();
        await redisSafe.set(key, JSON.stringify(initial), TTL);
        return initial;
    }
}

export async function saveBotStatus(
    sessionId: string,
    state: BotStatus
) {
    const key = `bot:${sessionId}`;
    await redisSafe.set(key, JSON.stringify(state), TTL);
}

export async function clearBotStatus(sessionId: string) {
    const key = `bot:${sessionId}`;
    await redisSafe.del(key);
}