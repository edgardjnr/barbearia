import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Agenda from "./pages/Agenda";
import Reports from "./pages/Reports";
import Avaliacoes from "./pages/Avaliacoes";
import Servicos from "./pages/Servicos";

import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Fidelidade from "./pages/Fidelidade";
import NotFound from "./pages/NotFound";
import Profile from "./pages/settings/Profile";
import Organization from "./pages/settings/Organization";
import Notifications from "./pages/settings/Notifications";
import Security from "./pages/settings/Security";
import Whatsapp from "./pages/settings/Whatsapp";
import Links from "./pages/settings/Links";
import PublicAgendamento from "./pages/PublicAgendamento";
import PublicAvaliacao from "./pages/PublicAvaliacao";
import ModernLayout from "./components/ModernLayout";
import OrganizationSetupLayout from "./components/OrganizationSetupLayout";
import TestFlow from "./pages/TestFlow";
import AcceptInvite from "./pages/AcceptInvite";
import Setup from "./pages/Setup";
import ClientBookingRequest from "./pages/ClientBookingRequest";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/cliente-reserva" element={<ClientBookingRequest />} />
                
                {/* Organization setup with special layout */}
                <Route path="/setup" element={
                  <OrganizationSetupLayout>
                    <Setup />
                  </OrganizationSetupLayout>
                } />
                
                {/* Public pages */}
                <Route path="/agendamento/:slug" element={<PublicAgendamento />} />
                <Route path="/avaliacao/:slug" element={<PublicAvaliacao />} />
                <Route path="/convite/:token" element={<AcceptInvite />} />
                
                {/* Main pages with modern layout */}
                <Route path="/dashboard" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                <Route path="/clientes" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="clients">
                      <Clients />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                <Route path="/agenda" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="agenda">
                      <Agenda />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                <Route path="/usuarios" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="users">
                      <Usuarios />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                <Route path="/fidelidade" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="loyalty">
                      <Fidelidade />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
            <Route path="/relatorios" element={
              <ModernLayout>
                <ProtectedRoute requiredModule="reports">
                  <Reports />
                </ProtectedRoute>
              </ModernLayout>
            } />
            <Route path="/avaliacoes" element={
              <ModernLayout>
                <ProtectedRoute requiredModule="reviews">
                  <Avaliacoes />
                </ProtectedRoute>
              </ModernLayout>
            } />
            <Route path="/servicos" element={
              <ModernLayout>
                <ProtectedRoute requiredModule="services">
                  <Servicos />
                </ProtectedRoute>
              </ModernLayout>
            } />
            <Route path="/configuracoes" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="settings">
                      <Configuracoes />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                
                {/* Settings routes with modern layout */}
                <Route path="/configuracoes/perfil" element={
                  <ModernLayout>
                    <Profile />
                  </ModernLayout>
                } />
                <Route path="/configuracoes/organizacao" element={
                  <ModernLayout>
                    <Organization />
                  </ModernLayout>
                } />
                <Route path="/configuracoes/notificacoes" element={
                  <ModernLayout>
                    <Notifications />
                  </ModernLayout>
                } />
                <Route path="/configuracoes/seguranca" element={
                  <ModernLayout>
                    <Security />
                  </ModernLayout>
                } />
                <Route path="/configuracoes/whatsapp" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="settings">
                      <Whatsapp />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                <Route path="/configuracoes/links" element={
                  <ModernLayout>
                    <ProtectedRoute requiredModule="settings">
                      <Links />
                    </ProtectedRoute>
                  </ModernLayout>
                } />
                
                {/* Test route */}
                <Route path="/test" element={<TestFlow />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
