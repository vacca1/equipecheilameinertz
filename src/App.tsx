import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Agenda from "./pages/Agenda";
import Patients from "./pages/Patients";
import CashFlow from "./pages/CashFlow";
import Reports from "./pages/Reports";
import AIAgent from "./pages/AIAgent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (loading || showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Agenda />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/cash-flow" element={<CashFlow />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-agent" element={<AIAgent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
