import {
  Box,
  Typography,
  List,
  ListItemButton,
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

export default function PanelHumanoConversaciones() {
  return (
    <List sx={{ p: 1, overflowY: "auto", flex: 1 }}>
      {conversationsMock.map((c) => {
        const isHuman = c.mode === "human";
        const needsAttention = c.needsHuman && !isHuman;

        const minutesAgo = Math.floor(
          (Date.now() - new Date(c.lastMessageAt).getTime()) / 60000
        );

        return (
          <ListItemButton
            key={c.phone}
            sx={{
              mb: 0.6,
              borderRadius: 2,
              alignItems: "flex-start",
              position: "relative",

              backgroundColor: needsAttention ? "#fef2f2" : "transparent",

              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: 2,
                backgroundColor: needsAttention
                  ? "#dc2626"
                  : isHuman
                    ? "#10b981"
                    : "#3b82f6",
              },
            }}
          >
            <Box sx={{ mr: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {c.phone.slice(-2)}
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={500}>
                {c.phone}
              </Typography>

              <Typography fontSize={11} color="text.secondary">
                {isHuman ? "CONTROL HUMANO" : "AUTOMATIZADO"} · hace {minutesAgo} min
              </Typography>
            </Box>
          </ListItemButton>
        );
      })}
    </List>
  );
}
