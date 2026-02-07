import {
    Box,
    Paper,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import { useTenant } from "../context/TenantContext";
import ChatContainer from "../components/chat/ChatContainer";
import ChatInput from "../components/chat/ChatInput";

import { useEffect, useState } from "react";

export default function Chat() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    console.log("🔥 API_URL usada:", API_URL);


    const tenant = useTenant();
    const [welcomeOpen, setWelcomeOpen] = useState(true);
    const [starting, setStarting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [lead, setLead] = useState({
        offer: null,
        email: null,
        business: null,
        sent: false,
    });

    const [messages, setMessages] = useState([
        { from: "bot", text: tenant.welcomeMessage },
    ]);

    const handleSend = async (text) => {
        const userMessage = {
            from: "user",
            text,
            timestamp: new Date(),
        };

        // 🧠 Detectar selección de oferta
        if (/oferta\s*1|la\s*1|opción\s*1/i.test(text)) {
            setLead((prev) => ({
                ...prev,
                offer: "Oferta 1 - Pago único",
            }));
        }

        if (/oferta\s*2|la\s*2|opción\s*2/i.test(text)) {
            setLead((prev) => ({
                ...prev,
                offer: "Oferta 2 - Suscripción mensual",
            }));
        }

        // 📧 Detectar correo
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            setLead((prev) => ({
                ...prev,
                email: text,
            }));
        }

        // 🏷️ Detectar nombre del negocio (solo después del correo)
        if (
            lead.email &&
            !lead.business &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ) {
            setLead((prev) => ({
                ...prev,
                business: text,
            }));
        }

        // 🔑 Construir historial
        const updatedMessages = [...messages, userMessage];

        // UI inmediata
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            const data = await res.json();
            const replies = Array.isArray(data.replies)
                ? data.replies
                : [];

            setIsTyping(false);

            setMessages((prev) => [
                ...prev,
                ...replies.map((r) => ({
                    from: "bot",
                    text: r.text,
                    image: r.image,
                    video: r.video,
                    timestamp: new Date(),
                })),
            ]);
        } catch (e) {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    from: "bot",
                    text: "⚠️ Error al contactar la IA",
                    timestamp: new Date(),
                },
            ]);
        }
    };

    const handleStartChat = () => {
        if (starting) return;
        setStarting(true);
        setWelcomeOpen(false);
        handleSend("Hola 👋");
    };


    const handleExitChat = () => {
        setWelcomeOpen(false);
    };



    return (
        <Box
            sx={{
                width: "100%",
                flex: 1,
                minHeight: 0,
                display: "flex",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: "#f5f7fb",
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", md: 480 },

                    // 👇 CLAVE: que el Paper se estire de verdad
                    flex: 1,
                    minHeight: 0,

                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: { xs: 0, md: 2 },
                }}
            >
                {/* Header del chat */}
                <Box
                    sx={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        color: "white",

                        /* 🌊 Fondo con barrido visible */
                        background:
                            "linear-gradient(270deg, #0f3c4c, #1b6f8a, #0f3c4c)",
                        backgroundSize: "400% 400%",
                        animation: "headerFlow 8s ease infinite",
                        position: "relative",

                        "@keyframes headerFlow": {
                            "0%": { backgroundPosition: "0% 50%" },
                            "50%": { backgroundPosition: "100% 50%" },
                            "100%": { backgroundPosition: "0% 50%" },
                        },
                    }}
                >
                    {/* Avatar con pulso */}
                    <Box
                        sx={{
                            position: "relative",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            flexShrink: 0,

                            /* Pulso visible */
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: "-4px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.35)",
                                animation: "pulse 2s infinite",
                            },

                            "@keyframes pulse": {
                                "0%": {
                                    transform: "scale(1)",
                                    opacity: 0.6,
                                },
                                "70%": {
                                    transform: "scale(1.6)",
                                    opacity: 0,
                                },
                                "100%": {
                                    opacity: 0,
                                },
                            },
                        }}
                    >
                        {/* Imagen */}
                        <Box
                            component="img"
                            src="/plataformas-web-img.jpeg"
                            alt="Plataformas Web"
                            sx={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid white",
                                position: "relative",
                                zIndex: 1,
                            }}
                        />

                        {/* Badge online */}
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: -1,
                                right: -1,
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: "#22c55e",
                                border: "2px solid #075e54",
                                boxShadow: "0 0 8px rgba(34,197,94,0.9)",
                                zIndex: 2,
                            }}
                        />
                    </Box>

                    {/* Nombre */}
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                            letterSpacing: 0.4,
                            textShadow: "0 0 6px rgba(255,255,255,0.6)",
                        }}
                    >
                        {tenant.name}
                    </Typography>
                </Box>



                {/* 👇 Este debe ocupar el espacio sobrante */}
                <ChatContainer messages={messages} isTyping={isTyping} />

                {/* 👇 Este debe quedar pegado abajo */}
                <ChatInput onSend={handleSend} />
            </Paper>


            <Dialog
                open={welcomeOpen}
                maxWidth="xs"
                fullWidth
                onClose={(e, reason) => {
                    // solo prevenimos cierre con Escape
                    if (reason === "escapeKeyDown") return;
                    setWelcomeOpen(false);
                }}
                disableEscapeKeyDown
                PaperProps={{

                    sx: {
                        animation: "dialogEnter .35s ease-out",
                        "@keyframes dialogEnter": {
                            "0%": { opacity: 0, transform: "scale(0.92) translateY(10px)" },
                            "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
                        },
                        background: "linear-gradient(180deg, #111827, #0b1220)",
                        borderRadius: 4,
                        color: "#e5e7eb",
                        boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
                        overflow: "hidden",
                    },
                }}
            >
                {/* HEADER VISUAL */}
                <Box
                    sx={{
                        pt: 4,
                        pb: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.5,
                        background:
                            "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 70%)",
                    }}
                >
                    {/* AVATAR BOT */}
                    <Box
                        sx={{
                            position: "relative",
                            width: 96,
                            height: 96,
                            borderRadius: "50%",
                            background:
                                "linear-gradient(135deg, #1f2937, #020617)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            /* Borde base */
                            border: "2px solid rgba(255,255,255,0.15)",

                            /* Sombra original */
                            boxShadow:
                                "0 0 0 6px rgba(37,99,235,0.15), 0 0 25px rgba(59,130,246,0.45)",

                            /* 🔵 Borde animado */
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: "-2px",
                                borderRadius: "50%",
                                padding: "2px",

                                background:
                                    "linear-gradient(120deg, transparent 20%, #60a5fa 35%, #2563eb 50%, #60a5fa 65%, transparent 80%)",
                                backgroundSize: "300% 300%",
                                animation: "borderFlow 4s linear infinite",

                                /* recorte SOLO borde */
                                mask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                maskComposite: "exclude",
                                WebkitMask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                WebkitMaskComposite: "xor",
                            },

                            "@keyframes borderFlow": {
                                "0%": { backgroundPosition: "0% 50%" },
                                "100%": { backgroundPosition: "300% 50%" },
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src="/PWBot.png"
                            alt="PWBot"
                            sx={{
                                width: 90,
                                height: 90,
                                objectFit: "contain",
                                filter:
                                    "drop-shadow(0 0 6px rgba(147,197,253,0.85))",
                            }}
                        />
                    </Box>


                    <Typography
                        sx={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#f9fafb",
                        }}
                    >
                        PWBot
                    </Typography>
                </Box>

                {/* CONTENIDO */}
                <DialogContent
                    sx={{
                        textAlign: "center",
                        px: 3,
                        pt: 1,
                        pb: 3,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#e5e7eb",
                            lineHeight: 1.4,

                            /* ✨ Efecto respiración suave */
                            animation: "softPulse 2.2s ease-in-out infinite",

                            "@keyframes softPulse": {
                                "0%": { opacity: 0.85 },
                                "50%": { opacity: 1 },
                                "100%": { opacity: 0.85 },
                            },
                        }}
                    >
                        Conversemos cuando quieras!
                    </Typography>
                </DialogContent>


                {/* ACCIONES */}
                <DialogActions
                    sx={{
                        px: 2,
                        pb: 3,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 0,                // 👈 separación elegante
                    }}
                >
                    <Button
                        onClick={handleExitChat}
                        sx={{
                            px: 1,
                            py: 1.2,              // 👈 más alto
                            fontSize: 15,
                            textTransform: "none",
                            color: "#9ca3af",
                            "&:hover": {
                                color: "#e5e7eb",
                            },
                        }}
                    >
                        SALIR
                    </Button>

                    <Button
                        disabled={starting}
                        variant="contained"
                        onClick={handleStartChat}
                        sx={{
                            opacity: starting ? 0.7 : 1,
                            px: 6,
                            py: 1.2,
                            position: "relative",
                            overflow: "hidden",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: 15,
                            color: "#ffffff",

                            /* 🔵 Fondo azul premium */
                            background:
                                "linear-gradient(135deg, #2563eb, #3b82f6 45%, #60a5fa 85%)",
                            backgroundSize: "200% 200%",
                            animation: "gradientShift 8s ease infinite",

                            boxShadow: "0 4px 14px rgba(59,130,246,.45)",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
                                boxShadow:
                                    "0 0 8px rgba(59,130,246,.7), inset 0 0 6px rgba(255,255,255,0.25)",
                            },

                            /* ✨ BRILLO EXTERNO — BORDE */
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: "-1px",
                                borderRadius: "inherit",
                                background:
                                    "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.9) 12%, #93c5fd 22%, rgba(255,255,255,0.9) 32%, transparent 44%)",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "300% 300%",
                                animation: "shineBorderSweep 3.2s linear infinite",
                                pointerEvents: "none",
                                zIndex: 2,

                                mask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                maskComposite: "exclude",
                                WebkitMask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                WebkitMaskComposite: "xor",
                            },

                            /* ✨ BRILLO INTERNO — línea diagonal */
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                inset: 0,
                                background:
                                    "linear-gradient(130deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)",
                                transform: "translateX(-120%)",
                                animation: "shineDiagonal 4s ease-in-out infinite",
                                borderRadius: "inherit",
                                pointerEvents: "none",
                                zIndex: 1,
                            },

                            "&:hover::after": {
                                animation: "shineDiagonal 1.2s ease-in-out",
                            },

                            /* 🔁 ANIMACIONES */
                            "@keyframes shineBorderSweep": {
                                "0%": { backgroundPosition: "-300% 0" },
                                "100%": { backgroundPosition: "300% 0" },
                            },

                            "@keyframes shineDiagonal": {
                                "0%": { transform: "translateX(-120%)" },
                                "100%": { transform: "translateX(120%)" },
                            },

                            "@keyframes gradientShift": {
                                "0%": { backgroundPosition: "0% 50%" },
                                "50%": { backgroundPosition: "100% 50%" },
                                "100%": { backgroundPosition: "0% 50%" },
                            },
                        }}
                    >
                        Saludar
                    </Button>

                </DialogActions>

            </Dialog>


        </Box>

    );

}
