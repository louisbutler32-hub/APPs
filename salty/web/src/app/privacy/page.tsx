import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/sections";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

// A plain-language draft. Have it checked before launch: see docs/launch-checklist.md.
export default function Privacy() {
  const analytics = Boolean(process.env.NEXT_PUBLIC_UMAMI_ID);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow text-ink-soft">Privacy</p>
        <h1 className="display mt-3 text-[clamp(2.5rem,9vw,4.5rem)]">Your pay is your business.</h1>
        <div className="mt-10 space-y-8 text-lg text-ink-soft [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-ink [&_p]:mt-3">
          <section>
            <h2>What you type stays with you</h2>
            <p>
              The pay check runs entirely in your browser. The pay you enter is never sent to us or to anyone else, and it
              is not saved. Share images show your rank and never your pay.
            </p>
          </section>
          <section>
            <h2>The raise plan</h2>
            <p>
              Your answers to the raise plan questions are used in your browser to build your plan. They are not sent to us and
              are not saved.
            </p>
          </section>
          <section>
            <h2>If you give us your email</h2>
            <p>
              We store your email address and what you signed up for (the weekly pay drop, the raise plan, the offer plan, the
              employer report or news about a country). Where it applies we also store your country and the job group you
              looked at. We use this to send you what you asked for and to decide what to build next. We do not sell or share
              it, and every email has an unsubscribe link.
            </p>
            <p>
              You can ask us to delete your details at any time
              {brand.contactEmail ? (
                <>
                  {" "}
                  by emailing <a className="font-semibold text-brine underline" href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>.
                </>
              ) : (
                "."
              )}
            </p>
          </section>
          <section>
            <h2>Counting visits</h2>
            <p>
              {analytics
                ? "We count page views and button presses with a tool that uses no cookies and does not identify you. It records which job group was checked, never the pay."
                : "We do not use cookies or tracking on this site."}{" "}
              Your browser remembers the country you picked and whether you closed the sign-up prompt, so you are not asked again; that stays on your device.
            </p>
          </section>
          <section>
            <h2>The figures</h2>
            <p>
              All pay figures are official statistics published by government bodies under open licences. They describe
              groups of people, never individuals.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
