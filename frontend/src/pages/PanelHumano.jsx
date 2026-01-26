import { useEffect, useState, useRef } from "react";
import { Box, Paper, Typography, List, ListItemButton, TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, } from "@mui/material";
import { getConversations, getConversation, setConversationMode, } from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";
import TuneIcon from "@mui/icons-material/Tune";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";


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
    const nuevosLeads = conversations.filter(
        (c) => !c.mode && (!c.messages || c.messages.length <= 1)
    ).length;

    const potencialesLeads = conversations.filter(
        (c) => c.mode !== "human" && c.messages && c.messages.length > 1
    ).length;

    const totalChats = conversations.length;

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
    function Indicador({ label, value, color, bg }) {
        const mv = useMotionValue(0);
        const rounded = useTransform(mv, (v) => Math.round(v));

        useEffect(() => {
            const controls = animate(mv, value, {
                duration: 0.5,
                ease: "easeOut",
            });
            return controls.stop;
        }, [value]);

        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{ flex: "0 0 auto" }}
            >
                <Box
                    sx={{
                        px: 1.5,
                        py: 1,
                        maxWidth: 96,            // 👈 CLAVE
                        borderRadius: 2.5,
                        background: bg,
                        border: "1px solid rgba(0,0,0,.06)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 9,           // 👈 más chico
                            fontWeight: 700,
                            color: "#374151",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {label}
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: 22,          // 👈 compacto pero visible
                            fontWeight: 900,
                            color,
                            lineHeight: 1.05,
                        }}
                    >
                        <motion.span>{rounded}</motion.span>
                    </Typography>
                </Box>
            </motion.div>
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
                    background:
                        "linear-gradient(180deg, #ffffff, #f8fafc)",
                }}
            >
                <Stack
                    direction="row"
                    spacing={1}                  // 👈 menos separación
                    justifyContent="center"
                    alignItems="center"
                    flexWrap="nowrap"
                    sx={{ overflow: "hidden" }}
                >

                    <Indicador
                        label="Nuevos Leads"
                        value={nuevosLeads}
                        color="#2563eb"
                        bg="linear-gradient(135deg, #eff6ff, #dbeafe)"
                    />

                    <Indicador
                        label="Potenciales Leads"
                        value={potencialesLeads}
                        color="#d97706"
                        bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
                    />

                    <Indicador
                        label="Total Chats"
                        value={totalChats}
                        color="#059669"
                        bg="linear-gradient(135deg, #ecfdf5, #d1fae5)"
                    />
                </Stack>
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
                        }}
                    >
                        <Typography fontWeight={600}>
                            Conversaciones
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                            {conversations.length} activas · actualización automática
                        </Typography>
                    </Box>

                    <List sx={{ p: 1, overflowY: "auto", flex: 1 }}>
                        {conversations.map((c) => {
                            const isHuman = c.mode === "human";
                            const selected = c.phone === activePhone;

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
                                            : "transparent",
                                        "&::before": {
                                            content: '""',
                                            position: "absolute",
                                            left: 0,
                                            top: 8,
                                            bottom: 8,
                                            width: 3,
                                            borderRadius: 2,
                                            backgroundColor: isHuman
                                                ? "#10b981"
                                                : "#3b82f6",
                                            opacity: selected ? 1 : 0.4,
                                        },
                                    }}
                                >
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
                                            mr: 1.5,
                                        }}
                                    >
                                        {c.phone.slice(-2)}
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
                                p: 2,
                                borderBottom: "1px solid #e5e7eb",
                                background: "#ffffff",
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
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
                                color={
                                    isHumanMode
                                        ? "success.main"
                                        : "info.main"
                                }
                            >
                                {isHumanMode
                                    ? "Control humano activo"
                                    : "IA operando"}
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
                                p: 1.5,
                                background: "#ffffff",
                                borderTop: "1px solid #e5e7eb",
                                position: "sticky",
                                bottom: 0,
                            }}
                        >
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    fullWidth
                                    multiline
                                    maxRows={4}
                                    placeholder="Responder…"
                                    value={message}
                                    onChange={(e) =>
                                        setMessage(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" &&
                                            !e.shiftKey
                                        ) {
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
