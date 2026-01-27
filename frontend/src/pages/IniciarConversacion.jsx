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
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                }}
            >
                <WhatsAppIcon sx={{ color: "#25D366", fontSize: 26 }} />
                <Box>
                    <Typography fontWeight={700} fontSize={16}>
                        Nuevo Chat
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                        Enviar mensaje manual
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
                placeholder="569XXXXXXXX"
                inputProps={{ inputMode: "numeric" }}
                error={phone.length > 0 && !isPhoneValid}
                helperText={
                    !isPhoneValid && phone.length > 0
                        ? "Formato esperado: 569XXXXXXXX"
                        : " "
                }
                sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 999,
                    },
                }}
            />

            {/* BURBUJA MENSAJE */}
            <Box
                sx={{
                    backgroundColor: "#dcf8c6", // burbuja WhatsApp
                    borderRadius: "12px 12px 0 12px",
                    px: 2,
                    py: 1.5,
                    mb: 2,
                    boxShadow: "0 2px 6px rgba(0,0,0,.08)",
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

                        "&:hover": {
                            backgroundColor: "#1ebe5d",
                        },

                        "&.Mui-disabled": {
                            backgroundColor: "#e5e7eb",
                            color: "#9ca3af",
                            boxShadow: "none",
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
