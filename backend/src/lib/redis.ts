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

// Wrapper seguro que no falla si redis es null
export const redisSafe = {
    get: async (key: string) => {
        const redis = getRedis();
        if (!redis) return null;

        const value = await redis.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value); // parsea si es JSON
        } catch {
            return value; // si no es JSON, devuelve string
        }
    },
    set: async (key: string, value: any, ttlSeconds?: number) => {
        const redis = getRedis();
        if (!redis) return; // si redis no existe, simplemente salimos

        const stringValue = typeof value === "string" ? value : JSON.stringify(value);

        if (ttlSeconds) {
            await redis.set(key, stringValue, "EX", ttlSeconds); // TTL opcional
        } else {
            await redis.set(key, stringValue);
        }
    },
    keys: async (pattern: string) => getRedis()?.keys(pattern) ?? [],
    mget: async (keys: string[]) => {
        const redis = getRedis();
        if (!redis) return []; // si redis no existe, devolvemos arreglo vacío

        const values = await redis.mget(keys); // ya es seguro
        return values.map((v) => {
            if (v === null) return null; // mget devuelve null si la key no existe
            try {
                return JSON.parse(v);
            } catch {
                return v;
            }
        });
    },
};
