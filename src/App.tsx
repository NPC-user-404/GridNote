import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
          <Route path="/" element={<Editor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
