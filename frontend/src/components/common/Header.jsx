import { useState } from "react";
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Drawer, List, ListItemButton, ListItemText, useMediaQuery, ListItemIcon } from "@mui/material";
import ChatIcon from "@mui/icons-material/SmartToy";
import HumanIcon from "@mui/icons-material/HeadsetMic";
import AddIcon from "@mui/icons-material/Add";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";

export default function Header() {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [open, setOpen] = useState(false);

  const isChat = location.pathname === "/";
  const isPanel = location.pathname === "/panel-humano";

  return (
    <>
      <AppBar
        position="static"
        elevation={1}
        sx={{ backgroundColor: "#111827", color: "white" }}
      >
        <Toolbar disableGutters sx={{ px: 2, width: "100vw" }}>
          {/* IZQUIERDA */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              component="img"
              src="/PWBot.png"
              alt="PWBot"
              sx={{ width: 42, height: 42, objectFit: "contain" }}
            />
            <Typography variant="h6" sx={{ fontSize: "1rem" }}>
              Plataformas Web – Bot IA
            </Typography>
          </Box>

          {/* MENÚ DESKTOP */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1, mr: 3 }}>
              <Button
                component={Link}
                to="/"
                size="small"
                sx={{
                  color: "white",
                  fontWeight: isChat ? 600 : 400,
                  borderBottom: isChat
                    ? "2px solid #22c55e"
                    : "2px solid transparent",
                  borderRadius: 0,
                }}
              >
                Chat BOT
              </Button>

              <Button
                component={Link}
                to="/panel-humano"
                size="small"
                sx={{
                  color: "white",
                  fontWeight: isPanel ? 600 : 400,
                  borderBottom: isPanel
                    ? "2px solid #22c55e"
                    : "2px solid transparent",
                  borderRadius: 0,
                }}
              >
                Panel Humano
              </Button>
            </Box>
          )}

          {/* BOTÓN MOBILE */}
          {isMobile && (
            <IconButton color="inherit" onClick={() => setOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}

          {/* ESTADO IA */}
          {!isMobile && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mr: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  opacity: 0.85,
                  letterSpacing: 0.4,
                }}
              >
                IA Activa
              </Typography>

              <Box sx={{ display: "flex", gap: 0.6 }}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                    }}
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.4, 0.8],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.4,
                      delay: i * 0.25,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* DRAWER MOBILE */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            pb: "env(safe-area-inset-bottom)",
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#111827",
              color: "white",
            }}
          >
            <Typography fontSize="0.9rem" fontWeight={600}>
              Menú
            </Typography>

            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: "white" }}
              component={motion.button}
              initial={{ rotate: 0 }}
              animate={{ rotate: 720 }} // 👈 2 vueltas
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
            >
              <CloseIcon />
            </IconButton>

          </Box>

          {/* MENÚ */}
          <List sx={{ flex: 1, pt: 1 }}>
            <ListItemButton
              component={Link}
              to="/"
              selected={isChat}
              onClick={() => setOpen(false)}
            >
              <ListItemIcon>
                <ChatIcon color={isChat ? "success" : "action"} />
              </ListItemIcon>
              <ListItemText primary="Chat BOT" />
            </ListItemButton>

            <ListItemButton
              component={Link}
              to="/panel-humano"
              selected={isPanel}
              onClick={() => setOpen(false)}
            >
              <ListItemIcon>
                <HumanIcon color={isPanel ? "success" : "action"} />
              </ListItemIcon>
              <ListItemText primary="Panel Humano" />
            </ListItemButton>
          </List>

          <Divider />

          {/* ESTADO IA */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              opacity: 0.85,
            }}
          >
            <Typography fontSize="0.75rem">IA Activa</Typography>

            <Box sx={{ display: "flex", gap: 0.6 }}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                  }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.4, 0.8],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    delay: i * 0.25,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Drawer>

    </>
  );
}
