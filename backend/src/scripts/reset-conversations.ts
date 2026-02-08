// scripts/reset-conversations.ts
import { redisSafe } from "../lib/redis";

async function resetConversations() {
    const keys = await redisSafe.keys("convo:*");
    for (const k of keys) {
        const raw = await redisSafe.get(k);
        if (!raw) continue;

        const convo = JSON.parse(raw);
        convo.mode = "bot";      // CONTROL BOT
        convo.needsHuman = false; // no necesita humano

        await redisSafe.set(k, JSON.stringify(convo));
    }
    console.log("✅ Conversaciones reseteadas a CONTROL BOT");
    process.exit(0); // cierra el script
}

resetConversations().catch((err) => {
    console.error("❌ Error reseteando conversaciones:", err);
    process.exit(1);
});
