import { CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/common/Header";
import Chat from "./pages/Chat";
import PanelHumano from "./pages/PanelHumano2";
import { TenantProvider } from "./context/TenantContext";
import demoEmpresa from "./config/demoEmpresa";
import { Box } from "@mui/material";


function App() {
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
            overflow: "hidden", // 🚫 scroll global
          }}
        >
          {/* HEADER = ~10% */}
          <Header />

          {/* CONTENIDO = ~90% */}
          <Box
            sx={{
              flex: 1,       // ocupa TODO lo que queda
              minHeight: 0,  // clave para scroll interno
              display: "flex",
              overflow: "hidden",
            }}
          >
            <Routes>
              <Route path="/" element={<Chat />} />
              <Route path="/panel-humano" element={<PanelHumano />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </TenantProvider>
  );
}


export default App;
