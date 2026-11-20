import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { AVAILABLE, DATA } from "@/lib/pay/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${brand.url}/`, priority: 1 },
    ...AVAILABLE.map((country) => ({ url: `${brand.url}/${country}`, priority: 0.9 })),
    ...AVAILABLE.flatMap((country) => DATA[country].jobs.map((job) => ({ url: `${brand.url}/${country}/${job.slug}`, priority: 0.6 }))),
    { url: `${brand.url}/privacy`, priority: 0.1 },
  ];
}
