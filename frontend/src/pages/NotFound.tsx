import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center bg-background px-4">
      <div className="app-loading-card">
        <div className="mb-6 space-y-2">
          <p className="section-kicker">Wrong rabbit hole</p>
          <h1 className="text-7xl font-black tracking-[-0.07em] text-foreground">404</h1>
          <p className="text-lg font-bold text-foreground">This page is off signal</p>
        </div>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or may have been removed.
        </p>
        <Link to="/">
          <Button className="gap-2">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
