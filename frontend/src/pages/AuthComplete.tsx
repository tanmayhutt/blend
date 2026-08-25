import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { saveTokens } from "@/lib/auth";
import axios from "axios";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL as string;

const AuthComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthComplete mounted, URL:", window.location.href);
    console.log("API_BASE:", API_BASE);

    const code = searchParams.get("code");
    const next = searchParams.get("next");

    console.log("Code from URL:", code ? "Present" : "Missing");
    console.log("Next param:", next);

    if (!code) {
      console.error("Missing authorization code");
      setError("Missing authorization code");
      setLoading(false);
      return;
    }

    if (!API_BASE) {
      console.error("VITE_API_URL is not set");
      setError("API URL not configured. Please check environment variables.");
      setLoading(false);
      return;
    }

    const exchangeCode = async () => {
      try {
        console.log("Exchanging code for token...");
        const response = await axios.post(`${API_BASE}/auth/exchange`, { code });
        console.log("Token exchange successful");
        const { access_token, user_id } = response.data;

        // Save tokens (using user_id as a pseudo refresh token for now)
        saveTokens({ access_token, refresh_token: user_id });
        console.log("Tokens saved to localStorage");

        // Redirect to next or dashboard
        const redirectPath = next || "/dashboard";
        console.log("Redirecting to:", redirectPath);
        navigate(redirectPath, { replace: true });
      } catch (err: any) {
        console.error("Token exchange failed:", err);
        console.error("Error details:", err.response?.data);
        setError(err.response?.data?.detail || err.message || "Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="app-loading-card">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-destructive/10"><AlertCircle className="h-6 w-6 text-destructive" /></div>
          <h1 className="mt-5 text-xl font-extrabold text-foreground">Sign-in could not finish</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/")} className="mt-5">Return home</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="app-loading-card">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-5 text-xl font-extrabold">Opening your watchroom</h1>
          <p className="mt-2 text-sm text-muted-foreground">Completing sign-in.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthComplete;
