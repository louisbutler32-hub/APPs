import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/sections";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

// A plain-language draft, written to match how the site works today. It is not legal advice and
// names no governing law or refund period: have it checked, and those two things decided, before
// launch (see docs/launch-checklist.md).
export default function Terms() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="display max-w-3xl text-[clamp(2.5rem,9vw,4.5rem)]">Terms: the deal between you and Salty.</h1>
        <p className="mt-5 text-ink-soft">Last updated November 2026.</p>
        <div className="mt-10 max-w-[36rem] space-y-9 text-ink-soft [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-ink [&_p]:mt-3">
          <section>
            <h2>What Salty is</h2>
            <p>
              Salty is a tool that shows where a pay figure sits among the published figures for a job. The pay check, the offer check, the
              employer view and the first part of the raise plan are free and need no account. By using the site you agree to these terms.
            </p>
          </section>
          <section>
            <h2>A guide, not advice</h2>
            <p>
              Salty gives general information. It is not financial, legal, tax or careers advice, and it does not know your contract, your
              employer or your circumstances. It cannot promise a pay rise or a job offer. Decisions about your pay and your job are yours.
            </p>
          </section>
          <section>
            <h2>The official figures</h2>
            <p>
              Where a result is based on official figures, they are statistics published by government bodies, used under their open licences
              and credited on the site. They describe a whole country. They do not adjust for where you live, how long you have done the job
              or who you work for, and they are only as recent as the latest release. We take care to copy them correctly, but we cannot
              promise the site is free of mistakes.
            </p>
          </section>
          <section>
            <h2>AI estimates</h2>
            <p>
              For jobs and countries without official figures, Salty shows an AI estimate. It is always labelled as one. An estimate is a
              rough range and can be wrong. Check it against a local source before you rely on it in a pay conversation.
            </p>
          </section>
          <section>
            <h2>Using the site fairly</h2>
            <p>
              Please do not try to break the site, overload it, or copy its contents in bulk. Do not present a Salty result as a statement
              from a statistics office, or suggest that one of them endorses Salty or you. They do not.
            </p>
          </section>
          <section>
            <h2>Paying for something</h2>
            <p>
              Most of Salty is free. Where something is sold, such as the full raise plan, the price is shown before you pay. Payment is
              taken by a payment provider, and we never see your card details. If something goes wrong with a purchase, contact us and we
              will put it right. Nothing in these terms takes away rights the law gives you as a customer.
            </p>
          </section>
          <section>
            <h2>Emails and recommendations</h2>
            <p>
              If you give us your email we send what you asked for, and every email has an unsubscribe link. Our{" "}
              <Link href="/privacy" className="font-semibold text-ink underline">
                privacy page
              </Link>{" "}
              says what we store. If we ever recommend a product we are paid to recommend, the recommendation says so.
            </p>
          </section>
          <section>
            <h2>What belongs to whom</h2>
            <p>
              The pay figures belong to the bodies that publish them and stay under their licences. The Salty name, design and words are
              ours. You are welcome to share your result and the share image.
            </p>
          </section>
          <section>
            <h2>Our responsibility</h2>
            <p>
              We provide Salty as it is and work to keep it accurate and available, without promising that it always will be. As far as the
              law allows, we are not responsible for losses that come from relying on a result. Nothing here limits responsibility that the
              law says cannot be limited.
            </p>
          </section>
          <section>
            <h2>Changes and contact</h2>
            <p>
              We may update these terms as Salty changes, and the date at the top will change when we do.
              {brand.contactEmail ? (
                <>
                  {" "}
                  Questions go to{" "}
                  <a className="font-semibold text-ink underline" href={`mailto:${brand.contactEmail}`}>
                    {brand.contactEmail}
                  </a>
                  .
                </>
              ) : null}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
