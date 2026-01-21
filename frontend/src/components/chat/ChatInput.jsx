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
                display: "flex",
                p: 1,
                borderTop: "1px solid #ddd",
                backgroundColor: "#fafafa"
            }}
        >
            <TextField
                fullWidth
                placeholder="Escribe un mensaje…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                size="small"
            />
            <IconButton color="primary" onClick={handleSend}>
                <SendIcon />
            </IconButton>
        </Box>
    );
}
