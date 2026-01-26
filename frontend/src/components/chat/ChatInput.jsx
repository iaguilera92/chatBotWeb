import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";

export default function ChatInput({ onSend }) {
    const [value, setValue] = useState("");

    const handleSend = () => {
        if (!value.trim()) return;
        onSend(value);
        setValue("");
    };

    return (
        <Box
            sx={{
                flexShrink: 0,     // 👈 NUNCA se encoge
                height: 64,        // 👈 ALTURA FIJA (recomendado)
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#fff",
            }}
        >
            <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Escribe un mensaje…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                size="small"
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 999,
                        backgroundColor: "#f3f4f6",
                        paddingRight: 1,
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                    },
                }}
            />

            <IconButton
                onClick={handleSend}
                disabled={!value.trim()}
                sx={{
                    width: 40,
                    height: 40,
                    bgcolor: value.trim() ? "#22c55e" : "#e5e7eb",
                    color: value.trim() ? "white" : "#9ca3af",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        bgcolor: value.trim() ? "#16a34a" : "#e5e7eb",
                    },
                }}
            >
                <SendIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}
