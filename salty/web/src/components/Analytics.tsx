import Script from "next/script";

/** Cookieless page and event counts. Renders nothing until an Umami site id is configured. */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_UMAMI_ID;
  if (!id) return null;
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";
  return <Script src={src} data-website-id={id} strategy="afterInteractive" />;
}
