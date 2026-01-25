import { useEffect, useState, useRef } from "react";
import {
    Box,
    Paper,
    Typography,
    List,
    ListItemButton,
    TextField,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
} from "@mui/material";
import {
    getConversations,
    getConversation,
    setConversationMode,
} from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";
import TuneIcon from "@mui/icons-material/Tune";
import { motion } from "framer-motion";

export default function PanelHumano() {
    const isMobile = useMediaQuery("(max-width:768px)");
    const messagesEndRef = useRef(null);

    const [conversations, setConversations] = useState([]);
    const [activePhone, setActivePhone] = useState(null);
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const [selectedPhone, setSelectedPhone] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isHumanMode = chat?.mode === "human";

    // 🔄 Auto-refresh conversaciones
    useEffect(() => {
        const load = () => getConversations().then(setConversations);
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, []);

    // 🔽 Auto-scroll mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat?.messages]);

    function selectConversation(phone) {
        setSelectedPhone(phone);
        setConfirmOpen(true);
    }

    async function confirmTake() {
        setConfirmOpen(false);
        await setConversationMode(selectedPhone, "human");
        setActivePhone(selectedPhone);
        const data = await getConversation(selectedPhone);
        setChat(data);
    }

    function cancelTake() {
        setSelectedPhone(null);
        setConfirmOpen(false);
    }

    async function release() {
        await setConversationMode(activePhone, "bot");
        setChat(null);
        setActivePhone(null);
    }

    async function send() {
        if (!message || !activePhone || !isHumanMode) return;
        setSending(true);
        await sendHumanMessage(activePhone, message);
        setMessage("");
        setSending(false);
        const data = await getConversation(activePhone);
        setChat(data);
    }

    return (
        <Box
            sx={{
                display: "flex",
                height: "calc(100vh - 64px)",
                overflow: "hidden",
                background:
                    "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
            }}
        >

            {/* 📋 SIDEBAR */}
            <Paper
                sx={{
                    width: 320,
                    borderRadius: 0,
                    borderRight: "1px solid #e5e7eb",
                    background: "#ffffff",
                    display: isMobile && activePhone ? "none" : "flex",
                    flexDirection: "column",
                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid #e5e7eb",
                        background: "linear-gradient(180deg, #f8fafc, #ffffff)",
                    }}
                >
                    <Typography fontWeight={600}>
                        Conversaciones
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                        {conversations.length} activas · actualización automática
                    </Typography>
                </Box>

                {/* LISTADO */}
                <List sx={{ p: 1, overflowY: "auto", flex: 1 }}>
                    {conversations.map((c) => {
                        const isHuman = c.mode === "human";
                        const selected = c.phone === activePhone;

                        // ⏱️ Tiempo relativo simple
                        const minutesAgo = c.lastMessageAt
                            ? Math.floor(
                                (Date.now() - new Date(c.lastMessageAt).getTime()) / 60000
                            )
                            : null;

                        return (
                            <ListItemButton
                                key={c.phone}
                                onClick={() => selectConversation(c.phone)}
                                sx={{
                                    mb: 0.6,
                                    borderRadius: 2,
                                    alignItems: "flex-start",
                                    position: "relative",
                                    backgroundColor: selected ? "#eef2ff" : "transparent",

                                    /* 🔥 Indicador lateral */
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        left: 0,
                                        top: 8,
                                        bottom: 8,
                                        width: 3,
                                        borderRadius: 2,
                                        backgroundColor: isHuman ? "#10b981" : "#3b82f6",
                                        opacity: selected ? 1 : 0.4,
                                    },

                                    "&:hover": {
                                        backgroundColor: "#f1f5f9",
                                    },
                                }}
                            >
                                {/* AVATAR */}
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background:
                                            "linear-gradient(135deg, #e0e7ff, #f8fafc)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "#1e293b",
                                        mr: 1.5,
                                        flexShrink: 0,
                                    }}
                                >
                                    {c.phone.slice(-2)}
                                </Box>

                                {/* CONTENIDO */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={500}>
                                        {c.phone}
                                    </Typography>

                                    {/* BADGES */}
                                    <Box sx={{ mt: 0.4, display: "flex", gap: 0.6 }}>
                                        <Box
                                            sx={{
                                                px: 1,
                                                py: 0.2,
                                                borderRadius: 1,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                backgroundColor: isHuman ? "#ecfdf5" : "#eff6ff",
                                                color: isHuman ? "#065f46" : "#1e40af",
                                            }}
                                        >
                                            {isHuman ? "CONTROL HUMANO" : "AUTOMATIZADO"}
                                        </Box>

                                        {minutesAgo !== null && (
                                            <Typography fontSize={11} color="text.secondary">
                                                hace {minutesAgo} min
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* 🔔 MENSAJE NUEVO */}
                                {c.hasUnread && (
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            backgroundColor: "#22c55e",
                                            mt: 1,
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>
            </Paper>

            {/* 💬 CHAT */}
            {chat ? (
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* HEADER */}
                    <Box
                        sx={{
                            p: 2,
                            borderBottom: "1px solid #e5e7eb",
                            background: "#ffffff",
                        }}
                    >
                        {isMobile && (
                            <Button
                                size="small"
                                onClick={() => {
                                    setChat(null);
                                    setActivePhone(null);
                                }}
                            >
                                ← Volver
                            </Button>
                        )}

                        <Typography fontWeight={600}>{chat.phone}</Typography>

                        <Typography
                            fontSize={12}
                            color={isHumanMode ? "success.main" : "info.main"}
                        >
                            {isHumanMode
                                ? "👤 Control humano activo"
                                : "🤖 IA operando"}
                        </Typography>

                        <Button
                            size="small"
                            color="warning"
                            onClick={release}
                            sx={{ mt: 1 }}
                        >
                            Devolver a IA
                        </Button>
                    </Box>

                    {/* MENSAJES */}
                    <Box
                        sx={{
                            flex: 1,
                            p: 3,
                            overflowY: "auto",
                            background:
                                "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
                        }}
                    >
                        {chat.messages.map((m, i) => {
                            const isBot = m.from === "bot";
                            const isHuman = m.from === "human";
                            const isUser = m.from === "user";

                            return (
                                <Box
                                    key={i}
                                    sx={{
                                        display: "flex",
                                        justifyContent: isUser ? "flex-start" : "flex-end",
                                        mb: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: "70%",
                                            px: 2,
                                            py: 1.2,
                                            borderRadius: 3,
                                            fontSize: 14,
                                            background: isBot
                                                ? "linear-gradient(135deg, #dbeafe, #eff6ff)"
                                                : isHuman
                                                    ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                                                    : "#ffffff",
                                            boxShadow:
                                                "0 8px 24px rgba(0,0,0,0.06)",
                                            border: "1px solid #e5e7eb",
                                        }}
                                    >
                                        {isBot && (
                                            <Typography fontSize={11} color="info.main">
                                                🤖 IA
                                            </Typography>
                                        )}
                                        {isHuman && (
                                            <Typography fontSize={11} color="success.main">
                                                👤 Operador
                                            </Typography>
                                        )}
                                        <Typography>{m.text}</Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* INPUT */}
                    <Box sx={{ p: 2, background: "#ffffff" }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                placeholder="Responder como operador humano…"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        send();
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                disabled={sending}
                                onClick={send}
                            >
                                Enviar
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            ) : (
                !isMobile && (
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "text.secondary",
                        }}
                    >
                        Selecciona una conversación
                    </Box>
                )
            )}

            <Dialog
                open={confirmOpen}
                onClose={cancelTake}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        background: "#111827", // rgb(17 24 39)
                        borderRadius: 3,
                        color: "#e5e7eb",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#f9fafb",
                    }}
                >
                    <TuneIcon fontSize="small" />
                    Control de conversación
                </DialogTitle>



                <DialogContent sx={{ pt: 1 }}>
                    <Typography fontSize={14} sx={{ color: "#d1d5db" }}>
                        La automatización se pausará y pasarás a control manual.
                    </Typography>


                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            borderRadius: 2,
                            background: "linear-gradient(135deg, #1f2937, #111827)",
                            border: "1px solid #374151",
                        }}
                    >
                        <>
                            {/* 🔄 Animación BOT → HUMANO */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto 1fr",
                                    alignItems: "center",
                                    px: 1,
                                    py: 1.5,
                                    width: "100%",
                                }}
                            >
                                {/* BOT (izquierda, alineado al centro visual) */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifySelf: "end",
                                        pr: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #1f2937, #111827)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 0 12px rgba(37,99,235,0.35)",
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src="/PWBot.png"
                                            alt="Bot"
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                objectFit: "contain",
                                                filter: "drop-shadow(0 0 4px rgba(147,197,253,0.6))",
                                            }}
                                        />
                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            color: "#d1d5db",
                                            mt: 0.45,
                                        }}
                                    >
                                        PWBot
                                    </Typography>
                                </Box>

                                {/* FLUJO (centro matemático) */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 0.6,
                                    }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <motion.span
                                            key={i}
                                            style={{
                                                width: 9,
                                                height: 9,
                                                borderRadius: "50%",
                                                background: "radial-gradient(circle, #93c5fd 0%, #2563eb 100%)",
                                                boxShadow: "0 0 10px rgba(59,130,246,0.8)",
                                            }}
                                            animate={{
                                                scale: [0.85, 1.35, 0.85],
                                                opacity: [0.35, 1, 0.35],
                                                x: [0, 2, 0],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                repeatDelay: 0.2,
                                                duration: 1.2,
                                                delay: i * 0.22,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    ))}
                                </Box>

                                {/* HUMANO (derecha, alineado simétrico) */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifySelf: "start",
                                        pl: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #065f46, #064e3b)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 0 12px rgba(34,197,94,0.35)",
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src="/ejecutivo.png"
                                            alt="Bot"
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                objectFit: "contain",
                                                filter: "drop-shadow(0 0 4px rgba(147,197,253,0.6))",
                                            }}
                                        />
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            color: "#d1d5db",
                                            mt: 0.45,
                                        }}
                                    >
                                        Humano
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ⚠️ Texto corto y simple (sin bordes) */}
                            <Typography
                                sx={{
                                    mt: 1,
                                    fontSize: 13,
                                    color: "#e5e7eb",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    opacity: 0.95,
                                }}
                            >
                                Tomarás el control y se pausará el bot.
                            </Typography>
                        </>

                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={cancelTake}
                        sx={{
                            color: "#9ca3af",
                            "&:hover": { color: "#e5e7eb" },
                        }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={confirmTake}
                        sx={{
                            px: 3,                       // 👈 tamaño original
                            position: "relative",
                            overflow: "hidden",
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#ffffff",

                            /* 🌿 Fondo esmeralda (sin aumentar tamaño) */
                            background:
                                "linear-gradient(135deg, #34d399, #10b981 45%, #059669 85%)",
                            backgroundSize: "200% 200%",
                            animation: "gradientShift 8s ease infinite",

                            boxShadow: "0 4px 12px rgba(16,185,129,.35)",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg,#2dd4bf,#10b981,#059669)",
                                boxShadow:
                                    "0 0 6px rgba(16,185,129,.6), inset 0 0 6px rgba(255,255,255,0.25)",
                            },

                            /* ✨ BRILLO EXTERNO — borde (NO cambia tamaño visual) */
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: "-1px",              // 👈 mínimo, no agranda
                                borderRadius: "inherit",
                                background:
                                    "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.9) 12%, #6ee7b7 22%, rgba(255,255,255,0.9) 32%, transparent 44%)",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "300% 300%",
                                animation: "shineBorderSweep 3.2s linear infinite",
                                pointerEvents: "none",
                                zIndex: 2,

                                /* recorte SOLO borde */
                                mask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                maskComposite: "exclude",
                                WebkitMask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                WebkitMaskComposite: "xor",
                            },

                            /* ✨ BRILLO INTERNO — línea blanca diagonal */
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
                        Tomar control
                    </Button>

                </DialogActions>
            </Dialog>

        </Box>
    );
}
