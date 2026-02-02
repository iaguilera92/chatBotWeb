import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (!process.env.REDIS_URL) {
        // localhost: no crear instancia
        return null;
    }

    if (!redis) {
        redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

        redis.on("connect", () => {
            if (process.env.NODE_ENV !== "development") {
                console.log("🧠 Redis conectado");
            }
        });

        redis.on("error", (err) => {
            if (process.env.NODE_ENV !== "development") {
                console.error("❌ Redis error", err);
            }
        });
    }

    return redis;
}

// Wrapper seguro que funciona también en localhost
export const redisSafe = {
    async get(key: string) {
        return await getRedis()?.get(key) ?? null;
    },
    async set(key: string, value: string) {
        await getRedis()?.set(key, value);
    },
    async keys(pattern: string) {
        return await getRedis()?.keys(pattern) ?? [];
    },
    async mget(keys: string[]) {
        return await getRedis()?.mget(keys) ?? [];
    },
};
