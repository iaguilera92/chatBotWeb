import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

export default function ChatContainer({ messages, isTyping }) {
    const bottomRef = useRef(null);

    // 🔽 Auto-scroll cuando cambian mensajes o typing
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    return (
        <Box
            sx={{
                flex: 1,
                p: 2,
                overflowY: "auto",
                backgroundColor: "#efeae2",
                backgroundImage:
                    "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%)",
                backgroundSize: "40px 40px",
            }}
        >
            {messages
                .filter(
                    msg =>
                        typeof msg.text === "string" &&
                        msg.text.trim().length > 0
                )
                .map((msg, i) => (
                    <ChatMessage
                        key={i}
                        from={msg.from}
                        text={msg.text}
                        status={msg.status}
                        timestamp={msg.timestamp}
                    />
                ))}

            {isTyping && <TypingIndicator />}

            {/* 🔽 ANCLA DE SCROLL */}
            <div ref={bottomRef} />
        </Box>
    );
}
