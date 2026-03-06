import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppStateProvider, useAppState } from "@/lib/app-state";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import VibeScan from "./pages/VibeScan";
import ShieldPage from "./pages/Shield";
import Anchor from "./pages/Anchor";
import Nudge from "./pages/Nudge";
import SettingsPage from "./pages/Settings";
import Safety from "./pages/Safety";
import Meditations from "./pages/Meditations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isOnboarded } = useAppState();

  return (
    <Routes>
      <Route path="/" element={isOnboarded ? <Navigate to="/home" replace /> : <Onboarding />} />
      <Route path="/home" element={isOnboarded ? <Home /> : <Navigate to="/" replace />} />
      <Route path="/vibescan" element={<VibeScan />} />
      <Route path="/shield" element={<ShieldPage />} />
      <Route path="/anchor" element={<Anchor />} />
      <Route path="/nudge" element={<Nudge />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/meditations" element={<Meditations />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppStateProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
