import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CircleIcon from "@mui/icons-material/Circle";
import PanelHumanoConversaciones from "./PanelHumanoConversaciones";

export default function PanelHumano2() {
  return (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        bgcolor: "#ffffff",
        display: "flex",
        p: 2,
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 260,
          borderRadius: 4,
          bgcolor: "#3fa9f5",
          color: "#ffffff",
          p: 2,
          mr: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              px: 2.5,
              py: 0.6,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.25)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            AI Chat Assistant
          </Box>
        </Box>

        {/* LISTA CONVERSACIONES */}
        <List
          sx={{
            flex: 1,
            p: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <PanelHumanoConversaciones />
        </List>
      </Paper>


      {/* CHAT DERECHA */}
      <Paper
        elevation={6}
        sx={{
          flex: 1,
          borderRadius: 4,
          bgcolor: "#aee3ff",
          p: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Título */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography
            sx={{
              display: "inline-block",
              px: 3,
              py: 0.5,
              bgcolor: "#4facfe",
              color: "#fff",
              borderRadius: 999,
              fontSize: 13,
            }}
          >
            Caja de diálogo
          </Typography>
        </Box>

        {/* Área mensajes */}
        <Box sx={{ flex: 1 }} />

        {/* Input */}
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <TextField
            fullWidth
            placeholder="Escribe tu mensaje..."
            size="small"
            sx={{
              bgcolor: "#fff",
              borderRadius: 999,
              "& fieldset": { borderRadius: 999 },
            }}
          />
          <IconButton
            sx={{
              ml: 1,
              width: 42,
              height: 42,
              bgcolor: "#fff",
              border: "3px solid #4facfe",
            }}
          >
            <SendIcon sx={{ color: "#4facfe" }} />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
