import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "./context/CartContext"
import { FavoritesProvider } from "./context/FavoritesContext"
import PwaRegister from "./components/PwaRegister"
import { API_URL } from "./lib/api"
import {
  resolveTheme,
  buildGoogleFontsUrl,
  findFont,
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  DEFAULT_THEME,
} from "./lib/theme"

// نجيب إعدادات الثيم بكاش قصير (ISR) بدل no-store، عشان الموقع يفضل
// صفحات ثابتة/سريعة، وفي نفس الوقت أي تغيير من لوحة الأدمن يظهر خلال دقيقة.
async function fetchThemeSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      next: { revalidate: 60 },
    })
    const data = await res.json()
    if (!data.success) return {}
    return data.settings as Record<string, string>
  } catch {
    return {}
  }
}

export const metadata: Metadata = {
  title: "DAHAB | دهب — عبايات وإكسسوارات",
  description: "دهب — عبايات مصرية وإكسسوارات مختارة بعناية.",
  applicationName: "DAHAB",
  keywords: ["دهب", "Dahab", "عبايات", "عبايات مصرية", "إكسسوارات"],
  alternates: { canonical: "/" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dahab-seven.vercel.app"),
  openGraph: {
    title: "DAHAB | دهب",
    description: "عبايات مصرية وإكسسوارات مختارة بعناية.",
    type: "website",
    locale: "ar_EG",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await fetchThemeSettings()
  const theme = resolveTheme(settings)
  const bodyFont = findFont(BODY_FONT_OPTIONS, theme.bodyFont, DEFAULT_THEME.bodyFont)
  const headingFont = findFont(HEADING_FONT_OPTIONS, theme.headingFont, DEFAULT_THEME.headingFont)
  const fontsUrl = buildGoogleFontsUrl(theme)

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href={fontsUrl} />
        <style
          // متغيرات الثيم — بتتغيّر لحظيًا مع أي تعديل في لوحة الأدمن (الشكل العام)
          dangerouslySetInnerHTML={{
            __html: `:root{
              --brand:${theme.brand};
              --brand-dark:${theme.brandDark};
              --ink:${theme.ink};
              --bg:${theme.bg};
              --font-body:${bodyFont.family};
              --font-heading:${headingFont.family};
            }`,
          }}
        />
      </head>
      <body>
        <PwaRegister />
        <CartProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  )
}
