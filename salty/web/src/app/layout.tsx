import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@/components/Analytics";
import { brand } from "@/lib/brand";
import "./globals.css";

const bricolage = localFont({
  src: "./fonts/bricolage.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  // Lets CSS font-stretch drive the width axis (75% to 100%).
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});

const geist = localFont({
  src: "./fonts/geist.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
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
    <html lang="en" className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh overflow-x-clip">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
