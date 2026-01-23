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

export default function ChatMessage({ from, text, image, video, status, timestamp }) {

    const isUser = from === "user";
    const safeText = text ?? "";
    const isLongText = safeText.length > 12;
    if (!safeText.trim() && !image) return null;



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
                    pb: image ? 2.8 : isLongText ? 2.6 : 1.2,
                    pr: 7.6,
                    borderRadius: 2,
                    backgroundColor: image && !safeText ? "transparent" : isUser ? "#d9fdd3" : "#fff",
                    boxShadow: image && !safeText ? "none" : "0 1px 1px rgba(0,0,0,0.1)",
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
                    {safeText}
                </Typography>

                {image && (
                    <Box
                        component="img"
                        src={image}
                        alt="Imagen"
                        sx={{
                            width: "100%",
                            maxWidth: 260,
                            borderRadius: 2,
                            mt: safeText ? 1 : 0.5
                        }}
                    />
                )}

                {video && (
                    <Box
                        component="video"
                        src={video}
                        controls
                        autoPlay
                        muted
                        loop
                        sx={{
                            width: "100%",
                            maxWidth: 260,
                            borderRadius: 2,
                            mt: text || image ? 1 : 0.5
                        }}
                    />
                )}

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
