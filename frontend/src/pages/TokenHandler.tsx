import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Landing from "./Landing";
import { saveTokens, isAuthenticated } from "@/lib/auth";

const TokenHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const hasAuthParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Boolean(params.get("access_token") && params.get("refresh_token"));
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      try {
        saveTokens({ access_token: accessToken, refresh_token: refreshToken });
      } catch (e) {
        console.error("Failed to save tokens", e);
      }
      // Navigate to dashboard with a clean URL
      navigate("/dashboard", { replace: true });
      return;
    }

    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [location.search, navigate]);

  if (hasAuthParams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="app-loading-card">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-5 text-xl font-extrabold">Opening your watchroom</h1>
          <p className="mt-2 text-sm text-muted-foreground">Finalizing sign-in.</p>
        </div>
      </div>
    );
  }

  return <Landing />;
};

export default TokenHandler;
