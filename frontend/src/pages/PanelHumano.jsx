import { useEffect, useState, useRef } from "react";
import { IconButton, Box, Paper, Typography, List, ListItemButton, TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, } from "@mui/material";
import { getConversations, getConversation, setConversationMode, } from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";
import TuneIcon from "@mui/icons-material/Tune";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import InputBase from "@mui/material/InputBase";
import SendIcon from "@mui/icons-material/Send";
import IniciarConversacion from "./IniciarConversacion";
import DialogTomarControl from "./DialogTomarControl";

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
    const [showHint, setShowHint] = useState(true);
    const [compactNewChat, setCompactNewChat] = useState(false);
    const [expandedNewChat, setExpandedNewChat] = useState(false);

    const nuevosContactos = conversations.filter(
        (c) =>
            c.messages?.length === 1 &&
            c.messages[0]?.from === "user"
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
        const t = setTimeout(() => setCompactNewChat(true), 5000);
        return () => clearTimeout(t);
    }, []);

    //ESCUCHAR CHAT ACTIVO!
    useEffect(() => {
        if (!activePhone) return;

        const refreshChat = async () => {
            const data = await getConversation(activePhone);
            setChat(data);
        };

        refreshChat(); // inmediato

        const t = setInterval(refreshChat, 3000); // polling ligero
        return () => clearInterval(t);
    }, [activePhone]);


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
        if (!message.trim() || !activePhone || !isHumanMode) return;
        setSending(true);
        await sendHumanMessage(activePhone, message);
        setMessage("");
        setSending(false);
        const data = await getConversation(activePhone);
        setChat(data);
    }

    useEffect(() => {
        if (!chat) {
            const timer = setTimeout(() => {
                setShowHint(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [chat]);

    useEffect(() => {
        // abrir al inicio
        const openTimer = setTimeout(() => setExpandedNewChat(true), 150);

        // cerrar luego de 5s
        const closeTimer = setTimeout(() => setExpandedNewChat(false), 5000);

        return () => {
            clearTimeout(openTimer);
            clearTimeout(closeTimer);
        };
    }, []);

    function Step({ value, label, color, bg, highlight }) {
        return (
            <Box
                sx={{
                    flex: 1,                         // 👈 se mantiene
                    height: 56,
                    px: 1,
                    borderRadius: 3,
                    background: bg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",

                    /* 👇 SOLO AJUSTE REAL */
                    maxWidth: { md: 140 },           // desktop más compacto
                    mx: "auto",                      // 👈 centrado perfecto

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
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",     // 🚫 scroll global
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
                        <motion.div
                            animate={{
                                width: expandedNewChat ? 170 : 40,
                            }}
                            transition={{
                                duration: 0.45,
                                ease: "easeInOut",
                            }}
                            style={{ display: "inline-flex" }}
                        >
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setOpenNuevaConv(true)}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    borderRadius: 999,

                                    width: "100%",
                                    minWidth: 40,
                                    px: expandedNewChat ? 2.2 : 0,

                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",

                                    overflow: "hidden",
                                    whiteSpace: "nowrap",

                                    color: "#312e81",
                                    borderColor: "#c7d2fe",
                                    background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
                                    boxShadow: "0 2px 6px rgba(0,0,0,.08)",

                                    transition: "padding .45s ease",

                                    "&:hover": {
                                        background: "linear-gradient(135deg,#e0e7ff,#eef2ff)",
                                        borderColor: "#818cf8",
                                        boxShadow: "0 0 0 3px rgba(99,102,241,.25)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: expandedNewChat ? 0.6 : 0,
                                        transition: "gap .35s ease",
                                    }}
                                >
                                    {/* + */}
                                    <motion.span
                                        animate={{
                                            scale: expandedNewChat ? 1 : 1.15,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 900,
                                            lineHeight: 1,
                                        }}
                                    >
                                        +
                                    </motion.span>

                                    {/* Texto */}
                                    <AnimatePresence>
                                        {expandedNewChat && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ display: "inline-block" }}
                                            >
                                                Iniciar conversación
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Box>
                            </Button>
                        </motion.div>


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
                <DialogTomarControl
                    confirmOpen={confirmOpen}
                    cancelTake={cancelTake}
                    confirmTake={confirmTake}
                />
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

                <AnimatePresence>

                    {!chat && showHint && (
                        <Box
                            component={motion.div}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            sx={{
                                position: "absolute",
                                bottom: 24,
                                left: 0,
                                right: 0,
                                display: "flex",
                                justifyContent: "center",
                                zIndex: 5,
                                pointerEvents: "none",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "relative",
                                    px: 3.5,
                                    py: 1.6,
                                    borderRadius: 3,
                                    background: "linear-gradient(135deg, #1e3a8a, #1f2937)",
                                    boxShadow: "0 20px 40px rgba(0,0,0,.35)",
                                    overflow: "hidden",

                                    /* 🟦 borde base */
                                    border: "1px solid rgba(59,130,246,.35)",

                                    /* 🟦 borde progreso */
                                    "&::after": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "inherit",
                                        border: "2px solid #60a5fa",
                                        clipPath: "inset(0 100% 0 0)",
                                        animation: "borderProgress 5s linear forwards",
                                        pointerEvents: "none",
                                    },

                                    "@keyframes borderProgress": {
                                        "0%": {
                                            clipPath: "inset(0 100% 0 0)",
                                        },
                                        "100%": {
                                            clipPath: "inset(0 0 0 0)",
                                        },
                                    },
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
                </AnimatePresence>

            </Box>
        </Box>
    );
}
