import { Box, Paper, Typography } from "@mui/material";
import { useTenant } from "../context/TenantContext";
import { useState } from "react";
import ChatContainer from "../components/chat/ChatContainer";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const tenant = useTenant();
    const [isTyping, setIsTyping] = useState(false);
    const [lead, setLead] = useState({
        offer: null,
        email: null,
        business: null,
        sent: false,
    });
    const [messages, setMessages] = useState([
        { from: "bot", text: tenant.welcomeMessage }
    ]);


    const handleSend = async (text) => {
        const userMessage = {
            from: "user",
            text,
            timestamp: new Date(),
        };

        // 🧠 Detectar selección de oferta
        if (/oferta\s*1|la\s*1|opción\s*1/i.test(text)) {
            setLead(prev => ({ ...prev, offer: "Oferta 1 - Pago único" }));
        }

        if (/oferta\s*2|la\s*2|opción\s*2/i.test(text)) {
            setLead(prev => ({ ...prev, offer: "Oferta 2 - Suscripción mensual" }));
        }

        // 📧 Detectar correo
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            setLead(prev => ({ ...prev, email: text }));
        }

        // 🏷️ Detectar nombre del negocio (solo después del correo)
        if (
            lead.email &&
            !lead.business &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ) {
            setLead(prev => ({ ...prev, business: text }));
        }

        // 🔑 Construir historial
        const updatedMessages = [...messages, userMessage];

        // UI inmediata
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            const data = await res.json();

            const replies = Array.isArray(data.replies)
                ? data.replies
                : [];


            setIsTyping(false);

            setMessages(prev => [
                ...prev,
                ...replies.map(r => ({
                    from: "bot",
                    text: r.text,
                    image: r.image,
                    video: r.video,
                    timestamp: new Date(),
                })),
            ]);



        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                {
                    from: "bot",
                    text: "⚠️ Error al contactar la IA",
                    timestamp: new Date(),
                },
            ]);
        }
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
