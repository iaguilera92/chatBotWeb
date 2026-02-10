import { CssBaseline, Box, useMediaQuery } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/common/Header";
import Chat from "./pages/Chat";
import PanelHumano from "./pages/PanelHumano";
import PanelHumano2 from "./pages/PanelHumano2";
import { TenantProvider } from "./context/TenantContext";
import demoEmpresa from "./config/demoEmpresa";

function PanelHumanoResponsive() {
  const isMobile = useMediaQuery("(max-width:768px)");
  return isMobile ? <PanelHumano /> : <PanelHumano2 />;
}

function App() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  console.log("🔥 API_URL:", API_URL);
  return (
    <TenantProvider tenant={demoEmpresa}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            height: "100dvh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Header />

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <Routes>
              <Route path="/" element={<Chat />} />
              <Route
                path="/panel-humano"
                element={<PanelHumanoResponsive />}
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </TenantProvider>
  );
}

export default App;
