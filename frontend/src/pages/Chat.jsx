import { Box, Paper, Typography } from "@mui/material";
import { useTenant } from "../context/TenantContext";
import { useState } from "react";
import ChatContainer from "../components/chat/ChatContainer";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
    const tenant = useTenant();
    const [isTyping, setIsTyping] = useState(false);

    const [messages, setMessages] = useState([
        { from: "bot", text: tenant.welcomeMessage }
    ]);

    const handleSend = (text) => {
        const now = new Date();

        const userMessage = {
            from: "user",
            text,
            status: "sent",
            timestamp: now
        };

        setMessages((prev) => [...prev, userMessage]);

        // ✓ entregado
        setTimeout(() => {
            setMessages((prev) =>
                prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, status: "delivered" } : m
                )
            );
        }, 300);

        // ✓✓ visto
        setTimeout(() => {
            setMessages((prev) =>
                prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, status: "seen" } : m
                )
            );
        }, 700);

        // Bot escribiendo…
        setTimeout(() => setIsTyping(true), 500);

        // Respuesta bot
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    from: "bot",
                    text: "Mensaje recibido ✔️",
                    timestamp: new Date()
                }
            ]);
        }, 1400);
    };


    return (
        <Box
            sx={{
                width: "100vw",
                minHeight: "calc(100vh - 64px)", // altura menos header
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f5f7fb",
                px: 2
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    width: "100%",
                    maxWidth: 480,          // 👈 ancho real tipo WhatsApp
                    height: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                    overflow: "hidden"
                }}
            >
                {/* Header del chat */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        backgroundColor: "#075e54", // WhatsApp green
                        color: "white"
                    }}
                >
                    <Box
                        component="img"
                        src="/plataformas-web-img.jpeg"
                        alt="Plataformas Web"
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid rgba(255,255,255,0.6)"
                        }}
                    />


                    <Typography variant="subtitle1" fontWeight={500}>
                        {tenant.name}
                    </Typography>
                </Box>

                <ChatContainer messages={messages} isTyping={isTyping} />

                <ChatInput onSend={handleSend} />
            </Paper>
        </Box>
    );
}
