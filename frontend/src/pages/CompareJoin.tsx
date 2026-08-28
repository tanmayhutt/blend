import { useEffect, useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Clock3, Eye, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";
import { PairSignal } from "@/components/PairSignal";
import type { Profile } from "@/lib/types";

const API_BASE = import.meta.env.VITE_API_URL as string;

interface InvitePreview {
  comparison_id: string;
  status: string;
  expires_at?: string;
  host?: Profile;
}

const CompareJoin = () => {
  const { id } = useParams();
  const consentId = useId();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [checking, setChecking] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !API_BASE) {
      setError("This invitation is incomplete.");
      setChecking(false);
      return;
    }

    let active = true;
    axios.get<InvitePreview>(`${API_BASE}/compare/invite/${id}`)
      .then((response) => { if (active) setPreview(response.data); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.response?.status === 404 || requestError.response?.status === 410) {
          setError(requestError.response?.data?.detail || "This invitation is invalid or has expired.");
        } else {
          // Older deployments do not expose the preview endpoint. The OAuth-start endpoint still validates the invite.
          setPreview({ comparison_id: id, status: "pending" });
        }
      })
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [id]);

  const join = () => {
    if (!accepted) {
      setError("Please review and accept the privacy notice before joining.");
      document.getElementById(consentId)?.focus();
      return;
    }
    if (!id || !API_BASE) return;
    setError(null);
    setJoining(true);
    window.location.assign(`${API_BASE}/compare/join/${id}`);
  };

  if (checking) {
    return <div className="app-state-page"><Loader2 className="state-spinner" aria-hidden="true" /><p className="eyebrow">Checking invitation</p><h1>Opening a private Blend.</h1></div>;
  }

  if (!preview) {
    return (
      <div className="blend-app">
        <BlendHeader />
        <main className="join-error">
          <p className="eyebrow">Invitation unavailable</p>
          <h1>This room is no longer open.</h1>
          <p>{error || "Ask the person who invited you to create a new room."}</p>
          <Button asChild><Link to="/">Return to Blend</Link></Button>
        </main>
      </div>
    );
  }

  const hostName = preview.host?.name?.split(" ")[0] || "Someone";

  return (
    <div className="join-page">
      <BlendHeader quiet />
      <main className="join-layout">
        <section className="join-invite">
          <p className="eyebrow">A private invitation</p>
          <h1>{hostName} wants to compare feeds with you.</h1>
          <p>Connect your own account to make one shared reveal. Neither person gets access to the other person’s Google account.</p>
          <PairSignal left={preview.host} leftLabel={hostName} rightLabel="You" />
          <p className="invite-expiry"><Clock3 aria-hidden="true" /> This invitation expires after two hours.</p>
        </section>

        <section className="join-consent" aria-labelledby="before-you-join">
          <p className="eyebrow">Before you join</p>
          <h2 id="before-you-join">Know exactly what becomes shared.</h2>
          <ul>
            <li><Eye aria-hidden="true" /><span><strong>Blend reads</strong> your subscriptions, liked or saved videos, and playlists through YouTube API Services.</span></li>
            <li><LockKeyhole aria-hidden="true" /><span><strong>The room shows</strong> exact shared items, selected differences, recommendations, and a Blend-calculated score to both participants.</span></li>
            <li><ArrowRight aria-hidden="true" /><span><strong>Blend never changes</strong> your videos, likes, subscriptions, playlists, or public account.</span></li>
          </ul>
          <label htmlFor={consentId} className="consent-row consent-row-dark">
            <input
              id={consentId}
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                if (event.target.checked) setError(null);
              }}
            />
            <span>I agree to the <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms</Link>, including sharing the resulting comparison with the person who invited me.</span>
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <Button size="lg" onClick={join} disabled={joining} className="join-button">
            {joining ? <Loader2 className="animate-spin" /> : null}
            {joining ? "Opening Google" : "Agree and connect"}
            {!joining ? <ArrowRight aria-hidden="true" /> : null}
          </Button>
        </section>
      </main>
    </div>
  );
};

export default CompareJoin;
