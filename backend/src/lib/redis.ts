import Redis from "ioredis";

let redis: Redis | null = null;

/**
 * Devuelve una instancia de Redis o null si no hay REDIS_URL
 */
function getRedis(): Redis | null {
    if (!process.env.REDIS_URL) {
        return null; // localhost / sin redis
    }

    if (!redis) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
        });

        redis.on("connect", () => {
            console.log("🧠 Redis conectado");
        });

        redis.on("error", (err) => {
            console.error("❌ Redis error", err);
        });
    }

    return redis;
}

/**
 * Wrapper seguro: nunca rompe si Redis no existe
 */
export const redisSafe = {
    async get(key: string): Promise<string | null> {
        const r = getRedis();
        if (!r) return null;

        return await r.get(key);
    },

    async set(
        key: string,
        value: string,
        ttlSeconds?: number
    ): Promise<void> {
        const r = getRedis();
        if (!r) return;

        if (ttlSeconds) {
            await r.set(key, value, "EX", ttlSeconds);
        } else {
            await r.set(key, value);
        }
    },

    async del(key: string): Promise<void> {
        const r = getRedis();
        if (!r) return;

        await r.del(key);
    },

    async keys(pattern: string): Promise<string[]> {
        const r = getRedis();
        if (!r) return [];

        return await r.keys(pattern);
    },

    async mget(keys: string[]): Promise<(string | null)[]> {
        const r = getRedis();
        if (!r || keys.length === 0) return [];

        return await r.mget(keys);
    },
};
