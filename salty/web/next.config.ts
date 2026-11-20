import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fully static site: `next build` writes plain files to ./out that any free host can serve.
  output: "export",
  // A single-page preview is hosted in a sub-folder, so its files must load relative to the page.
  ...(process.env.NEXT_PUBLIC_PREVIEW === "1" ? { assetPrefix: "." } : {}),
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
