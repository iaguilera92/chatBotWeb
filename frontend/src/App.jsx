import { CssBaseline } from "@mui/material";
import Header from "./components/common/Header";
import Chat from "./pages/Chat";
import { TenantProvider } from "./context/TenantContext";
import demoEmpresa from "./config/demoEmpresa";

function App() {
  return (
    <TenantProvider tenant={demoEmpresa}>
      <CssBaseline />
      <Header />
      <Chat />
    </TenantProvider>
  );
}

export default App;
