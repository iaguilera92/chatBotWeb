import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Box } from "@mui/material";
import StatusCard from "../components/StatusCard";

export default function Dashboard() {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        axios
            .get("http://localhost:3000/health")
            .then(() => setStatus("ok"))
            .catch(() => setStatus("error"));
    }, []);

    return (
        <Container sx={{ mt: 4 }}>
            <Box>
                <StatusCard status={status} />
            </Box>
        </Container>
    );
}
