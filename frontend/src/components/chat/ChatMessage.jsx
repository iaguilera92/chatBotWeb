import { Box, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";

function formatTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

export default function ChatMessage({ from, text, status, timestamp }) {
    const isUser = from === "user";
    const isLongText = text.length > 12;

    const renderStatusIcon = () => {
        if (!isUser) return null;
        if (status === "sent") return <DoneIcon sx={{ fontSize: 14, color: "#8696a0" }} />;
        if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 14, color: "#8696a0" }} />;
        if (status === "seen") return <DoneAllIcon sx={{ fontSize: 14, color: "#53bdeb" }} />;
        return null;
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                mb: 1.2
            }}
        >
            <Box
                sx={{
                    maxWidth: "75%",
                    minWidth: 120,
                    px: 1.5,
                    pt: 1,
                    pb: isLongText ? 2.6 : 1.2,   // ⭐ CLAVE
                    pr: 7.6,
                    borderRadius: 2,
                    backgroundColor: isUser ? "#d9fdd3" : "#ffffff",
                    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                    position: "relative",
                    minHeight: 32
                }}
            >



                {/* Texto */}
                <Typography
                    variant="body2"
                    sx={{
                        lineHeight: 1.35,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                    }}
                >
                    {text}
                </Typography>


                {/* Hora + checks */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 4,
                        right: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.45
                    }}
                >

                    <Typography
                        variant="caption"
                        sx={{ color: "#667781", fontSize: "0.65rem", lineHeight: 1 }}
                    >
                        {formatTime(timestamp)}
                    </Typography>
                    {renderStatusIcon()}
                </Box>
            </Box>

        </Box>
    );
}
