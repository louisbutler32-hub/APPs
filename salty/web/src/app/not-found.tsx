import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/sections";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
        <h1 className="display max-w-3xl text-[clamp(3rem,12vw,6rem)]">Nothing on this page, not even a pinch.</h1>
        <p className="mt-5 text-lg text-ink-soft">The address may be wrong, or the page may have moved.</p>
        <Link href="/" className="press mt-8 inline-block rounded-ctl bg-brine px-6 py-4 font-semibold text-white hover:bg-brine-deep">
          Check your pay
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
