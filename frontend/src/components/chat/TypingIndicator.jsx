import { Box, Typography } from "@mui/material";

export default function TypingIndicator() {
    return (
        <Box sx={{ display: "flex", mb: 1.2 }}>
            <Box
                sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 1px rgba(0,0,0,0.1)"
                }}
            >
                <Typography variant="body2">
                    PWBot está escribiendo<span className="dots">...</span>
                </Typography>
            </Box>
        </Box>
    );
}
