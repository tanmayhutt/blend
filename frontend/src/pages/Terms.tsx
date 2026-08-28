import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";

const ExternalTextLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
    {children}
    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
  </a>
);

const Terms = () => {
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
              <span className="text-sm font-semibold">Terms</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-16 lg:py-24">
        <article className="legal-shell prose max-w-none border-t border-border pt-10">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: August 28, 2026</p>

          <section>
            <h2>1. Agreement</h2>
            <p>
              These terms apply when you access or use Blend. By using Blend, you agree to these terms and the <ExternalTextLink href="https://www.youtube.com/t/terms">YouTube Terms of Service</ExternalTextLink>. If you do not agree, do not connect an account or use the service.
            </p>
            <p>
              Your use of Google services is also subject to the <ExternalTextLink href="https://policies.google.com/privacy">Google Privacy Policy</ExternalTextLink>. Blend's own collection and use of data is described in its <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2>2. What Blend does</h2>
            <p>
              Blend is a private, two-person comparison experience powered by YouTube API Services. With your permission, it reads your YouTube subscriptions, liked and saved videos, and playlists, then identifies shared and different interests between two consenting participants.
            </p>
            <p>
              Blend does not access YouTube watch history and does not act on your YouTube account. Compatibility scores, labels, categories, and recommendations are created by Blend. They may be incomplete or inaccurate and are not provided or endorsed by Google or YouTube.
            </p>
          </section>

          <section>
            <h2>3. Eligibility and connected accounts</h2>
            <p>To use connected-account features, you must:</p>
            <ul>
              <li>have a valid Google account that you are authorized to use;</li>
              <li>meet the minimum age required to manage that account in your country;</li>
              <li>review and approve the requested read-only permissions; and</li>
              <li>provide accurate information when the service asks for it.</li>
            </ul>
            <p>
              You remain responsible for your Google account, device, browser session, and invitation links. Blend never needs your Google password.
            </p>
          </section>

          <section>
            <h2>4. Two-person comparisons</h2>
            <p>
              Creating or joining a comparison means you consent to sharing the comparison data described in the Privacy Policy with the other participant. This can include channel and video titles, thumbnails, categories, broad interests, and app-created compatibility results.
            </p>
            <p>
              Invitation links are intended for one chosen participant and expire after two hours. Do not publish or forward an invitation unless you accept the risk that another person may open it. Respect the other participant's privacy and do not publish their results without their permission.
            </p>
          </section>

          <section>
            <h2>5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>use Blend for unlawful, deceptive, abusive, or harassing activity;</li>
              <li>try to access another person's account, data, or comparison without authorization;</li>
              <li>interfere with the service, bypass security controls, scrape it at scale, or place unreasonable load on it;</li>
              <li>reverse engineer or misuse the service except where applicable law expressly permits it; or</li>
              <li>present Blend's generated results as authoritative YouTube or Google analytics.</li>
            </ul>
          </section>

          <section>
            <h2>6. Disconnecting and deletion</h2>
            <p>
              You may stop using Blend at any time. Use <strong>Disconnect Google</strong> to revoke access and end sessions, or <strong>Delete account data</strong> to also delete your stored profile, YouTube API data, sessions, and active comparisons. You can also revoke access through <ExternalTextLink href="https://myaccount.google.com/permissions">Google Account permissions</ExternalTextLink>.
            </p>
            <p>
              Deleting your Blend data cannot remove copies of comparison results that another participant independently saved or shared outside the service.
            </p>
          </section>

          <section>
            <h2>7. Availability and changes</h2>
            <p>
              Blend is a personal project and may change, pause, limit, or discontinue features without notice. Access can also be affected by Google or YouTube API availability, quotas, account permissions, or policy changes. There is no promise that the service or a particular result will always be available.
            </p>
            <p>
              These terms may be updated when the product or applicable requirements change. The updated date at the top shows the latest revision. If a material change affects your connected data, Blend may ask you to review the updated terms before continuing.
            </p>
          </section>

          <section>
            <h2>8. Disclaimers</h2>
            <p>
              Blend is provided on an "as available" basis, without warranties of uninterrupted operation, accuracy, fitness for a particular purpose, or non-infringement, to the extent permitted by law. Do not use a compatibility result to make a consequential decision about another person.
            </p>
          </section>

          <section>
            <h2>9. Limitation of liability</h2>
            <p>
              To the extent permitted by law, the project owner will not be liable for indirect, incidental, special, consequential, or punitive losses arising from your use of, or inability to use, Blend. Nothing in these terms excludes liability that cannot legally be excluded.
            </p>
          </section>

          <section>
            <h2>10. Brand notice</h2>
            <p>
              Blend is an independent personal project. It is not affiliated with, sponsored by, or endorsed by Google or YouTube. YouTube is a trademark of Google LLC.
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>
              For questions about these terms, email <a href="mailto:tiwaritanmay1021@gmail.com">tiwaritanmay1021@gmail.com</a>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default Terms;
