"use client";

import { useEffect, useState } from "react";

/**
 * Only mounted in a single-page preview build (NEXT_PUBLIC_PREVIEW=1), where the other
 * pages are not included. It stops links to them and says why, instead of showing a dead page.
 */
export function PreviewGuard() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function onClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest?.("a");
      const href = anchor?.getAttribute("href") ?? "";
      if (!anchor || href.startsWith("#") || /^https?:/.test(href)) return;
      const hash = href.startsWith("/#") ? href.slice(1) : null;
      event.preventDefault();
      event.stopPropagation();
      if (hash) {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      setShown(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), 2600);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(timer);
    };
  }, []);
  if (!shown) return null;
  return (
    <p role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-ctl bg-zest px-4 py-3 text-center text-sm font-semibold shadow-float">
      This preview is the home page only. Job pages work on the full site.
    </p>
  );
}
