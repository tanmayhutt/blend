import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";

const ExternalTextLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
    {children}
    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
  </a>
);

const Privacy = () => {
  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="site-header">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Blend
            </Link>
            <div className="flex items-center gap-3">
              <Logo size={28} className="rounded-lg" />
              <span className="text-sm font-semibold">Privacy</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-16 lg:py-24">
        <article className="legal-shell prose max-w-none border-t border-border pt-10">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: August 28, 2026</p>

          <p>
            Blend is a private, two-person comparison experience powered by YouTube API Services. This policy explains which Google and YouTube data Blend accesses, why it is needed, where it is stored, who can see it, and how you can remove it.
          </p>

          <section>
            <h2>1. Data Blend accesses</h2>
            <p>When you choose to connect a Google account, Blend requests read-only access to:</p>
            <ul>
              <li><strong>Google account profile:</strong> your Google account ID, name, email address, and profile picture.</li>
              <li><strong>YouTube subscriptions:</strong> subscribed channel IDs, names, thumbnails, and available topic information.</li>
              <li><strong>Liked and saved videos:</strong> video IDs, titles, thumbnails, available category information, and the playlists from which an item was found.</li>
              <li><strong>YouTube playlists:</strong> playlist IDs, titles, thumbnails, and available playlist items.</li>
            </ul>
            <p>
              Blend does not request your Google password, access your YouTube watch history, or upload, edit, delete, like, subscribe to, or publish YouTube content on your behalf.
            </p>
          </section>

          <section>
            <h2>2. How the data is used</h2>
            <p>Blend uses the data only to provide features that you request:</p>
            <ul>
              <li>sign you in and show your connected account;</li>
              <li>build a private summary of your subscriptions, liked videos, saved videos, and playlists;</li>
              <li>compare two consenting participants and identify shared or different channels, videos, and broad interests;</li>
              <li>generate app-created compatibility results and recommendations; and</li>
              <li>operate, secure, and troubleshoot the service.</li>
            </ul>
            <p>
              Compatibility scores, labels, groupings, and recommendations are created by Blend. They are not YouTube metrics and are not supplied or endorsed by Google or YouTube.
            </p>
            <p>
              Blend's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2>3. Storage and retention</h2>
            <p>
              Blend stores your Google profile, OAuth credentials, and cached YouTube API data in its application database so that the service can display your data and create comparisons without requesting the same information on every screen. The browser also stores the Blend session credential in local storage on your device so you can remain signed in.
            </p>
            <p>
              A two-person comparison contains the data snapshot needed to produce that comparison and expires after two hours. Non-statistical data obtained from YouTube API Services is refreshed or deleted within 30 calendar days. Choosing <strong>Delete account data</strong> starts deletion immediately rather than waiting for that period.
            </p>
            <p>
              Blend may retain minimal security and operational records for a limited period when reasonably necessary to prevent abuse or diagnose a failure. These records are not used to rebuild your YouTube profile.
            </p>
          </section>

          <section>
            <h2>4. What is shared</h2>
            <p>
              Blend is designed for one comparison between two people. When you create or join a comparison, you agree that the other participant may see the channels, videos, categories, broad interests, and app-created results included in that shared comparison. Both people must connect their own accounts before the comparison is produced.
            </p>
            <p>
              Invitation links expire after two hours. Only send a link to the person you intend to compare with. Blend does not sell your personal information, use it for advertising, or make your connected account data publicly searchable.
            </p>
          </section>

          <section>
            <h2>5. Service providers</h2>
            <p>
              Blend uses Google OAuth and YouTube API Services to authenticate accounts and retrieve the data described above. It also uses Vercel to host the application and MongoDB Atlas to store application data. These providers process information as needed to deliver their services.
            </p>
            <p>
              Your use of Google and YouTube is also governed by the <ExternalTextLink href="https://policies.google.com/privacy">Google Privacy Policy</ExternalTextLink> and the <ExternalTextLink href="https://www.youtube.com/t/terms">YouTube Terms of Service</ExternalTextLink>.
            </p>
          </section>

          <section>
            <h2>6. Security</h2>
            <p>
              Blend uses HTTPS in production, OAuth 2.0 authorization, short-lived application sessions, expiring invitation links, and access controls intended to protect connected-account data. No internet service can promise absolute security, so you should keep comparison links private and disconnect the application when you no longer use it.
            </p>
          </section>

          <section>
            <h2>7. Your controls</h2>
            <p>You can control or remove your data at any time:</p>
            <ul>
              <li>Use <strong>Disconnect Google</strong> to revoke Blend's Google access and end active sessions without deleting the account record.</li>
              <li>Use <strong>Delete account data</strong> to revoke access and delete your stored profile, OAuth credentials, cached YouTube data, sessions, and active comparisons.</li>
              <li>Use <ExternalTextLink href="https://myaccount.google.com/permissions">Google Account permissions</ExternalTextLink> to revoke Blend's access directly through Google.</li>
              <li>If you revoke access through Google, Blend can no longer retrieve new YouTube data. Associated non-statistical API data is deleted when the revocation is detected and no later than 30 days afterward.</li>
            </ul>
            <p>
              If you cannot access the in-product controls, email <a href="mailto:tiwaritanmay1021@gmail.com">tiwaritanmay1021@gmail.com</a> and identify the Google email address connected to Blend. Never send a password, access token, refresh token, client secret, or recovery code.
            </p>
          </section>

          <section>
            <h2>8. Age requirement</h2>
            <p>
              Blend is not directed to children under 13. You must meet the minimum age required to manage your own Google account in your country.
            </p>
          </section>

          <section>
            <h2>9. Changes to this policy</h2>
            <p>
              This policy may change when Blend's features or data practices change. Material changes will be reflected here with an updated date. Continued use after an update means the revised policy applies to your subsequent use.
            </p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>
              For privacy questions or a deletion request that cannot be completed inside Blend, email <a href="mailto:tiwaritanmay1021@gmail.com">tiwaritanmay1021@gmail.com</a>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
