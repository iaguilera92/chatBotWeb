import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    Snackbar,
    Alert,
} from "@mui/material";
import { useState } from "react";
import { sendHumanMessage } from "../services/operator.api";

export default function IniciarConversacion() {
    const [phone, setPhone] = useState("56946873014");
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
        <Box
            sx={{
                width: "100%",
                minHeight: { xs: "calc(100dvh - 56px)", md: "calc(100vh - 64px)" },
                display: "flex",
                justifyContent: "center",
                alignItems: { xs: "stretch", md: "center" },
                backgroundColor: "#f5f7fb",
                px: { xs: 0, md: 2 },
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    height: { xs: "100%", md: "auto" },
                    p: { xs: 2, md: 3 },
                    borderRadius: { xs: 0, md: 2 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={600}
                    mb={0.5}
                >
                    Iniciar conversación
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={2}
                >
                    Enviar un mensaje manual por WhatsApp
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Teléfono del cliente"
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

                    <Button
                        variant="contained"
                        size="large"
                        disabled={sending}
                        onClick={handleSend}
                        sx={{
                            mt: 1,
                            py: 1.2,
                            backgroundColor: "#075e54",
                            fontWeight: 600,
                            "&:hover": {
                                backgroundColor: "#064c45",
                            },
                        }}
                    >
                        {sending ? "Enviando…" : "Enviar por WhatsApp"}
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
