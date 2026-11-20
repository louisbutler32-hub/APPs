import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/sections";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
        <p className="eyebrow text-ink-soft">404</p>
        <h1 className="display mt-3 text-[clamp(3rem,12vw,6rem)]">Nothing here. Not even a pinch.</h1>
        <Link href="/" className="press mt-8 inline-block rounded-xl border-2 border-ink bg-brine px-6 py-3 font-semibold text-white shadow-hard-sm">
          Check your pay
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
