import { useEffect, useState, useRef } from "react"; import { IconButton, Box, Paper, Typography, List, ListItemButton, Button, Dialog, useMediaQuery, } from "@mui/material"; import { getConversations, getConversation, setConversationMode, } from "../services/conversations.api"; import { sendHumanMessage } from "../services/operator.api"; import { motion, AnimatePresence } from "framer-motion"; import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"; import SmartToyIcon from "@mui/icons-material/SmartToy"; import PersonIcon from "@mui/icons-material/Person"; import InputBase from "@mui/material/InputBase"; import SendIcon from "@mui/icons-material/Send"; import IniciarConversacion from "./IniciarConversacion"; import DialogTomarControl from "./DialogTomarControl"; import MoreVertIcon from "@mui/icons-material/MoreVert"; import Menu from "@mui/material/Menu"; import MenuItem from "@mui/material/MenuItem";

export default function PanelHumano() {
    const isMobile = useMediaQuery("(max-width:768px)");
    const messagesEndRef = useRef(null);
    const [conversations, setConversations] = useState([]);
    const [activePhone, setActivePhone] = useState(null);
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const isHumanMode = chat?.mode === "human";
    const [openNuevaConv, setOpenNuevaConv] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [showHintMessage, setShowHintMessage] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [showClap, setShowClap] = useState(false);
    const prevAtendidosRef = useRef(0);
    const [expandedNewChat, setExpandedNewChat] = useState(false);
    const [phase, setPhase] = useState(0); // 0 = anim inicial, 1 = atenuar, 2 = solo WhatsApp
    const atendidosRef = useRef(new Set());
    const conversacionesAtendidas = atendidosRef.current.size;
    //const conversacionesAtendidas = 1000; TEST
    const clientesEnEspera = conversations.filter((c) => c.needsHuman && c.mode !== "human").length;
    const isFirstRenderRef = useRef(true);
    const allowClapRef = useRef(false);
    const prevNeedsHumanRef = useRef(new Map());
    const initializedRef = useRef(false);
    const [conversacionObjetivo, setConversacionObjetivo] = useState(null);
    const ocultarHeaderChat = isHumanMode && chat;
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuPhone, setMenuPhone] = useState(null);
    const iconos = [
        { src: "/instagram-logo.png", alt: "Instagram" },
        { src: "/facebook-logo.png", alt: "Facebook" },
        { src: "/whatsapp-logo.webp", alt: "WhatsApp" },
        { src: "/tiktok-logo.png", alt: "TikTok" },
    ];

    //CARGAR ATENDIDOS PRIMERA VEZ
    useEffect(() => {
        if (!conversations.length) return;
        if (initializedRef.current) return;

        conversations.forEach(c => {
            if (c.mode === "human" && c.needsHuman === false) {
                atendidosRef.current.add(c.phone);
            }
            prevNeedsHumanRef.current.set(c.phone, c.needsHuman);
        });

        initializedRef.current = true;
    }, [conversations]);

    //ATENDIDOS
    useEffect(() => {
        conversations.forEach(c => {
            const prevNeeds = prevNeedsHumanRef.current.get(c.phone);

            // 👀 transición: estaba en espera → ya no lo está
            if (prevNeeds === true && c.needsHuman === false) {
                atendidosRef.current.add(c.phone);
            }

            // guardar estado actual
            prevNeedsHumanRef.current.set(c.phone, c.needsHuman);
        });
    }, [conversations]);

    //TIEMPOS REDES
    useEffect(() => {
        const timer1 = setTimeout(() => setPhase(1), 1200 / speed);
        const timer2 = setTimeout(() => setPhase(2), 1350 / speed);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [speed]);

    //DETECTAR AUMENTO DE ATENDIDOS
    useEffect(() => {
        let timer;
        const prev = prevAtendidosRef.current;

        if (isFirstRenderRef.current) {
            prevAtendidosRef.current = conversacionesAtendidas;
            isFirstRenderRef.current = false;
            return;
        }

        // 🚫 SIN ACCIÓN HUMANA → NO APLAUSOS
        if (!allowClapRef.current) {
            prevAtendidosRef.current = conversacionesAtendidas;
            return;
        }

        if (conversacionesAtendidas > prev) {
            setShowClap(true);
            timer = setTimeout(() => setShowClap(false), 900);
        }

        // 👇 CLAVE: consumir SIEMPRE la acción humana
        allowClapRef.current = false;

        prevAtendidosRef.current = conversacionesAtendidas;

        return () => clearTimeout(timer);
    }, [conversacionesAtendidas]);

    const handleMenuClick = (event, phone) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setMenuPhone(phone);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuPhone(null);
    };

    const handleEliminar = (phone) => {
        handleMenuClose();
        deleteConversation(phone);
    };

    const handleVer = (phone) => {
        handleMenuClose();
        viewConversation(phone);
    };



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

    function selectConversation(conversation) {
        setConversacionObjetivo({
            ...conversation,
            prioritaria: false, // modo normal
        });
        setConfirmOpen(true);
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

    //ENVIAR MENSAJE CLIENTE
    async function send() {
        if (!message.trim() || !activePhone) return;

        setSending(true);

        // 1️⃣ Forzar modo humano
        await setConversationMode(activePhone, "human");

        // 🚩 MARCAR que este send puede generar atendido
        allowClapRef.current = true;

        // 2️⃣ Enviar mensaje humano
        await sendHumanMessage(activePhone, message);
        setMessage("");

        // 3️⃣ Recargar conversación
        const data = await getConversation(activePhone);
        setChat(data);

        // 4️⃣ Recargar lista (esto dispara los efectos)
        const list = await getConversations();
        setConversations(list);

        setSending(false);
    }

    function formatTimeAgo(minutesAgo) {
        if (minutesAgo < 60) {
            return `${minutesAgo}m`;
        } else if (minutesAgo < 1440) { // menos de 24 horas
            const h = Math.floor(minutesAgo / 60);
            const m = minutesAgo % 60;
            return `${h}h${m > 0 ? ` ${m}m` : ""}`;
        } else { // más de 24 horas
            const days = Math.floor(minutesAgo / 1440);
            const h = Math.floor((minutesAgo % 1440) / 60);
            const m = minutesAgo % 60;
            return `${days}d${h > 0 ? ` ${h}h` : ""}${m > 0 ? ` ${m}m` : ""}`;
        }
    }
    async function confirmarToma(conversacion) {
        if (!conversacion) return;

        const phone = conversacion.phone;

        setConfirmOpen(false);
        setConversacionObjetivo(null); // 👈 importante

        await setConversationMode(phone, "human");
        setActivePhone(phone);

        const data = await getConversation(phone);
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
        const openTimer = setTimeout(() => setExpandedNewChat(true), 3500);

        // cerrar luego de 5s
        const closeTimer = setTimeout(() => setExpandedNewChat(false), 5000);

        return () => {
            clearTimeout(openTimer);
            clearTimeout(closeTimer);
        };
    }, []);

    {/* 🔹 Timer para desaparecer todo después de 3 segundos */ }
    useEffect(() => {
        if (showHint) {
            const timer = setTimeout(() => {
                setShowHint(false); // desaparece fondo e iconos
            }, 2700);
            return () => clearTimeout(timer);
        }
    }, [showHint]);


    useEffect(() => {
        const timer = setTimeout(() => setShowHintMessage(false), 5000); // desaparece a los 5s
        return () => clearTimeout(timer);
    }, []);


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

    //EN ESPERA CLICK
    const abrirPrimeraConversacionPendiente = () => {
        if (!conversations.length) return;

        // 🔴 En espera = needsHuman true y NO en modo humano
        const pendientes = conversations.filter(
            c => c.needsHuman === true && c.mode !== "human"
        );

        if (!pendientes.length) return;

        // 🕒 La más antigua (más tiempo esperando)
        const masUrgente = pendientes.sort((a, b) => {
            const da = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const db = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return da - db;
        })[0];

        setConversacionObjetivo({
            ...masUrgente,
            prioritaria: true,
        });

        setConfirmOpen(true);
    };


    //INDICADORES
    function NumeroIndicador({ value }) {
        const digits = value.toString().length;

        // escala progresiva según cantidad de dígitos
        const fontSize =
            digits <= 2 ? 36 :
                digits === 3 ? 30 :
                    digits === 4 ? 26 :
                        22;

        return (
            <Typography
                fontWeight={900}
                lineHeight={1}
                sx={{
                    fontSize,
                    minWidth: digits <= 2 ? 36 : 44,
                    textAlign: "right",
                    transition: "font-size .25s ease",
                    whiteSpace: "nowrap",
                }}
            >
                {value}
            </Typography>
        );
    }

    function IndicadorEnEspera({ value, onClick }) {
        return (
            <Box
                component={motion.div}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                animate={
                    value > 0
                        ? {
                            boxShadow: [
                                "0 0 0 0 rgba(220,38,38,.4)",
                                "0 0 0 10px rgba(220,38,38,0)",
                            ],
                        }
                        : {}
                }
                transition={{
                    duration: 1.2,
                    repeat: value > 0 ? Infinity : 0,
                }}
                onClick={onClick}
                sx={{
                    flex: 1,
                    height: 82,                 // 👈 ALTURA FIJA
                    px: 2,
                    borderRadius: 3,
                    background: "linear-gradient(135deg,#dc2626,#991b1b)",
                    color: "#fff",
                    cursor: value > 0 ? "pointer" : "default",
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* IZQUIERDA */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minHeight: 46, // 👈 reserva espacio
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.1,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <Typography fontSize={12} fontWeight={700} sx={{ opacity: 0.85 }}>
                            🚨
                        </Typography>

                        <Typography fontSize={12} fontWeight={700} sx={{ opacity: 0.85 }}>
                            EN ESPERA
                        </Typography>
                    </Box>

                    <Typography
                        fontSize={11}
                        sx={{
                            opacity: 0.9,
                            lineHeight: 1.1,
                            mt: 0.2,
                            height: 14,           // mantiene altura
                            whiteSpace: "nowrap", // fuerza a una sola línea
                            overflow: "hidden",   // recorta si algo se sale
                            textOverflow: "ellipsis", // opcional, pone "..." si no cabe
                        }}
                    >
                        Click para atender!
                    </Typography>
                </Box>

                {/* DERECHA */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        mt: 0.5,
                    }}
                >
                    <Box /> {/* espacio izquierdo */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            height: "100%",
                            minWidth: 56, // 👈 reserva espacio para 1k, 10k
                        }}
                    >
                        <NumeroIndicador value={value} />
                    </Box>

                </Box>

            </Box>
        );
    }
    function IndicadorAtendidos({ value }) {
        return (
            <Box
                sx={{
                    flex: 1,
                    height: 82,              // 👈 MISMA ALTURA
                    px: 2,
                    borderRadius: 3,
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(16,185,129,.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* IZQUIERDA */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minHeight: 46,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.1,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <Typography fontSize={12} fontWeight={700} sx={{ opacity: 0.85 }}>
                            🎉
                        </Typography>

                        <Typography fontSize={12} fontWeight={700} sx={{ opacity: 0.85 }}>
                            ATENDIDOS
                        </Typography>
                    </Box>


                    <Typography
                        fontSize={11}
                        sx={{
                            opacity: 0.9,
                            lineHeight: 1.1,
                            mt: 0.2,
                            height: 14,           // mantiene altura
                            whiteSpace: "nowrap", // fuerza a una sola línea
                            overflow: "hidden",   // recorta si algo se sale
                            textOverflow: "ellipsis", // opcional, pone "..." si no cabe
                        }}
                    >
                        ¡Buen trabajo!👏
                    </Typography>

                </Box>

                {/* DERECHA */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 0.5,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            height: "100%",
                            minWidth: 56, // 👈 reserva espacio para 1k, 10k
                        }}
                    >
                        <NumeroIndicador value={value} />
                    </Box>

                </Box>
            </Box>
        );
    }


    return (

        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                position: "relative",

                /* 🌤️ FONDO CLARO CON AZUL REAL + GRID AZUL ELEGANTE */
                backgroundImage: `
      radial-gradient(
        circle at center,
        rgba(59,130,246,.05)  0%,
        rgba(59,130,246,.05)  15%,
        rgba(59,130,246,.05) 25%,
        rgba(59,130,246,.05) 35%,
        transparent 50%
      ),
linear-gradient(rgba(29,78,216,.045) 1px, transparent 1px),
linear-gradient(90deg, rgba(29,78,216,.045) 1px, transparent 1px)
    `,
                backgroundSize: `
      100% 100%,
      56px 56px,
      56px 56px
    `,
                backgroundPosition: "center",
                backgroundAttachment: "fixed",

                backgroundColor: "#f8fafc",
                overflow: "hidden",
            }}
        >



            {/* INDICADORES */}
            {!ocultarHeaderChat && (
                <Box
                    sx={{
                        display: "flex",
                        gap: 0.7,
                        px: 1,
                        py: 1.5,
                        borderBottom: "1px solid #e5e7eb",
                    }}
                >
                    <IndicadorEnEspera
                        value={clientesEnEspera}
                        onClick={() => abrirPrimeraConversacionPendiente()}
                    />

                    <Box sx={{ position: "relative", flex: 1 }}>
                        <IndicadorAtendidos value={conversacionesAtendidas} />

                        <AnimatePresence>
                            {showClap && (
                                <Box
                                    component={motion.div}
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: -10, scale: 1 }}
                                    exit={{ opacity: 0, y: -30, scale: 1.1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    sx={{
                                        position: "absolute",
                                        top: 10,
                                        right: 12,
                                        zIndex: 10,
                                        pointerEvents: "none",
                                        fontSize: 28,
                                        filter: "drop-shadow(0 6px 10px rgba(0,0,0,.25))",
                                    }}
                                >
                                    👏👏👏
                                </Box>
                            )}
                        </AnimatePresence>
                    </Box>

                </Box>
            )}


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
                    elevation={0}
                    sx={{
                        width: isMobile ? "100%" : 320,
                        flexShrink: 0,
                        borderRadius: 0,
                        borderRight: "1px solid rgba(255,255,255,.08)",

                        /* 🔥 CLAVE */
                        backgroundColor: "transparent",
                        backdropFilter: "blur(6px)",

                        display: isMobile && activePhone ? "none" : "flex",
                        flexDirection: "column",
                    }}
                >

                    <Box
                        sx={{
                            height: 35,
                            px: 2,
                            py: 0,
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                        }}
                    >
                        {/* IZQUIERDA */}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                fontWeight={600}
                                noWrap
                                fontSize={isMobile ? 14 : 16}
                            >
                                Conversaciones
                            </Typography>

                            {!isMobile && (
                                <Typography fontSize={12} color="text.secondary" noWrap>
                                    {clientesEnEspera > 0
                                        ? `${clientesEnEspera} en espera · atención requerida`
                                        : `${conversations.length} activas · sin pendientes`}
                                </Typography>
                            )}
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

                                    /* 🎯 AZUL REAL */
                                    color: "#1e3a8a",          // blue-800
                                    borderColor: "#bfdbfe",    // blue-200
                                    background: "linear-gradient(135deg,#eff6ff,#f8fafc)",
                                    boxShadow: "0 2px 6px rgba(30,58,138,.10)",

                                    transition: "all .35s ease",

                                    "&:hover": {
                                        background: "linear-gradient(135deg,#dbeafe,#eff6ff)",
                                        borderColor: "#60a5fa",
                                        boxShadow: "0 0 0 3px rgba(59,130,246,.22)",
                                        transform: "translateY(-1px)",
                                    },

                                    "&:active": {
                                        transform: "translateY(0)",
                                        boxShadow: "0 2px 4px rgba(30,58,138,.15)",
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


                    <List sx={{ p: 1, overflowY: "auto", flex: 1, backdropFilter: "blur(4px)" }}>
                        {conversationsSorted.map((c) => {
                            const isHuman = c.mode === "human";
                            const selected = c.phone === activePhone;
                            const needsAttention = c.needsHuman && !isHuman;

                            const minutesAgo = c.lastMessageAt
                                ? Math.floor((Date.now() - new Date(c.lastMessageAt).getTime()) / 60000)
                                : null;

                            const open = menuPhone === c.phone && Boolean(menuAnchorEl);

                            // Color del borde izquierdo
                            let borderColor = "#3b82f6"; // azul bot
                            if (needsAttention) borderColor = "#dc2626"; // rojo atención
                            else if (isHuman) borderColor = "#10b981"; // verde humano

                            return (
                                <ListItemButton
                                    key={c.phone}
                                    onClick={() => selectConversation(c)}
                                    sx={{
                                        mb: 0.6,
                                        borderRadius: 2,
                                        border: "1px solid #e2e8f0",
                                        boxShadow: selected ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                                        backgroundColor: selected
                                            ? "#dbeafe"
                                            : needsAttention
                                                ? "#fee2e2"
                                                : "#f0fdf4",
                                        "&:hover": {
                                            backgroundColor: needsAttention ? "#fecaca" : "#e0f2fe",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                        },
                                        position: "relative",
                                        "&::before": {
                                            content: '""',
                                            position: "absolute",
                                            left: 0,
                                            top: 8,
                                            bottom: 8,
                                            width: 4,
                                            borderRadius: 2,
                                            backgroundColor: borderColor,
                                            opacity: selected || needsAttention ? 1 : 0.6,
                                        },
                                    }}
                                >
                                    {/* Avatar */}
                                    <Box sx={{ position: "relative", mr: 1.5 }}>
                                        <Box
                                            component="img"
                                            src={isHuman ? "/user.webp" : "/PWBot.png"}
                                            alt={isHuman ? "Atendido" : "Control Bot"}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                border: "1px solid #e2e8f0",
                                                boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                                                transition: "transform .2s, box-shadow .2s",
                                                "&:hover": {
                                                    transform: "scale(1.1)",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                                },
                                            }}
                                        />
                                    </Box>

                                    {/* Contenido */}
                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Typography fontWeight={500} noWrap>
                                                {c.phone}
                                            </Typography>

                                            {needsAttention && (
                                                <Box
                                                    sx={{
                                                        width: 10,
                                                        height: 10,
                                                        mb: 0,
                                                        borderRadius: "50%",
                                                        backgroundColor: "#dc2626",
                                                        boxShadow: "0 0 4px rgba(220,38,38,0.5)",
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <Box sx={{ mt: 0.4, display: "flex", gap: 0.6, flexWrap: "wrap" }}>
                                            <Box
                                                sx={{
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: 1,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: isHuman ? "#065f46" : "#1e40af",
                                                    backgroundColor: isHuman ? "#ecfdf5" : "#eff6ff",
                                                    border: isHuman ? "1px solid #10b981" : "1px solid #3b82f6",
                                                }}
                                            >
                                                {isHuman ? "ATENDIDO" : "CONTROL BOT"}
                                            </Box>

                                            {minutesAgo !== null && (
                                                <Typography fontSize={11} color="text.secondary" noWrap sx={{ opacity: 0.75 }}>
                                                    hace {formatTimeAgo(minutesAgo)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Botón de tres puntos */}
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuClick(e, c.phone)}
                                            sx={{ ml: 1 }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>

                                        <Menu
                                            anchorEl={menuAnchorEl}
                                            open={open}
                                            onClose={handleMenuClose}
                                            anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MenuItem onClick={() => handleVer(c.phone)}>Ver</MenuItem>
                                            <MenuItem onClick={() => handleEliminar(c.phone)}>Eliminar</MenuItem>
                                        </Menu>
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
                            width: "100%",            // 👈 ocupa todo el ancho
                            height: "calc(100vh - 45px)", // 👈 altura del Toolbar
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* HEADER MEJORADO */}
                        <Box
                            sx={{
                                width: "100%",
                                px: 2,
                                py: 1,
                                borderBottom: "1px solid #e5e7eb",
                                backgroundColor: "#ffffff",
                                position: "sticky",
                                top: 0,
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.05)", // sombra sutil
                            }}
                        >
                            {/* IZQUIERDA */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                {isMobile && (
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setChat(null);
                                            setActivePhone(null);
                                        }}
                                        sx={{
                                            transition: "all 0.2s ease",
                                            "&:hover": { bgcolor: "rgba(59,130,246,.1)" },
                                        }}
                                    >
                                        <ArrowBackIosNewIcon fontSize="small" />
                                    </IconButton>
                                )}

                                <Box>
                                    {/* Teléfono */}
                                    <Typography
                                        fontWeight={600}
                                        lineHeight={1.2}
                                        fontSize={15}
                                        sx={{ mb: 0.5 }}
                                    >
                                        {chat.phone}
                                    </Typography>

                                    {/* Modo Humano / IA */}
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.6,
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            transition: "all 0.3s ease",
                                            backgroundColor: isHumanMode ? "#ecfdf5" : "#eff6ff",
                                            color: isHumanMode ? "#065f46" : "#1e40af",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
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

                            {/* DERECHA: Botón "Devolver a IA" */}
                            {isHumanMode && (
                                <Button
                                    onClick={release}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        textTransform: "none",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        borderRadius: 2, // pill pequeño, discreto
                                        px: 2,
                                        py: 0.5,
                                        backgroundColor: "#f0f5ff", // azul muy suave
                                        color: "#1e40af",
                                        border: "1px solid rgba(29,78,216,0.3)",
                                        boxShadow: "none",
                                        transition: "all 0.2s ease",
                                        whiteSpace: "nowrap",
                                        "&:hover": {
                                            backgroundColor: "#e0e7ff", // leve cambio al hover
                                            borderColor: "rgba(29,78,216,0.5)",
                                        },
                                        "&:active": {
                                            backgroundColor: "#dbeafe",
                                        },
                                    }}
                                >
                                    <SmartToyIcon sx={{ fontSize: 16 }} />
                                    Devolver IA
                                </Button>

                            )}
                        </Box>

                        {/* MENSAJES */}
                        <Box
                            sx={{
                                width: "100%",          // 👈 ocupa todo el ancho
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
                                            justifyContent: isUser ? "flex-start" : "flex-end",
                                            mb: 1.5,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                maxWidth: isMobile ? "90%" : "70%",
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
                        </Box>

                        {/* INPUT */}
                        <Box
                            sx={{
                                width: "100%",
                                px: 1.5,
                                py: 1.2,
                                background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                                borderTop: "1px solid #e5e7eb",
                                position: "sticky",
                                bottom: 0,
                                zIndex: 2,
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
                                        borderRadius: 999,
                                        border: "1px solid rgba(160,220,255,.45)",
                                        backgroundColor: "rgba(240,250,255,.9)",
                                        display: "flex",
                                        alignItems: "center",
                                        px: 2,
                                        transition: "all .25s ease",
                                        "&:focus-within": {
                                            boxShadow: "0 0 12px rgba(160,220,255,.7)",
                                            backgroundColor: "#ffffff",
                                        },
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
                                            fontSize: 16, // 🔹 evita zoom en mobile
                                            lineHeight: 1.4,
                                            color: "#0f3c4c",
                                        }}
                                    />
                                </Box>

                                {/* SEND BUTTON */}
                                <IconButton
                                    disabled={sending || !message.trim()}
                                    onClick={send}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        bgcolor: message.trim()
                                            ? "rgba(160,220,255,.9)"
                                            : "rgba(200,220,235,.6)",
                                        color: message.trim() ? "#0f3c4c" : "#94a3b8",
                                        boxShadow: message.trim()
                                            ? "0 0 12px rgba(160,220,255,.9)"
                                            : "none",
                                        transition: "all .25s ease",
                                        "&:hover": {
                                            bgcolor: message.trim()
                                                ? "rgba(180,235,255,1)"
                                                : "rgba(200,220,235,.6)",
                                        },
                                    }}
                                >
                                    <SendIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                    </Box>
                )}




                {/* DIALOG TOMAR CONTROL */}
                <DialogTomarControl
                    confirmOpen={confirmOpen}
                    conversacion={conversacionObjetivo}
                    cancelTake={() => {
                        setConfirmOpen(false);
                        setConversacionObjetivo(null);
                    }}
                    confirmTake={() => confirmarToma(conversacionObjetivo)}
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
                    {showHint && !chat && (
                        <>
                            {/* 🔹 FONDO NEGRO BLOQUEANTE */}
                            <Box
                                component={motion.div}
                                onClick={() => {
                                    if (speed === 1) {
                                        // Primer click → acelera
                                        setSpeed(5);
                                    } else {
                                        // Segundo click → cerrar todo
                                        setShowHint(false);
                                    }
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.9 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 / speed }}
                                sx={{
                                    position: "fixed",
                                    inset: 0,
                                    backgroundColor: "#000000",
                                    zIndex: 4,
                                    cursor: "pointer", // 👈 UX clara
                                }}
                            />

                            {/* 🔹 ICONOS */}
                            <Box
                                component={motion.div}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                sx={{
                                    position: "absolute",
                                    top: "40%",
                                    left: 0,
                                    right: 0,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    zIndex: 5,
                                    pointerEvents: "none",
                                    height: 200,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                        gap: 0,
                                    }}
                                >
                                    {iconos.map((icon, i) => {
                                        const isActive = icon.alt === "WhatsApp";
                                        const whatsappShift = -40;
                                        let disappearShift = 0;

                                        if (phase === 2 && !isActive) {
                                            if (icon.alt === "Instagram" || icon.alt === "Facebook") disappearShift = 70;
                                            if (icon.alt === "TikTok") disappearShift = -70;
                                        }

                                        let filter = "brightness(1)";
                                        let opacity = 1;

                                        // 🔹 Mantener gris para los iconos no activos en fase 1 y fase 2
                                        if (!isActive && (phase === 1 || phase === 2)) {
                                            filter = icon.alt === "TikTok" ? "grayscale(100%) brightness(60%)" : "grayscale(100%)";
                                            opacity = 0.4;
                                        }


                                        let zIndex = phase === 2 ? (isActive ? 20 : 10 - i) : 10 - i;

                                        let xShift = 0;
                                        let yShift = 0;
                                        if (phase === 1 && !isActive) {
                                            xShift = -15 * i;
                                            yShift = -10 * i;
                                        }

                                        // 🔹 Fase 3: WhatsApp crece continuamente
                                        const scaleAnim = isActive && phase === 3
                                            ? [2.3, 1.5, 3.7] // ciclo de crecimiento
                                            : phase === 2 && isActive
                                                ? 3
                                                : 1;

                                        return (
                                            <motion.img
                                                key={icon.alt}
                                                src={icon.src}
                                                alt={icon.alt}
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    objectFit: "contain",
                                                    position: "relative",
                                                    zIndex,
                                                }}
                                                initial={{ x: 100, y: 0, opacity: 0 }}
                                                animate={{
                                                    x: phase === 2
                                                        ? isActive
                                                            ? whatsappShift
                                                            : disappearShift
                                                        : xShift,
                                                    y: phase === 2 ? 0 : yShift,
                                                    opacity: opacity,   // usa la variable calculada
                                                    filter: filter,     // usa la variable calculada
                                                    scale: scaleAnim,
                                                }}
                                                transition={{
                                                    x: {
                                                        type: "spring",
                                                        stiffness: 120 * speed,
                                                        damping: 20,
                                                        delay: phase < 2 ? (i * 0.15) / speed : 0,
                                                    },
                                                    y: {
                                                        type: "spring",
                                                        stiffness: 120 * speed,
                                                        damping: 20,
                                                        delay: phase < 2 ? (i * 0.15) / speed : 0,
                                                    },
                                                    opacity: {
                                                        type: "spring",
                                                        stiffness: 120 * speed,
                                                        damping: 20,
                                                        delay: phase < 2 ? (i * 0.15) / speed : 0,
                                                    },
                                                    scale: {
                                                        type: "spring",
                                                        stiffness: 120 * speed,
                                                        damping: 20,
                                                        repeat: isActive && phase === 3 ? Infinity : 0,
                                                    },
                                                    filter: { duration: 1 / speed, ease: "easeInOut" },
                                                }}

                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        </>
                    )}
                </AnimatePresence>
                {/* 🔹 Mensaje inferior independiente */}
                <AnimatePresence>
                    {showHintMessage && !chat && (
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
                                    border: "1px solid rgba(59,130,246,.35)",
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
                                        "0%": { clipPath: "inset(0 100% 0 0)" },
                                        "100%": { clipPath: "inset(0 0 0 0)" },
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
