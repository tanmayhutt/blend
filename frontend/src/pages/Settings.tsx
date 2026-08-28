import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Loader2, LogOut, RefreshCw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";
import { clearTokens, authClient, isAuthenticated } from "@/lib/auth";
import type { Profile } from "@/lib/types";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState<"disconnect" | "delete" | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
      return;
    }
    authClient.get("/data/me")
      .then((response) => setProfile(response.data.profile || null))
      .catch(() => setProfile(null));
  }, [navigate]);

  const finish = () => {
    clearTokens();
    navigate("/", { replace: true });
  };

  const disconnect = async () => {
    setBusy("disconnect");
    setError(null);
    try {
      await authClient.post("/auth/disconnect");
      finish();
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not disconnect Google access.");
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    if (confirmation !== "DELETE") return;
    setBusy("delete");
    setError(null);
    try {
      await authClient.delete("/account");
      finish();
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not delete the account data.");
      setBusy(null);
    }
  };

  const signOut = () => finish();

  return (
    <div className="blend-app settings-page">
      <BlendHeader backTo="/dashboard" backLabel="Session maker" />
      <main className="settings-layout">
        <header className="settings-heading">
          <p className="eyebrow">Account and data</p>
          <h1>You stay in control.</h1>
          <p>Manage the local session, Google authorisation, and the data Blend stores for your account.</p>
        </header>

        <section className="settings-profile">
          <div className="settings-profile-id">
            {profile?.picture ? <img src={profile.picture} alt="" referrerPolicy="no-referrer" /> : <span>{profile?.name?.slice(0, 1) || "B"}</span>}
            <div><strong>{profile?.name || "Connected account"}</strong><small>{profile?.email || "Google account connected"}</small></div>
          </div>
          <span className="connection-status"><i /> Connected</span>
        </section>

        <section className="settings-list" aria-label="Account actions">
          <article>
            <div><LogOut aria-hidden="true" /><span><strong>Sign out on this device</strong><small>Removes the local Blend session without changing Google access or stored data.</small></span></div>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </article>
          <article>
            <div><Unplug aria-hidden="true" /><span><strong>Disconnect Google</strong><small>Revokes Blend’s Google token and ends every active Blend session. Stored comparison data remains until deletion or expiry.</small></span></div>
            <Button variant="outline" onClick={disconnect} disabled={busy !== null}>
              {busy === "disconnect" ? <Loader2 className="animate-spin" /> : null} Disconnect
            </Button>
          </article>
          <article>
            <div><RefreshCw aria-hidden="true" /><span><strong>Refresh your snapshot</strong><small>Return to the session maker to request a current read-only snapshot from YouTube.</small></span></div>
            <Button variant="outline" asChild><Link to="/dashboard">Open session maker</Link></Button>
          </article>
        </section>

        <section className="danger-zone">
          <div><AlertTriangle aria-hidden="true" /><span><strong>Delete your Blend account data</strong><small>Revokes Google access and permanently removes your profile snapshot, sessions, and comparisons from Blend.</small></span></div>
          {!showDelete ? (
            <Button variant="destructive" onClick={() => setShowDelete(true)}>Delete account data</Button>
          ) : (
            <div className="delete-confirmation">
              <label htmlFor="delete-confirmation">Type <strong>DELETE</strong> to confirm</label>
              <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
              <div><Button variant="ghost" onClick={() => { setShowDelete(false); setConfirmation(""); }}>Cancel</Button><Button variant="destructive" onClick={deleteAccount} disabled={confirmation !== "DELETE" || busy !== null}>{busy === "delete" ? <Loader2 className="animate-spin" /> : null}Delete permanently</Button></div>
            </div>
          )}
        </section>

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <p className="settings-policy-link">Review the complete <Link to="/privacy">Privacy Policy <ArrowRight aria-hidden="true" /></Link>.</p>
      </main>
    </div>
  );
};

export default Settings;
