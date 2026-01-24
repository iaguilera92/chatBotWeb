import { Box, Paper, Typography, TextField, Button, Stack, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { sendHumanMessage } from "../services/operator.api";

export default function IniciarConversacion() {
    const [phone, setPhone] = useState("56946873014");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({
        open: false,
        type: "success", // success | error
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

        } catch (err) {
            console.error(err);
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
        <Box
            sx={{
                width: "100vw",
                minHeight: "calc(100vh - 64px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f5f7fb",
                px: 2,
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    p: 3,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    ➕ Iniciar conversación
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={2}>
                    Enviar un mensaje manual por WhatsApp
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Teléfono del cliente"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        fullWidth
                    />


                    <TextField
                        label="Mensaje"
                        multiline
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        fullWidth
                    />

                    <Button
                        variant="contained"
                        disabled={sending}
                        onClick={handleSend}
                        sx={{
                            backgroundColor: "#075e54",
                            "&:hover": { backgroundColor: "#064c45" },
                        }}
                    >
                        {sending ? "Enviando..." : "Enviar por WhatsApp"}
                    </Button>
                </Stack>
            </Paper>
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
