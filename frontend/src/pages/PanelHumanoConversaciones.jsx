import {
  Box,
  Typography,
  List,
  ListItemButton,
  Chip,
} from "@mui/material";

const conversationsMock = [
  {
    phone: "+56912345678",
    mode: "bot",
    needsHuman: true,
    lastMessageAt: new Date(Date.now() - 5 * 60000),
  },
  {
    phone: "+56987654321",
    mode: "human",
    needsHuman: false,
    lastMessageAt: new Date(Date.now() - 18 * 60000),
  },
];

export default function PanelHumanoConversaciones({ onSelect }) {
  return (
    <List sx={{ p: 0, overflowY: "auto", flex: 1 }}>
      {conversationsMock.map((c) => {
        const isHuman = c.mode === "human";
        const needsAttention = c.needsHuman && !isHuman;

        const minutesAgo = Math.floor(
          (Date.now() - new Date(c.lastMessageAt).getTime()) / 60000
        );

        return (
          <ListItemButton
            key={c.phone}
            onClick={() => onSelect(c.phone)} // ✅ FIX
            sx={{
              mb: 0.8,
              px: 1.5,
              py: 1,
              borderRadius: 3,
              alignItems: "center",
              position: "relative",
              bgcolor: needsAttention
                ? "rgba(220,38,38,0.08)"
                : "rgba(255,255,255,0.08)",

              "&:hover": {
                bgcolor: needsAttention
                  ? "rgba(220,38,38,0.15)"
                  : "rgba(255,255,255,0.15)",
              },

              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 10,
                bottom: 10,
                width: 4,
                borderRadius: 4,
                backgroundColor: needsAttention
                  ? "#dc2626"
                  : isHuman
                    ? "#10b981"
                    : "#3b82f6",
              },
            }}
          >
            {/* AVATAR */}
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor: "#e0e7ff",
                color: "#1e3a8a",
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

            {/* INFO */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={600} fontSize={13} noWrap>
                {c.phone}
              </Typography>

              <Typography fontSize={11} color="rgba(255,255,255,0.7)">
                hace {minutesAgo} min
              </Typography>
            </Box>

            {/* ESTADO */}
            <Chip
              size="small"
              label={
                needsAttention
                  ? "ATENCIÓN"
                  : isHuman
                    ? "HUMANO"
                    : "BOT"
              }
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 600,
                bgcolor: needsAttention
                  ? "#dc2626"
                  : isHuman
                    ? "#10b981"
                    : "#3b82f6",
                color: "#fff",
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}
