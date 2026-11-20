import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fully static site: `next build` writes plain files to ./out that any free host can serve.
  output: "export",
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
