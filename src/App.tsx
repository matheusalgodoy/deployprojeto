import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Scheduling from "./pages/Scheduling";
import BarberDashboard from "./pages/BarberDashboard";
import { ClientDashboard } from "./pages/ClientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/agendar"
              element={
                <ClientProtectedRoute>
                  <Scheduling />
                </ClientProtectedRoute>
              }
            />
            <Route
              path="/meus-agendamentos"
              element={
                <ClientProtectedRoute>
                  <ClientDashboard />
                </ClientProtectedRoute>
              }
            />
            <Route
              path="/barbeiro"
              element={
                <ProtectedRoute>
                  <BarberDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
