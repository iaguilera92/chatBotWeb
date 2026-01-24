import { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    List,
    ListItemButton,
    TextField,
    Button,
    Stack,
    Divider,
    useMediaQuery,
} from "@mui/material";
import {
    getConversations,
    getConversation,
    setConversationMode,
} from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";

export default function PanelHumano() {
    const isMobile = useMediaQuery("(max-width:768px)");

    const [conversations, setConversations] = useState([]);
    const [activePhone, setActivePhone] = useState(null);
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    // 🔄 Auto-refresh lista
    useEffect(() => {
        const load = () => getConversations().then(setConversations);
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, []);

    // 📂 Abrir conversación
    async function openConversation(phone) {
        setActivePhone(phone);
        const data = await getConversation(phone);
        setChat(data);
    }

    // 👤 Tomar / devolver conversación
    async function take() {
        await setConversationMode(activePhone, "human");
        const data = await getConversation(activePhone);
        setChat(data);
    }

    async function release() {
        await setConversationMode(activePhone, "bot");
        const data = await getConversation(activePhone);
        setChat(data);
    }

    // 📤 Enviar mensaje humano
    async function send() {
        if (!message || !activePhone) return;

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
                flexDirection: isMobile ? "column" : "row",
            }}
        >
            {/* 📋 LISTA DE CONVERSACIONES */}
            {(!isMobile || !activePhone) && (
                <Paper
                    sx={{
                        width: isMobile ? "100%" : 320,
                        height: isMobile ? "100%" : "auto",
                        overflowY: "auto",
                        borderRadius: 0,
                    }}
                >
                    <Typography sx={{ p: 2 }} fontWeight={600}>
                        Conversaciones
                    </Typography>

                    <List>
                        {conversations.map((c) => (
                            <ListItemButton
                                key={c.phone}
                                selected={c.phone === activePhone}
                                onClick={() => openConversation(c.phone)}
                            >
                                <Box>
                                    <Typography>{c.phone}</Typography>
                                    <Typography fontSize={12} color="gray">
                                        {c.canReply ? "🟢 Activo" : "🔴 Inactivo"} · {c.mode}
                                    </Typography>
                                </Box>
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}

            {/* 💬 CHAT */}
            {chat && (
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                    }}
                >
                    {/* HEADER CHAT */}
                    <Box sx={{ p: 2 }}>
                        {isMobile && (
                            <Button
                                size="small"
                                onClick={() => {
                                    setActivePhone(null);
                                    setChat(null);
                                }}
                                sx={{ mb: 1 }}
                            >
                                ← Volver
                            </Button>
                        )}

                        <Typography fontWeight={600}>{chat.phone}</Typography>

                        <Stack direction="row" spacing={1} mt={1}>
                            <Button size="small" onClick={take}>
                                Tomar
                            </Button>
                            <Button size="small" onClick={release}>
                                Volver al bot
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* MENSAJES */}
                    <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
                        {chat.messages.map((m, i) => (
                            <Box key={i} sx={{ mb: 1 }}>
                                <b>{m.from}:</b> {m.text}
                            </Box>
                        ))}
                    </Box>

                    {/* INPUT */}
                    <Box sx={{ p: 2 }}>
                        <Stack direction={isMobile ? "column" : "row"} spacing={1}>
                            <TextField
                                fullWidth
                                placeholder="Escribe tu respuesta..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
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

            {!chat && isMobile && (
                <Box sx={{ p: 3 }}>
                    <Typography color="gray">
                        Selecciona una conversación
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
