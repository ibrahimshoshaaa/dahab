import type { MetadataRoute } from "next"
import { fetchProducts } from "./lib/api"
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dahab-seven.vercel.app"
  const products = await fetchProducts()
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: .9 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: .4 },
    { url: `${base}/shipping`, changeFrequency: "monthly", priority: .4 },
    { url: `${base}/returns`, changeFrequency: "monthly", priority: .4 },
    ...products.filter(p => p.active !== false).map(p => ({ url: `${base}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: .8 })),
  ]
}
