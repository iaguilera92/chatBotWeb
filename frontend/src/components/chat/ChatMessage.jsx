import { Box, Typography, Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";

function formatTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

export default function ChatMessage({
    from,
    text,
    image,
    video,
    status,
    timestamp,
    quickReplies = [],
    onQuickReply,
}) {

    const isUser = from === "user";
    const safeText = text ?? "";
    const { cleanText, links } = extractLinks(safeText);

    if (!cleanText && links.length === 0 && !image && !video) return null;

    const renderStatusIcon = () => {
        if (!isUser) return null;
        if (status === "sent") return <DoneIcon sx={{ fontSize: 14, color: "#8696a0" }} />;
        if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 14, color: "#8696a0" }} />;
        if (status === "seen") return <DoneAllIcon sx={{ fontSize: 14, color: "#53bdeb" }} />;
        return null;
    };

    function extractLinks(text) {
        if (!text) return { cleanText: "", links: [] };

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        const links = text.match(urlRegex) || [];
        const cleanText = text.replace(urlRegex, "").trim();

        return { cleanText, links };
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                mb: 1.2,

                animation: isUser
                    ? "slideFromRight .75s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "slideFromLeft .75s cubic-bezier(0.22, 1, 0.36, 1)",

                "@keyframes slideFromLeft": {
                    "0%": {
                        opacity: 0,
                        transform: "translateX(-28px)",
                    },
                    "100%": {
                        opacity: 1,
                        transform: "translateX(0)",
                    },
                },

                "@keyframes slideFromRight": {
                    "0%": {
                        opacity: 0,
                        transform: "translateX(28px)",
                    },
                    "100%": {
                        opacity: 1,
                        transform: "translateX(0)",
                    },
                },
            }}
        >
            <Box
                sx={{
                    maxWidth: "75%",
                    width: "fit-content",
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        minWidth: 120,
                        px: 1.5,
                        pt: 1,
                        pb: image || video
                            ? 2.8
                            : (cleanText || links.length > 0)
                                ? 2.6
                                : 1.2,
                        pr: isUser ? 7.6 : 6,
                        borderRadius: 2,
                        backgroundColor: image && !cleanText ? "transparent" : isUser ? "#E0FBFF" : "#fff",
                        boxShadow: image && !cleanText ? "none" : "0 1px 1px rgba(0,0,0,0.1)",
                        position: "relative",
                        minHeight: 32
                    }}
                >



                {cleanText && (
                    <Typography
                        variant="body2"
                        sx={{
                            lineHeight: 1.35,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word"
                        }}
                    >
                        {cleanText.split(/(\*[^*]+\*)/g).map((part, i) => {
                            if (part.startsWith("*") && part.endsWith("*")) {
                                // quitar los asteriscos y poner en negrita
                                const boldText = part.slice(1, -1);
                                return <strong key={i}>{boldText}</strong>;
                            }
                            return part;
                        })}
                    </Typography>
                )}


                {links.map((link, index) => {
                    const formattedLink = link.startsWith("http")
                        ? link
                        : `https://${link}`;

                    return (
                        <Typography
                            key={index}
                            variant="body2"
                            component="a"
                            href={formattedLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: "block",
                                mt: cleanText ? 1 : 0,
                                color: "#0b93f6",
                                textDecoration: "underline",
                                wordBreak: "break-word",
                                cursor: "pointer"
                            }}
                        >
                            {link}
                        </Typography>
                    );
                })}


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

                {!isUser && quickReplies.length > 0 && (
                    <Box
                        sx={{
                            mt: 0.8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.8,
                            width: "100%",
                            alignItems: "stretch",
                        }}
                    >
                        {quickReplies.map((qr, idx) => (
                            <Button
                                key={`${qr.value}-${idx}`}
                                variant="contained"
                                fullWidth
                                size="small"
                                onClick={() => {
                                    if (qr.action === "open" && qr.url) {
                                        window.open(qr.url, "_blank", "noopener,noreferrer");
                                        return;
                                    }
                                    onQuickReply?.(qr.value ?? qr.label);
                                }}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    color: "#fff",
                                    background:
                                        qr.tone === "gold"
                                            ? "linear-gradient(135deg, #ffe082, #ffb74d 45%, #f57c00 85%)"
                                            : "#1b6f8a",
                                    backgroundSize: qr.tone === "gold" ? "200% 200%" : "auto",
                                    animation: qr.tone === "gold" ? "goldShift 8s ease infinite" : "none",
                                    boxShadow:
                                        qr.tone === "gold"
                                            ? "0 6px 16px rgba(255,152,0,.4)"
                                            : "none",
                                    border: qr.tone === "gold" ? "2px solid rgba(255, 213, 79, 0.9)" : "none",
                                    position: qr.tone === "gold" ? "relative" : "static",
                                    overflow: qr.tone === "gold" ? "hidden" : "visible",
                                    "&:hover": {
                                        background:
                                            qr.tone === "gold"
                                                ? "linear-gradient(135deg,#ffca28,#fb8c00)"
                                                : "#155a70",
                                        boxShadow:
                                            qr.tone === "gold"
                                                ? "0 0 6px rgba(255,167,38,.6), inset 0 0 6px rgba(255,255,255,0.25)"
                                                : "none",
                                    },
                                    "&::before": qr.tone === "gold" ? {
                                        content: '""',
                                        position: "absolute",
                                        inset: "-2px",
                                        borderRadius: "inherit",
                                        background:
                                            "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.9) 12%, #fff59d 22%, rgba(255,255,255,0.9) 32%, transparent 44%)",
                                        backgroundRepeat: "no-repeat",
                                        backgroundSize: "300% 300%",
                                        animation:
                                            "goldSweep 3s linear infinite, goldPulse 4s ease-in-out infinite",
                                        pointerEvents: "none",
                                        zIndex: 2,
                                        mask:
                                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                        maskComposite: "exclude",
                                        WebkitMask:
                                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                        WebkitMaskComposite: "xor",
                                    } : undefined,
                                    "&::after": qr.tone === "gold" ? {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            "linear-gradient(130deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)",
                                        transform: "translateX(-100%)",
                                        animation: "goldSheen 4s ease-in-out infinite",
                                        borderRadius: "inherit",
                                        pointerEvents: "none",
                                        zIndex: 1,
                                    } : undefined,
                                    "@keyframes goldSweep": {
                                        "0%": { backgroundPosition: "-300% 0" },
                                        "100%": { backgroundPosition: "300% 0" },
                                    },
                                    "@keyframes goldPulse": {
                                        "0%, 100%": { filter: "drop-shadow(0 0 6px rgba(255,223,0,.35))" },
                                        "50%": { filter: "drop-shadow(0 0 14px rgba(255,223,0,.75))" },
                                    },
                                    "@keyframes goldSheen": {
                                        "0%": { transform: "translateX(-120%)" },
                                        "100%": { transform: "translateX(120%)" },
                                    },
                                    "@keyframes goldShift": {
                                        "0%": { backgroundPosition: "0% 50%" },
                                        "50%": { backgroundPosition: "100% 50%" },
                                        "100%": { backgroundPosition: "0% 50%" },
                                    },
                                }}
                            >
                                {qr.label}
                                {qr.action === "open" && (
                                    <OpenInNewIcon sx={{ ml: 0.8, fontSize: 16, opacity: 0.9 }} />
                                )}
                            </Button>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
