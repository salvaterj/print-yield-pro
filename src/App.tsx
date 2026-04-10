import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { RequireAuth, RequireRole } from "@/components/auth/RouteGuards";
import RawMaterials from "./pages/RawMaterials";
import FinishedProducts from "./pages/FinishedProducts";
import Clients from "./pages/Clients";
import Carriers from "./pages/Carriers";
import Quotes from "./pages/Quotes";
import QuoteView from "./pages/QuoteView";
import ServiceOrders from "./pages/ServiceOrders";
import ServiceOrderView from "./pages/ServiceOrderView";
import Sellers from "./pages/Sellers";
import UserManagement from "./pages/UserManagement";
import SystemSettings from "./pages/SystemSettings";
import Login from "./pages/Login";
import Access from "./pages/Access";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function MainLayoutShell() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/acesso"
                element={
                  <RequireAuth>
                    <Access />
                  </RequireAuth>
                }
              />

              <Route
                element={
                  <RequireAuth>
                    <MainLayoutShell />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<Navigate to="/orcamentos" replace />} />


                <Route
                  path="/clientes"
                  element={
                    <RequireRole allow={["admin", "vendas"]}>
                      <Clients />
                    </RequireRole>
                  }
                />
                <Route
                  path="/transportadoras"
                  element={
                    <RequireRole allow={["admin", "vendas"]}>
                      <Carriers />
                    </RequireRole>
                  }
                />
                <Route
                  path="/vendedores"
                  element={
                    <RequireRole allow={["admin"]}>
                      <Sellers />
                    </RequireRole>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <RequireRole allow={["admin"]}>
                      <UserManagement />
                    </RequireRole>
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    <RequireRole allow={["admin"]}>
                      <SystemSettings />
                    </RequireRole>
                  }
                />
                <Route
                  path="/bobinas"
                  element={
                    <RequireRole allow={["admin", "vendas", "producao"]}>
                      <RawMaterials />
                    </RequireRole>
                  }
                />
                <Route
                  path="/produtos"
                  element={
                    <RequireRole allow={["admin", "vendas", "producao"]}>
                      <FinishedProducts />
                    </RequireRole>
                  }
                />
                <Route
                  path="/orcamentos"
                  element={
                    <RequireRole allow={["admin", "vendas"]}>
                      <Quotes />
                    </RequireRole>
                  }
                />
                <Route
                  path="/orcamentos/:id"
                  element={
                    <RequireRole allow={["admin", "vendas"]}>
                      <QuoteView />
                    </RequireRole>
                  }
                />
                <Route
                  path="/os"
                  element={
                    <RequireRole allow={["admin", "vendas", "producao"]}>
                      <ServiceOrders />
                    </RequireRole>
                  }
                />
                <Route
                  path="/os/:id"
                  element={
                    <RequireRole allow={["admin", "vendas", "producao"]}>
                      <ServiceOrderView />
                    </RequireRole>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
