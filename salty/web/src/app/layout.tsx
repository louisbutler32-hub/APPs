import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@/components/Analytics";
import { EmailGate } from "@/components/EmailGate";
import { ExitPrompt, NextStepBar } from "@/components/Prompts";
import { PreviewGuard } from "@/components/PreviewGuard";
import { SmoothScroll } from "@/components/SmoothScroll";
import { brand } from "@/lib/brand";
import "./globals.css";

// One typeface for the whole site: Bricolage Grotesque, a variable font whose optical-size axis
// redraws it between small text and big headlines.
const bricolage = localFont({
  src: "./fonts/bricolage.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  // Lets CSS font-stretch drive the width axis (75% to 100%).
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name}: are you underpaid?`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name}: are you underpaid?`,
    description: brand.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${brand.name}: are you underpaid?` }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} antialiased`}>
      <body className="min-h-dvh overflow-x-clip">
        {/* The headline waits for its entrance script; without scripts it must simply be there. */}
        <noscript>
          <style>{".split-parent{visibility:visible!important}"}</style>
        </noscript>
        {children}
        <SmoothScroll />
        <EmailGate />
        <NextStepBar />
        <ExitPrompt />
        <Analytics />
        {process.env.NEXT_PUBLIC_PREVIEW === "1" && <PreviewGuard />}
      </body>
    </html>
  );
}
