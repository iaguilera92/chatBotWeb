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
import PanelHumanoConversaciones from "./PanelHumanoConversaciones";

export default function PanelHumano2() {
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

    let mounted = true;

    const load = async () => {
      const data = await getConversation(activePhone);
      if (mounted) {
        setChat(data);
      }
    };

    load();
    const interval = setInterval(load, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activePhone]);





  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  function selectConversation(phone) {
    setSelectedPhone(phone);
    setConfirmOpen(true);
  }

  async function confirmTake() {
    try {
      setConfirmOpen(false);

      await setConversationMode(selectedPhone, "human");

      setActivePhone(selectedPhone);

      const data = await getConversation(selectedPhone);
      setChat(data); // ✅ ENTERO
    } catch (err) {
      console.error("Error tomando control:", err);
    }
  }



  function cancelTake() {
    setSelectedPhone(null);
    setConfirmOpen(false);
  }

  async function release() {
    await setConversationMode(activePhone, "bot");
    setChat(null);
    setActivePhone(null);
    setSelectedPhone(null);
  }

  async function send() {
    if (!message.trim() || !activePhone) return;

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


  return (
    /* CONTENEDOR GENERAL (respeta Header) */
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        bgcolor: "#ffffff",
        p: 2,
        display: "flex",
        boxSizing: "border-box",
      }}
    >
      {/* BOX PRINCIPAL */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          border: "2px solid #334155",
          borderRadius: 4,
          p: 2,
          display: "flex",
          gap: 2,
          overflow: "hidden",
          boxSizing: "border-box",
          bgcolor: "rgba(15, 23, 42, 0.95)",
          boxShadow: "0 20px 40px rgba(15,23,42,0.35)",
        }}
      >
        {/* PANEL IZQUIERDO */}
        <Paper
          elevation={0}
          sx={{
            width: 260,
            minHeight: 0,
            borderRadius: 4,
            bgcolor: "transparent",
            color: "#e5e7eb",
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER PANEL */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                px: 2.5,
                py: 0.6,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.08)",
                color: "#f8fafc",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              PWBot IA
            </Box>
          </Box>

          {/* CONVERSACIONES */}
          <List
            sx={{
              flex: 1,
              p: 0,
              overflowY: "auto",
            }}
          >
            <PanelHumanoConversaciones onSelect={selectConversation} />

          </List>
        </Paper>



        {/* CHAT DERECHO */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            borderRadius: 4,
            bgcolor: "#f1f5f9",
            border: "1px solid #cbd5e1",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER CHAT */}
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: "#e2e8f0",
              borderBottom: "1px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography fontSize={13} fontWeight={600} color="#334155">
              Conversación activa
            </Typography>
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
            {chat?.messages?.map((m, i) => {
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
            <div ref={messagesEndRef} />
          </Box>


        </Paper>

      </Box>
      {/* DIALOG TOMAR CONTROL */}
      <DialogTomarControl
        confirmOpen={confirmOpen}
        cancelTake={cancelTake}
        confirmTake={confirmTake}
      />
    </Box>

  );
}
