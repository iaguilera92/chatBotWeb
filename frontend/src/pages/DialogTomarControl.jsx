import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import { motion } from "framer-motion";
import { useState } from "react";

const DialogTomarControl = ({ confirmOpen, cancelTake, confirmTake }) => {
    const [takingControl, setTakingControl] = useState(false);

    return (
        <Dialog
            open={confirmOpen}
            onClose={cancelTake}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    background: "#111827",
                    borderRadius: 3,
                    color: "#e5e7eb",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#f9fafb",
                }}
            >
                <TuneIcon fontSize="small" />
                Control de conversación
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                <Typography fontSize={14} sx={{ color: "#d1d5db" }}>
                    La automatización se pausará y pasarás a control manual.
                </Typography>

                <Box
                    sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #1f2937, #111827)",
                        border: "1px solid #374151",
                    }}
                >
                    {/* 🔄 BOT → HUMANO */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr",
                            alignItems: "center",
                            px: 1,
                            py: 1.5,
                        }}
                    >
                        {/* BOT */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifySelf: "end",
                                pr: 1.5,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #1f2937, #111827)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 0 12px rgba(37,99,235,0.35)",
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/PWBot.png"
                                    alt="Bot"
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        objectFit: "contain",
                                        filter: "drop-shadow(0 0 4px rgba(147,197,253,0.6))",
                                    }}
                                />
                            </Box>

                            <Typography
                                sx={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "#d1d5db",
                                    mt: 0.45,
                                }}
                            >
                                PWBot
                            </Typography>
                        </Box>

                        {/* FLUJO */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.6,
                            }}
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.span
                                    key={i}
                                    style={{
                                        width: 9,
                                        height: 9,
                                        borderRadius: "50%",
                                        background:
                                            "radial-gradient(circle, #93c5fd 0%, #2563eb 100%)",
                                        boxShadow: "0 0 10px rgba(59,130,246,0.8)",
                                    }}
                                    animate={{
                                        scale: [0.85, 1.35, 0.85],
                                        opacity: [0.35, 1, 0.35],
                                        x: [0, 2, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        repeatDelay: 0.2,
                                        duration: 1.2,
                                        delay: i * 0.22,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </Box>

                        {/* HUMANO */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifySelf: "start",
                                pl: 1.5,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #065f46, #064e3b)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 0 12px rgba(34,197,94,0.35)",
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/ejecutivo.png"
                                    alt="Humano"
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        objectFit: "contain",
                                        filter: "drop-shadow(0 0 4px rgba(147,197,253,0.6))",
                                    }}
                                />
                            </Box>

                            <Typography
                                sx={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "#d1d5db",
                                    mt: 0.45,
                                }}
                            >
                                Humano
                            </Typography>
                        </Box>
                    </Box>

                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: 13,
                            color: "#e5e7eb",
                            textAlign: "center",
                            fontWeight: 600,
                            opacity: 0.95,
                        }}
                    >
                        Tomarás el control y se pausará el bot.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={cancelTake}
                    sx={{
                        color: "#9ca3af",
                        "&:hover": { color: "#e5e7eb" },
                    }}
                >
                    Cancelar
                </Button>

                <Button
                    variant="contained"
                    onClick={async () => {
                        setTakingControl(true);
                        await confirmTake();
                        setTakingControl(false);
                    }}
                    disabled={takingControl}
                    sx={{
                        px: 3,
                        position: "relative",
                        overflow: "hidden",
                        textTransform: "none",
                        fontWeight: 600,
                        color: "#ffffff",
                        background:
                            "linear-gradient(135deg, #34d399, #10b981 45%, #059669 85%)",
                        backgroundSize: "200% 200%",
                        animation: "gradientShift 8s ease infinite",
                        boxShadow: "0 4px 12px rgba(16,185,129,.35)",

                        "&:hover": {
                            background:
                                "linear-gradient(135deg,#2dd4bf,#10b981,#059669)",
                            boxShadow:
                                "0 0 6px rgba(16,185,129,.6), inset 0 0 6px rgba(255,255,255,0.25)",
                        },

                        "&::before": {
                            content: '""',
                            position: "absolute",
                            inset: "-1px",
                            borderRadius: "inherit",
                            background:
                                "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.9) 12%, #6ee7b7 22%, rgba(255,255,255,0.9) 32%, transparent 44%)",
                            backgroundSize: "300% 300%",
                            animation: "shineBorderSweep 3.2s linear infinite",
                            pointerEvents: "none",
                            zIndex: 2,
                            mask:
                                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            maskComposite: "exclude",
                        },

                        "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(130deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)",
                            transform: "translateX(-120%)",
                            animation: "shineDiagonal 4s ease-in-out infinite",
                            borderRadius: "inherit",
                            pointerEvents: "none",
                        },

                        "@keyframes shineBorderSweep": {
                            "0%": { backgroundPosition: "-300% 0" },
                            "100%": { backgroundPosition: "300% 0" },
                        },
                        "@keyframes shineDiagonal": {
                            "0%": { transform: "translateX(-120%)" },
                            "100%": { transform: "translateX(120%)" },
                        },
                        "@keyframes gradientShift": {
                            "0%": { backgroundPosition: "0% 50%" },
                            "50%": { backgroundPosition: "100% 50%" },
                            "100%": { backgroundPosition: "0% 50%" },
                        },
                    }}
                >
                    {takingControl ? "Tomando control..." : "Tomar control"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DialogTomarControl;
