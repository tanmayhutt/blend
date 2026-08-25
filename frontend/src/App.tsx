import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import TokenHandler from "./pages/TokenHandler";
import AuthComplete from "./pages/AuthComplete";
import Dashboard from "./pages/Dashboard";
import CompareJoin from "./pages/CompareJoin";
import CompareFinalise from "./pages/CompareFinalise";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const routeMeta: Record<string, { title: string; description: string; index: boolean }> = {
  "/": { title: "YouTube Blend — Compare your YouTube taste", description: "Compare your YouTube feed with a friend. See your compatibility score, shared channels, saved videos, music, and interests.", index: true },
  "/privacy": { title: "Privacy — YouTube Blend", description: "Learn how YouTube Blend accesses, uses, stores, and protects your Google and YouTube data.", index: true },
  "/terms": { title: "Terms — YouTube Blend", description: "Read the terms that apply when using YouTube Blend.", index: true },
  "/dashboard": { title: "Your watchroom — YouTube Blend", description: "Explore your YouTube profile and create a private comparison link.", index: false },
};

const MetaController = () => {
  const location = useLocation();

  useEffect(() => {
    const exact = routeMeta[location.pathname];
    const fallback = location.pathname.startsWith("/compare/")
      ? { title: "Private comparison — YouTube Blend", description: "A private YouTube taste comparison.", index: false }
      : location.pathname.startsWith("/auth/")
        ? { title: "Signing in — YouTube Blend", description: "Securely completing Google sign-in.", index: false }
        : { title: "Page not found — YouTube Blend", description: "The requested YouTube Blend page could not be found.", index: false };
    const meta = exact || fallback;
    document.title = meta.title;

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = meta.description;

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = meta.index ? "index, follow" : "noindex, nofollow";

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical && meta.index) canonical.href = `https://youtube-blend.tanmaytiwari.me${location.pathname}`;
  }, [location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MetaController />
        <Routes>
          <Route path="/" element={<TokenHandler />} />
          <Route path="/auth/complete" element={<AuthComplete />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare/join/:id" element={<CompareJoin />} />
          <Route path="/compare/finalise/:id" element={<CompareFinalise />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
