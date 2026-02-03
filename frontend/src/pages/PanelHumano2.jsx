import { useEffect, useState, useRef } from "react";
import { Box, Paper, Typography, List, useMediaQuery, } from "@mui/material";
import { getConversations, getConversation, setConversationMode, } from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";
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
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = () => getConversations().then(setConversations);
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function send() {
    if (!message.trim() || !activePhone) return;

    try {
      setSending(true);
      await sendHumanMessage(activePhone, message);
      setMessage("");

      const data = await getConversation(activePhone);
      setChat(data);
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      alert("No se pudo enviar el mensaje. Revisa la conexión o el servidor.");
    } finally {
      setSending(false);
    }
  }


  //ESCUCHAR CHAT ACTIVO!
  useEffect(() => {
    if (!activePhone) return;

    let mounted = true;

    const load = async () => {
      const data = await getConversation(activePhone);
      if (mounted) {
        setChat({
          ...data,
          messages: data.messages.length
            ? data.messages
            : [
              { from: "user", text: "Hola, necesito ayuda" },
              { from: "bot", text: "Hola, soy PWBot" }
            ],
        });
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

      // ✅ Si no hay mensajes, agregamos uno temporal para probar
      setChat({
        ...data,
        messages: data.messages.length
          ? data.messages
          : [
            { from: "user", text: "Hola, necesito ayuda" },
            { from: "bot", text: "Hola, soy PWBot" }
          ],
      });
    } catch (err) {
      console.error("Error tomando control:", err);
    }
  }



  function cancelTake() {
    setSelectedPhone(null);
    setConfirmOpen(false);
  }

  useEffect(() => {
    if (!chat) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [chat]);

  return (
    /* CONTENEDOR GENERAL */
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
        {(!isMobile || !activePhone) && (
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
            <List sx={{ flex: 1, p: 0, overflowY: "auto" }}>
              <PanelHumanoConversaciones onSelect={selectConversation} />
            </List>
          </Paper>
        )}




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

          {/* INPUT PARA ENVIAR MENSAJES */}
          {activePhone && chat?.mode === "human" && (
            <Box
              sx={{
                px: isMobile ? 1.5 : 3,
                py: 1,
                borderTop: "1px solid #cbd5e1",
                display: "flex",
                gap: 1,
                alignItems: "center",
                background: "#f1f5f9",
              }}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Escribe un mensaje..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
              <button
                onClick={send}
                disabled={!message.trim()}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Enviar
              </button>
            </Box>
          )}

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
