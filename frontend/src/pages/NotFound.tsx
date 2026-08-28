import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";

const NotFound = () => {
  return (
    <div className="blend-app">
      <BlendHeader />
      <main className="app-state-page">
        <p className="eyebrow">Page 404</p>
        <h1>This path does not lead to a Blend.</h1>
        <p>The invitation may have expired, or the address may be incomplete.</p>
        <Button asChild><Link to="/">Return home</Link></Button>
      </main>
    </div>
  );
};

export default NotFound;
