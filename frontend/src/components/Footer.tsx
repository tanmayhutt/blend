import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer-main">
      <div className="site-footer-brand"><Logo size={32} /><div><strong>Blend</strong><span>A private YouTube taste story for two.</span></div></div>
      <nav aria-label="Footer navigation">
        <Link to="/">Home</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:tiwaritanmay1021@gmail.com">Contact</a>
      </nav>
    </div>
    <div className="site-footer-note">
      <span>Independent from Google and YouTube. YouTube is a trademark of Google LLC.</span>
      <a href="https://tanmaytiwari.me" target="_blank" rel="noreferrer">Made by Tanmay Tiwari <ArrowUpRight aria-hidden="true" /></a>
    </div>
  </footer>
);
