import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [open, setOpen] = useState(false);

  const isChat = location.pathname === "/";
  const isPanel = location.pathname === "/panel-humano";
  const isStart = location.pathname === "/iniciar-conversacion";

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

              <Button
                component={Link}
                to="/iniciar-conversacion"
                size="small"
                sx={{
                  color: "white",
                  fontWeight: isStart ? 600 : 400,
                  borderBottom: isStart
                    ? "2px solid #22c55e"
                    : "2px solid transparent",
                  borderRadius: 0,
                }}
              >
                Iniciar conversación
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
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: 260,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            py: 1,
          }}
        >
          {/* MENÚ */}
          <List>
            <ListItemButton
              component={Link}
              to="/"
              selected={isChat}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary="🤖 Chat BOT" />
            </ListItemButton>

            <ListItemButton
              component={Link}
              to="/panel-humano"
              selected={isPanel}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary="👤 Panel Humano" />
            </ListItemButton>

            <ListItemButton
              component={Link}
              to="/iniciar-conversacion"
              selected={isStart}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary="➕ Iniciar conversación" />
            </ListItemButton>
          </List>

          {/* ESTADO IA (DECORATIVO) */}
          <Box
            sx={{
              px: 2,
              pb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              opacity: 0.85,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
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
        </Box>
      </Drawer>

    </>
  );
}
