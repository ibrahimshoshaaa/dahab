// ثيم الموقع: الألوان والخطوط اللي بتتحكم فيها لوحة الأدمن (الشكل العام).
// أي إضافة خط جديد هنا بتظهر تلقائيًا في قائمة الاختيار بالداشبورد.

export type FontOption = {
  id: string
  label: string
  /** قيمة CSS font-family الجاهزة للاستخدام */
  family: string
  /** الجزء بتاع family= في رابط Google Fonts */
  googleFamily: string
}

export const BODY_FONT_OPTIONS: FontOption[] = [
  { id: "cairo", label: "Cairo (افتراضي)", family: "Cairo, sans-serif", googleFamily: "Cairo:wght@300;400;500;600;700" },
  { id: "tajawal", label: "Tajawal", family: "Tajawal, sans-serif", googleFamily: "Tajawal:wght@300;400;500;700" },
  { id: "almarai", label: "Almarai", family: "Almarai, sans-serif", googleFamily: "Almarai:wght@300;400;700;800" },
  { id: "ibm-plex-arabic", label: "IBM Plex Sans Arabic", family: "'IBM Plex Sans Arabic', sans-serif", googleFamily: "IBM+Plex+Sans+Arabic:wght@300;400;500;600;700" },
  { id: "el-messiri", label: "El Messiri", family: "'El Messiri', sans-serif", googleFamily: "El+Messiri:wght@400;500;600;700" },
]

export const HEADING_FONT_OPTIONS: FontOption[] = [
  { id: "playfair", label: "Playfair Display (افتراضي)", family: "'Playfair Display', serif", googleFamily: "Playfair+Display:ital,wght@0,400;0,500;0,700;1,400" },
  { id: "amiri", label: "Amiri", family: "Amiri, serif", googleFamily: "Amiri:ital,wght@0,400;0,700;1,400" },
  { id: "lora", label: "Lora", family: "Lora, serif", googleFamily: "Lora:ital,wght@0,400;0,600;1,400" },
  { id: "marcellus", label: "Marcellus", family: "Marcellus, serif", googleFamily: "Marcellus" },
  { id: "cairo-heading", label: "Cairo (نفس خط النصوص)", family: "Cairo, sans-serif", googleFamily: "Cairo:wght@600;700" },
]

export const DEFAULT_THEME = {
  brand: "#a48343",
  brandDark: "#a07845",
  ink: "#171512",
  bg: "#faf8f4",
  bodyFont: "cairo",
  headingFont: "playfair",
}

export type SiteTheme = typeof DEFAULT_THEME

export function findFont(options: FontOption[], id: string | undefined, fallbackId: string): FontOption {
  return options.find((f) => f.id === id) || options.find((f) => f.id === fallbackId) || options[0]
}

// بتحوّل قيم الـ settings (نصوص فقط من قاعدة البيانات) لكائن ثيم آمن بقيم افتراضية
function safeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value! : fallback
}

export function resolveTheme(settings: Record<string, string> | undefined): SiteTheme {
  const s = settings || {}
  return {
    brand: safeColor(s.theme_brand, DEFAULT_THEME.brand),
    brandDark: safeColor(s.theme_brand_dark, DEFAULT_THEME.brandDark),
    ink: safeColor(s.theme_ink, DEFAULT_THEME.ink),
    bg: safeColor(s.theme_bg, DEFAULT_THEME.bg),
    bodyFont: BODY_FONT_OPTIONS.some((f) => f.id === s.theme_body_font) ? s.theme_body_font : DEFAULT_THEME.bodyFont,
    headingFont: HEADING_FONT_OPTIONS.some((f) => f.id === s.theme_heading_font) ? s.theme_heading_font : DEFAULT_THEME.headingFont,
  }
}
export function buildGoogleFontsUrl(theme: SiteTheme): string {
  const body = findFont(BODY_FONT_OPTIONS, theme.bodyFont, DEFAULT_THEME.bodyFont)
  const heading = findFont(HEADING_FONT_OPTIONS, theme.headingFont, DEFAULT_THEME.headingFont)
  const families = Array.from(new Set([body.googleFamily, heading.googleFamily]))
    .map((f) => `family=${f}`)
    .join("&")
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}
