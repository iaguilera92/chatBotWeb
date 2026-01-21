import { Box } from "@mui/material";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

export default function ChatContainer({ messages, isTyping }) {

    return (
        <Box
            sx={{
                flex: 1,
                p: 2,
                overflowY: "auto",
                backgroundColor: "#efeae2", // color WhatsApp
                backgroundImage:
                    "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%)",
                backgroundSize: "40px 40px"
            }}
        >
            {messages.map((m, i) => (
                <ChatMessage
                    key={i}
                    from={m.from}
                    text={m.text}
                    status={m.status}
                    timestamp={m.timestamp}
                />
            ))}

            {isTyping && <TypingIndicator />}
        </Box>
    );
}
