import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

export default function ChatContainer({ messages, isTyping }) {
    const bottomRef = useRef(null);

    // ⚠️ iOS-safe autoscroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: isTyping ? "auto" : "smooth",
            block: "end",
        });
    }, [messages, isTyping]);

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,          // ⭐ CLAVE
                overflowY: "auto",
                px: { xs: 1.3, md: 1.5 },   // 👈 MÁS AIRE LATERAL
                pt: { xs: 2.5, md: 2.5 },
                pb: { xs: 0.5, md: 2 },

                WebkitOverflowScrolling: "touch",
                backgroundColor: "#efeae2",
                backgroundImage:
                    "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%)",
                backgroundSize: "40px 40px",
            }}
        >

            {messages
                .filter(
                    msg =>
                        (typeof msg.text === "string" && msg.text.trim().length > 0) ||
                        typeof msg.image === "string" ||
                        typeof msg.video === "string"
                )
                .map((msg, i) => (
                    <ChatMessage
                        key={i}
                        from={msg.from}
                        text={msg.text}
                        image={msg.image}
                        video={msg.video}
                        status={msg.status}
                        timestamp={msg.timestamp}
                    />
                ))}

            {isTyping && <TypingIndicator />}

            {/* 🔽 Scroll anchor */}
            <div ref={bottomRef} />
        </Box>
    );
}
