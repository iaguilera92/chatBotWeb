import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    Snackbar,
    Alert,
} from "@mui/material";
import { useState } from "react";
import { sendHumanMessage } from "../services/operator.api";

export default function IniciarConversacion({ onClose }) {
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const handleSend = async () => {
        if (!phone || !message) return;

        setSending(true);
        try {
            await sendHumanMessage(phone, message);
            setMessage("");
            setAlert({
                open: true,
                type: "success",
                message: "Mensaje enviado por WhatsApp",
            });

            // 👇 cerrar dialog luego de enviar
            setTimeout(() => onClose?.(), 600);
        } catch (err) {
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
        <>
            <Typography fontWeight={600} fontSize={18} mb={0.5}>
                Iniciar conversación
            </Typography>

            <Typography fontSize={13} color="text.secondary" mb={2}>
                Enviar un mensaje manual por WhatsApp
            </Typography>

            <Stack spacing={2}>
                <TextField
                    label="Teléfono del cliente"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                    inputProps={{ inputMode: "numeric" }}
                />

                <TextField
                    label="Mensaje"
                    multiline
                    minRows={3}
                    maxRows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    fullWidth
                />

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button onClick={onClose} color="inherit">
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        disabled={sending}
                        onClick={handleSend}
                        sx={{
                            backgroundColor: "#075e54",
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "#064c45" },
                        }}
                    >
                        {sending ? "Enviando…" : "Enviar"}
                    </Button>
                </Stack>
            </Stack>

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
        </>
    );
}
