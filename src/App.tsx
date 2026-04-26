import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Editor from "./pages/Editor";
import Entry from "./pages/Entry";
import NotFound from "./pages/NotFound.tsx";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isGuest, isLoading } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      navigate("/");
    }
  }, [isLoading, user, isGuest, navigate]);

  if (isLoading || (!user && !isGuest)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  React.useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="gridnote-theme">
      <TooltipProvider>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/app" element={
            <AuthGuard>
              <Editor />
            </AuthGuard>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
