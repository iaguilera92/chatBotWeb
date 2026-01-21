import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { motion } from "framer-motion";


export default function Header({ conectando = true }) {
  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{ backgroundColor: "#111827", color: "white" }}
    >
      <Toolbar disableGutters sx={{ px: 2, width: "100vw" }}>
        {/* Izquierda */}
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            component="img"
            src="/PWBot.png"
            alt="PWBot"
            sx={{ width: 45, height: 45, objectFit: "contain" }}
          />
          <Typography variant="h6">
            Plataformas Web – Bot IA
          </Typography>
        </Box>

        {/* Derecha – Estado IA */}
        < Box
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
                  backgroundColor: "#22c55e", // verde = OK
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

      </Toolbar>
    </AppBar>
  );
}
