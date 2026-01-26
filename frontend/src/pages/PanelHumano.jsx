import { useEffect, useState, useRef } from "react";
import { IconButton, Box, Paper, Typography, List, ListItemButton, TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, } from "@mui/material";
import { getConversations, getConversation, setConversationMode, } from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";
import TuneIcon from "@mui/icons-material/Tune";
import { motion } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import InputBase from "@mui/material/InputBase";
import SendIcon from "@mui/icons-material/Send";
import IniciarConversacion from "./IniciarConversacion";

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
    const [openNuevaConv, setOpenNuevaConv] = useState(false);

    const nuevosContactos = conversations.filter(
        (c) => !c.mode && (!c.messages || c.messages.length <= 1)
    ).length;

    const clientesEnEspera = conversations.filter(
        (c) => c.needsHuman && c.mode !== "human"
    ).length;

    const conversacionesAtendidas = conversations.filter(
        (c) => c.mode === "human"
    ).length;
    const [shakeEnEspera, setShakeEnEspera] = useState(false);
    const conversationsSorted = [...conversations].sort((a, b) => {
        // Prioridad: needsHuman primero
        if (a.needsHuman && !b.needsHuman) return -1;
        if (!a.needsHuman && b.needsHuman) return 1;

        // Luego por fecha (más reciente arriba)
        const da = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const db = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return db - da;
    });

    const shakeTimerRef = useRef(null);

    useEffect(() => {
        const load = () => getConversations().then(setConversations);
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, []);

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


    function Step({ value, label, color, bg, highlight }) {
        return (
            <Box
                sx={{
                    flex: 1,
                    height: 56,
                    px: 1,
                    borderRadius: 3,
                    background: bg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    boxShadow: highlight
                        ? "0 0 0 2px rgba(220,38,38,.25), 0 8px 20px rgba(0,0,0,.12)"
                        : "0 6px 16px rgba(0,0,0,.08)",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 900,
                        color,
                        lineHeight: 1,
                    }}
                >
                    {value}
                </Typography>

                <Box sx={{ mt: 0.4, textAlign: "center" }}>
                    {label.split(" ").slice(0, 2).map((w, i) => (
                        <Typography
                            key={i}
                            sx={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                letterSpacing: 0.3,
                                lineHeight: 1.05,
                                textTransform: "uppercase",
                                color: "#374151",
                            }}
                        >
                            {w}
                        </Typography>
                    ))}
                </Box>
            </Box>
        );
    }

    function Arrow({ active }) {
        return (
            <Box
                component={motion.div}
                animate={
                    active
                        ? { opacity: [0.4, 1, 0.4] }
                        : { opacity: 0.35 }
                }
                transition={{
                    repeat: active ? Infinity : 0,
                    duration: 1.6,
                    ease: "easeInOut",
                }}
                sx={{
                    mx: 0.6,
                    fontSize: 18,
                    fontWeight: 700,
                    color: active ? "#dc2626" : "#9ca3af",
                    lineHeight: 1,
                }}
            >
                →
            </Box>
        );
    }


    useEffect(() => {
        if (shakeTimerRef.current) {
            clearInterval(shakeTimerRef.current);
            shakeTimerRef.current = null;
        }

        if (clientesEnEspera <= 0) {
            setShakeEnEspera(false);
            return;
        }

        const triggerShake = () => {
            setShakeEnEspera(true);
            setTimeout(() => setShakeEnEspera(false), 1000);
        };

        // 🔔 vibra de inmediato
        triggerShake();

        // 🔁 vibra cada 5 segundos
        shakeTimerRef.current = setInterval(triggerShake, 5000);

        return () => {
            if (shakeTimerRef.current) {
                clearInterval(shakeTimerRef.current);
                shakeTimerRef.current = null;
            }
        };
    }, [clientesEnEspera]);


    function IndicadorFunnel({
        nuevos,
        enEspera,
        atendidos,
        shakeEnEspera, // 👈 FALTA ESTO
    }) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 0.2,
                }}
            >
                <Step
                    value={nuevos}
                    label="Nuevos Contactos"
                    color="#2563eb"
                    bg="linear-gradient(135deg,#eff6ff,#dbeafe)"
                />

                <Arrow active={enEspera > 0} />

                <Box
                    key={shakeEnEspera ? `shake-${Date.now()}` : "idle"}
                    component={motion.div}
                    initial={{ rotate: 0, skewX: 0, skewY: 0 }}
                    animate={{
                        rotate: [-1.2, 1.2, -0.9, 0.9, -0.5, 0.5, 0],
                        skewX: [0.8, -0.8, 0.6, -0.6, 0.3, -0.3, 0],
                        skewY: [-0.8, 0.8, -0.6, 0.6, -0.3, 0.3, 0],
                    }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    style={{ flex: 1, position: "relative", transformOrigin: "center center" }}
                >
                    {/* 🔴 OVERLAY DE ALERTA (intensifica fondo) */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 3,
                            background:
                                "rgba(220,38,38,.18)",
                            opacity: shakeEnEspera ? 1 : 0,
                            transition: "opacity .25s ease",
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    />

                    {/* CONTENIDO REAL */}
                    <Box sx={{ position: "relative", zIndex: 2 }}>
                        <Step
                            value={enEspera}
                            label="En Espera"
                            color="#dc2626"
                            bg="linear-gradient(135deg,#fee2e2,#fecaca)"
                        />
                    </Box>
                </Box>



                <Arrow active={enEspera > 0} />

                <Step
                    value={atendidos}
                    label="Clientes Atendidos"
                    color={clientesEnEspera > 0 ? "#6b7280" : "#059669"}
                    bg={
                        clientesEnEspera > 0
                            ? "linear-gradient(135deg,#f9fafb,#f3f4f6)"
                            : "linear-gradient(135deg,#ecfdf5,#d1fae5)"
                    }
                />

            </Box>
        );
    }



    return (

        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: isMobile ? "100dvh" : "calc(100vh - 64px)",
                background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
                overflowX: "hidden",     // 👈 CLAVE
            }}
        >
            {/* INDICADORES */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #e5e7eb",
                    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                }}
            >
                <IndicadorFunnel
                    nuevos={nuevosContactos}
                    enEspera={clientesEnEspera}
                    atendidos={conversacionesAtendidas}
                    shakeEnEspera={shakeEnEspera}
                />

            </Box>


            <Box
                sx={{
                    display: "flex",
                    flex: 1,
                    minWidth: 0,          // 👈 CLAVE
                    overflow: "hidden",   // 👈 CLAVE
                }}
            >
                {/* SIDEBAR */}
                <Paper
                    sx={{
                        width: isMobile ? "100%" : 320,
                        flexShrink: 0,      // 👈 CLAVE
                        borderRadius: 0,
                        borderRight: "1px solid #e5e7eb",
                        background: "#ffffff",
                        display: isMobile && activePhone ? "none" : "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: "1px solid #e5e7eb",
                            background: "linear-gradient(180deg, #f8fafc, #ffffff)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                        }}
                    >
                        {/* IZQUIERDA */}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={600} noWrap>
                                Conversaciones
                            </Typography>
                            <Typography fontSize={12} color="text.secondary" noWrap>
                                {clientesEnEspera > 0
                                    ? `${clientesEnEspera} en espera · atención requerida`
                                    : `${conversations.length} activas · sin pendientes`}
                            </Typography>
                        </Box>

                        {/* DERECHA */}
                        <Button
                            size="small"
                            variant="outlined"
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: 13,
                                borderRadius: 999,
                                px: 2.2,
                                whiteSpace: "nowrap",

                                color: "#312e81",
                                borderColor: "#c7d2fe",
                                background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
                                boxShadow: "0 2px 6px rgba(0,0,0,.08)",

                                "&:hover": {
                                    background: "linear-gradient(135deg,#e0e7ff,#eef2ff)",
                                    borderColor: "#818cf8",
                                    boxShadow: "0 0 0 3px rgba(99,102,241,.25)",
                                },
                            }}
                            onClick={() => setOpenNuevaConv(true)}
                            startIcon={
                                <Box
                                    sx={{
                                        fontSize: 18,
                                        fontWeight: 900,
                                        lineHeight: 1,
                                    }}
                                >
                                    +
                                </Box>
                            }
                        >

                            Iniciar conversación
                        </Button>


                    </Box>


                    <List sx={{ p: 1, overflowY: "auto", flex: 1 }}>
                        {conversationsSorted.map((c) => {
                            const isHuman = c.mode === "human";
                            const selected = c.phone === activePhone;
                            const needsAttention = c.needsHuman && !isHuman;

                            const minutesAgo = c.lastMessageAt
                                ? Math.floor(
                                    (Date.now() -
                                        new Date(c.lastMessageAt).getTime()) /
                                    60000
                                )
                                : null;

                            return (
                                <ListItemButton
                                    key={c.phone}
                                    onClick={() => selectConversation(c.phone)}
                                    sx={{
                                        minWidth: 0,
                                        mb: 0.6,
                                        borderRadius: 2,
                                        alignItems: "flex-start",
                                        position: "relative",
                                        backgroundColor: selected
                                            ? "#eef2ff"
                                            : needsAttention
                                                ? "#fef2f2"   // 👈 fondo alerta suave
                                                : "transparent",

                                        "&:hover": {
                                            backgroundColor: needsAttention
                                                ? "#fee2e2"
                                                : "#f1f5f9",
                                        },

                                        "&::before": {
                                            content: '""',
                                            position: "absolute",
                                            left: 0,
                                            top: 8,
                                            bottom: 8,
                                            width: 3,
                                            borderRadius: 2,
                                            backgroundColor: needsAttention
                                                ? "#dc2626"
                                                : isHuman
                                                    ? "#10b981"
                                                    : "#3b82f6",
                                            opacity: selected ? 1 : 0.7,
                                        },
                                    }}

                                >
                                    <Box sx={{ position: "relative", mr: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #e0e7ff, #f8fafc)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 700,
                                                fontSize: 13,
                                            }}
                                        >
                                            {c.phone.slice(-2)}
                                        </Box>

                                        {needsAttention && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: -1,
                                                    right: -1,
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#dc2626",
                                                    border: "2px solid #fff",
                                                }}
                                            />
                                        )}
                                    </Box>


                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={500}>
                                            {c.phone}
                                        </Typography>
                                        <Box
                                            sx={{
                                                mt: 0.4,
                                                display: "flex",
                                                gap: 0.6,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: 1,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    backgroundColor: isHuman
                                                        ? "#ecfdf5"
                                                        : "#eff6ff",
                                                }}
                                            >
                                                {isHuman
                                                    ? "CONTROL HUMANO"
                                                    : "AUTOMATIZADO"}
                                            </Box>
                                            {minutesAgo !== null && (
                                                <Typography
                                                    fontSize={11}
                                                    color="text.secondary"
                                                >
                                                    hace {minutesAgo} min
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Paper>

                {/* CHAT */}
                {chat && (
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,      // 👈 CLAVE
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* HEADER */}
                        <Box
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderBottom: "1px solid #e5e7eb",
                                background: "#ffffff",
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                            }}
                        >
                            {/* IZQUIERDA */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                {isMobile && (
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setChat(null);
                                            setActivePhone(null);
                                        }}
                                    >
                                        <ArrowBackIosNewIcon fontSize="small" />
                                    </IconButton>
                                )}

                                <Box>
                                    <Typography fontWeight={600} lineHeight={1.1}>
                                        {chat.phone}
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.6,
                                            mt: 0.3,
                                            px: 1,
                                            py: 0.2,
                                            borderRadius: 1,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            backgroundColor: isHumanMode ? "#ecfdf5" : "#eff6ff",
                                            color: isHumanMode ? "#065f46" : "#1e40af",
                                        }}
                                    >
                                        {isHumanMode ? (
                                            <>
                                                <PersonIcon sx={{ fontSize: 14 }} />
                                                CONTROL HUMANO
                                            </>
                                        ) : (
                                            <>
                                                <SmartToyIcon sx={{ fontSize: 14 }} />
                                                IA ACTIVA
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {/* DERECHA */}
                            {isHumanMode && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    onClick={release}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 1.8,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Devolver a IA
                                </Button>
                            )}
                        </Box>


                        {/* MENSAJES */}
                        <Box
                            sx={{
                                flex: 1,
                                px: isMobile ? 1.5 : 3,
                                py: 2,
                                overflowY: "auto",
                            }}
                        >
                            {chat.messages.map((m, i) => {
                                const isUser = m.from === "user";
                                const isBot = m.from === "bot";
                                const isHuman = m.from === "human";

                                return (
                                    <Box
                                        key={i}
                                        sx={{
                                            display: "flex",
                                            justifyContent: isUser
                                                ? "flex-start"
                                                : "flex-end",
                                            mb: 1.5,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                maxWidth: isMobile
                                                    ? "90%"
                                                    : "70%",
                                                px: 2,
                                                py: 1.2,
                                                borderRadius: 3,
                                                fontSize: 14,
                                                background: isBot
                                                    ? "#eff6ff"
                                                    : isHuman
                                                        ? "#dcfce7"
                                                        : "#ffffff",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        >
                                            <Typography>{m.text}</Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* INPUT */}
                        <Box
                            sx={{
                                px: 1.5,
                                py: 1.2,
                                background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                                borderTop: "1px solid #e5e7eb",
                                position: "sticky",
                                bottom: 0,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                {/* TEXT INPUT */}
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: 44,                 // 👈 MISMA ALTURA
                                        borderRadius: 999,
                                        border: "1px solid #e5e7eb",
                                        background: "#ffffff",
                                        px: 2,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <InputBase
                                        multiline
                                        maxRows={4}
                                        placeholder="Escribe un mensaje…"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                send();
                                            }
                                        }}
                                        sx={{
                                            width: "100%",
                                            fontSize: 14,
                                            lineHeight: 1.4,
                                        }}
                                    />
                                </Box>

                                {/* SEND BUTTON */}
                                <IconButton
                                    disabled={sending || !message.trim()}
                                    onClick={send}
                                    sx={{
                                        width: 44,                  // 👈 MISMA ALTURA
                                        height: 44,
                                        flexShrink: 0,
                                        borderRadius: "50%",
                                        background:
                                            "linear-gradient(135deg,#2563eb,#1d4ed8)",
                                        color: "#ffffff",
                                        boxShadow: "0 4px 10px rgba(37,99,235,.35)",

                                        "&:hover": {
                                            background:
                                                "linear-gradient(135deg,#1d4ed8,#1e40af)",
                                        },

                                        "&.Mui-disabled": {
                                            background: "#e5e7eb",
                                            color: "#9ca3af",
                                            boxShadow: "none",
                                        },
                                    }}
                                >
                                    <SendIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Box>


                    </Box>
                )}



                {/* DIALOG TOMAR CONTROL */}
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
                {/* DIALOG INICIAR CONVERSACIÓN */}
                <Dialog
                    open={openNuevaConv}
                    onClose={() => setOpenNuevaConv(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3, p: 2.5 },
                    }}
                >
                    <IniciarConversacion onClose={() => setOpenNuevaConv(false)} />
                </Dialog>


                {!chat && (
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        sx={{
                            position: "absolute",
                            bottom: 24,
                            left: 0,
                            right: 0,                // 👈 CLAVE
                            display: "flex",
                            justifyContent: "center",
                            zIndex: 5,
                            pointerEvents: "none",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3.5,
                                py: 1.6,
                                borderRadius: 3,
                                background: "linear-gradient(135deg, #1f2937, #111827)",
                                boxShadow: "0 20px 40px rgba(0,0,0,.35)",
                                border: "1px solid #374151",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#e5e7eb",
                                    whiteSpace: "nowrap",
                                    letterSpacing: 0.3,
                                }}
                            >
                                Selecciona una conversación para comenzar
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
