import { CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/common/Header";
import Chat from "./pages/Chat";
import PanelHumano from "./pages/PanelHumano";
import { TenantProvider } from "./context/TenantContext";
import demoEmpresa from "./config/demoEmpresa";

function App() {
  return (
    <TenantProvider tenant={demoEmpresa}>
      <CssBaseline />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/panel-humano" element={<PanelHumano />} />
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
}

export default App;
