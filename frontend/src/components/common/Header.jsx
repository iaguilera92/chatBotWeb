import { AppBar, Toolbar, Typography, Box } from "@mui/material";

export default function Header() {
  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: "#111827", // gris grafito (no azul)
        color: "white"              // texto oscuro
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: 2,
          width: "100vw"
        }}
      >
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            component="img"
            src="/PWBot.png"
            alt="PWBot"
            sx={{
              width: 45,
              height: 45,
              objectFit: "contain"
            }}
          />
          <Typography variant="h6">
            Plataformas Web – Bot IA
          </Typography>
        </Box>

      </Toolbar>
    </AppBar>
  );
}
