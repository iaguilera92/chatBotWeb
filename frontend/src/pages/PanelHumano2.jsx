import { useEffect, useState, useRef } from "react";
import { Box, Paper, Typography, List, useMediaQuery, } from "@mui/material";
import { getConversations, getConversation, setConversationMode, } from "../services/conversations.api";
import { sendHumanMessage } from "../services/operator.api";
import IniciarConversacion from "./IniciarConversacion";
import DialogTomarControl from "./DialogTomarControl";
import PanelHumanoConversaciones from "./PanelHumanoConversaciones";
import { motion } from "framer-motion";



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
  const [highlightActive, setHighlightActive] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const iconos = [
    { src: "/instagram-logo.png", alt: "Instagram" },
    { src: "/facebook-logo.png", alt: "Facebook" },
    { src: "/whatsapp-logo.webp", alt: "WhatsApp" },
    { src: "/tiktok-logo.png", alt: "TikTok" },
  ];
  const [phase, setPhase] = useState(0); // 0 = anim inicial, 1 = atenuar, 2 = solo WhatsApp

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 1200); // atenuar inactivos
    const timer2 = setTimeout(() => setPhase(2), 1350); // desaparecer inactivos
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHighlightActive(true); // activar el gris después de 3s
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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

      // esperar un poco para que el backend registre el cambio
      await new Promise(res => setTimeout(res, 200));

      setActivePhone(selectedPhone);

      const data = await getConversation(selectedPhone);

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
            bgcolor: "#f1f5f9", // color original
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
              {chat ? "Conversación activa" : "Panel de control"}
            </Typography>
          </Box>

          {/* CONTENIDO CHAT */}
          {chat ? (
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
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                p: 2,
                bgcolor: "#f1f5f9", // mantengo color Paper
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  height: 200, // espacio vertical
                }}
              >
                {iconos.map((icon, i) => {
                  const isActive = icon.alt === "WhatsApp";

                  // Fase 3: desplazamiento de WhatsApp
                  const whatsappShift = -70;

                  // Fase 2: desplazamiento de los que desaparecen
                  let disappearShift = 0;
                  if (phase === 2 && !isActive) {
                    if (icon.alt === "Instagram" || icon.alt === "Facebook") disappearShift = 60; // mover a la derecha
                    if (icon.alt === "TikTok") disappearShift = -60; // mover a la izquierda
                  }

                  // Control de filtro por fase
                  let filter = "brightness(1)";
                  let opacity = 1;
                  if (phase === 1 && !isActive) {
                    // TikTok también se pone gris y con opacidad
                    filter =
                      icon.alt === "TikTok"
                        ? "grayscale(100%) brightness(60%)"
                        : "grayscale(100%)";
                    opacity = 0.4; // baja la opacidad para que se vea apagado
                  }

                  // zIndex según fase
                  let zIndex = 10 - i;
                  if (phase === 2) {
                    zIndex = isActive ? 20 : 10 - i;
                  }

                  return (
                    <motion.img
                      key={icon.alt}
                      src={icon.src}
                      alt={icon.alt}
                      style={{
                        width: 130,
                        height: 130,
                        objectFit: "contain",
                        marginLeft: phase < 2 ? (i === 0 ? 0 : -15) : 0, // overlap fase 1/2
                        position: "relative",
                        zIndex: zIndex,
                      }}
                      initial={{ x: 100, opacity: 0 }}
                      animate={{
                        x: phase === 2
                          ? isActive
                            ? whatsappShift
                            : disappearShift // fase 2: desplazamiento al desaparecer
                          : 0,
                        opacity: phase === 2 ? (isActive ? 1 : 0) : opacity,
                        filter: filter,
                        scale: phase === 2 && isActive ? 1.3 : 1,
                      }}
                      transition={{
                        x: {
                          type: "spring",
                          stiffness: 120,
                          damping: 20,
                          delay: phase < 2 ? i * 0.15 : 0,
                        },
                        opacity: {
                          type: "spring",
                          stiffness: 120,
                          damping: 20,
                          delay: phase < 2 ? i * 0.15 : 0,
                        },
                        scale: { type: "spring", stiffness: 120, damping: 20 },
                        filter: { duration: 1, ease: "easeInOut" }, // transición gris fase 1
                      }}
                    />
                  );
                })}
              </Box>




              {/* INSTRUCCIÓN */}
              <Typography
                color="#64748b"
                fontSize={14}
                textAlign="center"
                sx={{ maxWidth: 300 }}
              >
                Selecciona una conversación a la izquierda para ver los mensajes y poder
                responder desde este panel. Aquí también verás el historial y podrás
                tomar control de las conversaciones.
              </Typography>
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
