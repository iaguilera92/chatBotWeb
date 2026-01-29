import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    Snackbar,
    Alert,
    Divider,
} from "@mui/material";
import { useState } from "react";
import { sendHumanMessage } from "../services/operator.api";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

const DEFAULT_PHONE = "56992914526";

export default function IniciarConversacion({ onClose }) {
    const [phone, setPhone] = useState(DEFAULT_PHONE);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const normalizePhone = (value) => value.replace(/\D/g, "");
    const isPhoneValid = phone.length >= 11;
    const canSend = isPhoneValid && message.trim().length > 0 && !sending;

    const handleSend = async () => {
        if (!canSend) return;
        setSending(true);

        try {
            await sendHumanMessage(phone, message.trim());
            setMessage("");
            setAlert({
                open: true,
                type: "success",
                message: "Mensaje enviado por WhatsApp",
            });
            setTimeout(() => onClose?.(), 600);
        } catch {
            setAlert({
                open: true,
                type: "error",
                message: "No se pudo enviar el mensaje",
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Box>
            {/* HEADER TIPO WHATSAPP */}
            {/* HEADER TIPO WHATSAPP */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        backgroundColor: "#25D366",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                    }}
                >
                    <WhatsAppIcon />
                </Box>

                <Box>
                    <Typography fontWeight={700} fontSize={15}>
                        Nuevo chat
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                        Mensaje manual por WhatsApp
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* TELÉFONO */}
            <TextField
                value={phone}
                onChange={(e) => setPhone(normalizePhone(e.target.value))}
                fullWidth
                size="small"
                placeholder="9 1234 5678"
                error={phone.length > 0 && !isPhoneValid}
                helperText={
                    !isPhoneValid && phone.length > 0
                        ? "Formato: +56 9 XXXX XXXX"
                        : " "
                }
                InputProps={{
                    startAdornment: (
                        <Box sx={{ mr: 1, color: "text.secondary", fontWeight: 500 }}>
                            +56
                        </Box>
                    ),
                }}
                sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                    },
                }}
            />


            <Box
                sx={{
                    position: "relative",
                    backgroundColor: "#f0f2f5",   // gris idle (WhatsApp Web)
                    borderRadius: 3,
                    px: 2,
                    py: 1.5,
                    mb: 2,

                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",

                    transition:
                        "background-color .18s ease, box-shadow .18s ease, border-color .18s ease",

                    /* ✍️ al escribir */
                    "&:focus-within": {
                        backgroundColor: "#ffffff",          // 👈 cambia a blanco
                        borderColor: "#25D366",
                        boxShadow: "0 0 0 2px rgba(37,211,102,.22)",
                    },
                }}
            >
                <TextField
                    multiline
                    minRows={2}
                    maxRows={4}
                    placeholder="Escribe el primer mensaje…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    fullWidth
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            fontSize: 14,
                            lineHeight: 1.4,
                        },
                    }}
                />
            </Box>




            {/* ACCIONES */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>

                <Button
                    onClick={handleSend}
                    disabled={!canSend}
                    startIcon={<WhatsAppIcon />}
                    sx={{
                        borderRadius: 999,
                        px: 3,
                        fontWeight: 700,
                        color: "#fff",
                        backgroundColor: "#25D366",
                        boxShadow: "0 6px 16px rgba(37,211,102,.35)",
                        textTransform: "none",

                        /* 🔁 transición base */
                        transition:
                            "transform .18s ease, box-shadow .18s ease, background-color .18s ease",

                        /* estado normal */
                        transform: sending ? "scale(1.06)" : "scale(1)",

                        /* boost al enviar */
                        boxShadow: sending
                            ? "0 10px 28px rgba(37,211,102,.55)"
                            : "0 6px 16px rgba(37,211,102,.35)",

                        "&:hover": {
                            backgroundColor: "#1ebe5d",
                            transform: sending ? "scale(1.06)" : "scale(1.04)",
                        },

                        "&.Mui-disabled": {
                            backgroundColor: "#e5e7eb",
                            color: "#9ca3af",
                            boxShadow: "none",
                            transform: "scale(1)",
                        },
                    }}
                >
                    {sending ? "Enviando…" : "Enviar"}
                </Button>

            </Stack>

            {/* FEEDBACK */}
            <Snackbar
                open={alert.open}
                autoHideDuration={3000}
                onClose={() => setAlert({ ...alert, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={alert.type}
                    onClose={() => setAlert({ ...alert, open: false })}
                    sx={{ width: "100%" }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
