import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

interface BlendHeaderProps {
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
  quiet?: boolean;
}

export const BlendHeader = ({ actions, backTo, backLabel = "Back", quiet = false }: BlendHeaderProps) => (
  <header className={`blend-header ${quiet ? "blend-header-quiet" : ""}`}>
    <div className="blend-header-inner">
      <div className="blend-header-start">
        {backTo ? (
          <Link to={backTo} className="text-link blend-back-link">
            <ArrowLeft aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        ) : null}
        <Link to="/" className="blend-brand" aria-label="Blend home">
          <Logo size={34} />
          <span>Blend</span>
        </Link>
      </div>
      {actions ? <div className="blend-header-actions">{actions}</div> : null}
    </div>
  </header>
);
