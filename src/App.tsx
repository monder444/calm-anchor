import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppStateProvider, useAppState } from "@/lib/app-state";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import VibeScan from "./pages/VibeScan";
import ShieldPage from "./pages/Shield";
import Anchor from "./pages/Anchor";
import Nudge from "./pages/Nudge";
import SettingsPage from "./pages/Settings";
import Safety from "./pages/Safety";
import Meditations from "./pages/Meditations";
import TherapistSelect from "./pages/TherapistSelect";
import TherapistIntro from "./pages/TherapistIntro";
import TherapistChat from "./pages/TherapistChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl btn-premium animate-pulse" />
        <span className="text-muted-foreground text-sm animate-pulse">Loading…</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isOnboarded } = useAppState();
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl btn-premium animate-pulse" />
        <span className="text-muted-foreground text-sm animate-pulse">Loading…</span>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to={isOnboarded ? "/home" : "/"} replace /> : <Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={
        <ProtectedRoute>
          {isOnboarded ? <Navigate to="/home" replace /> : <Onboarding />}
        </ProtectedRoute>
      } />
      <Route path="/home" element={<ProtectedRoute>{isOnboarded ? <Home /> : <Navigate to="/" replace />}</ProtectedRoute>} />
      <Route path="/vibescan" element={<ProtectedRoute><VibeScan /></ProtectedRoute>} />
      <Route path="/shield" element={<ProtectedRoute><ShieldPage /></ProtectedRoute>} />
      <Route path="/anchor" element={<ProtectedRoute><Anchor /></ProtectedRoute>} />
      <Route path="/nudge" element={<ProtectedRoute><Nudge /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/safety" element={<ProtectedRoute><Safety /></ProtectedRoute>} />
      <Route path="/meditations" element={<ProtectedRoute><Meditations /></ProtectedRoute>} />
      <Route path="/therapist" element={<ProtectedRoute><TherapistSelect /></ProtectedRoute>} />
      <Route path="/therapist/:therapistId" element={<ProtectedRoute><TherapistIntro /></ProtectedRoute>} />
      <Route path="/therapist/:therapistId/chat" element={<ProtectedRoute><TherapistChat /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppStateProvider>
            <AppRoutes />
          </AppStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
