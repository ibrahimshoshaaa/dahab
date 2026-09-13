import type { MetadataRoute } from "next"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DAHAB | دهب", short_name: "DAHAB", description: "عبايات مصرية وإكسسوارات مختارة بعناية.",
    start_url: "/", display: "standalone", background_color: "#faf8f4", theme_color: "#171512",
    lang: "ar", dir: "rtl", icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }]
  }
}
