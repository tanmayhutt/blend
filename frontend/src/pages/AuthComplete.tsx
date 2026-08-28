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
    const code = searchParams.get("code");
    const next = searchParams.get("next");

    if (!code) {
      setError("Missing authorization code");
      setLoading(false);
      return;
    }

    if (!API_BASE) {
      setError("API URL not configured. Please check environment variables.");
      setLoading(false);
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/exchange`, { code });
        const { access_token, refresh_token } = response.data;
        if (!access_token || !refresh_token) throw new Error("The session response was incomplete");
        saveTokens({ access_token, refresh_token });

        const redirectPath = next || "/dashboard";
        navigate(redirectPath, { replace: true });
      } catch (err: unknown) {
        const failure = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(failure.response?.data?.detail || failure.message || "Authentication failed. Please try again.");
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
          <h1 className="mt-5 text-xl font-extrabold">Preparing your side of the Blend</h1>
          <p className="mt-2 text-sm text-muted-foreground">Completing secure sign-in.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthComplete;
