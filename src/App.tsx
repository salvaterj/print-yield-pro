import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import RawMaterials from "./pages/RawMaterials";
import FinishedProducts from "./pages/FinishedProducts";
import Quotes from "./pages/Quotes";
import QuoteView from "./pages/QuoteView";
import ServiceOrders from "./pages/ServiceOrders";
import ServiceOrderView from "./pages/ServiceOrderView";
import Kanban from "./pages/Kanban";
import Fiscal from "./pages/Fiscal";
import Sellers from "./pages/Sellers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/vendedores" element={<Sellers />} />
              <Route path="/bobinas" element={<RawMaterials />} />
              <Route path="/produtos" element={<FinishedProducts />} />
              <Route path="/orcamentos" element={<Quotes />} />
              <Route path="/orcamentos/:id" element={<QuoteView />} />
              <Route path="/os" element={<ServiceOrders />} />
              <Route path="/os/:id" element={<ServiceOrderView />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/fiscal" element={<Fiscal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
