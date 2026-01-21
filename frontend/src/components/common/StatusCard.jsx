import { Card, CardContent, Typography } from "@mui/material";

export default function StatusCard({ status }) {
    return (
        <Card sx={{ minWidth: 275 }}>
            <CardContent>
                <Typography variant="h6">Estado del Backend</Typography>
                <Typography color={status === "ok" ? "green" : "red"}>
                    {status === "ok" ? "🟢 Operativo" : "🔴 Sin conexión"}
                </Typography>
            </CardContent>
        </Card>
    );
}
