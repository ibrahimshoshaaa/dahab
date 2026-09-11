"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getAdminToken,
  adminLogout,
  fetchSettings,
  updateSettings,
} from "../../lib/api"
import AdminHeader from "../components/AdminHeader"
import {
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  DEFAULT_THEME,
  resolveTheme,
  findFont,
  type SiteTheme,
} from "../../lib/theme"

// ── حقل لون: مربع لون + قيمة hex نصية ──────────────────────────────────────
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-black/10 p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
          placeholder="#a48343"
        />
      </div>
    </div>
  )
}

export default function AdminThemePage() {
  const router = useRouter()
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin/login")
      return
    }
    ;(async () => {
      try {
        const settings = await fetchSettings()
        setTheme(resolveTheme(settings))
      } catch {
        setError("تعذر تحميل إعدادات الشكل العام")
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set<K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) {
    setSaved(false)
    setTheme((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      await updateSettings({
        theme_brand: theme.brand,
        theme_brand_dark: theme.brandDark,
        theme_ink: theme.ink,
        theme_bg: theme.bg,
        theme_body_font: theme.bodyFont,
        theme_heading_font: theme.headingFont,
      })
      setSaved(true)
    } catch {
      setError("تعذر حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setSaved(false)
    setTheme(DEFAULT_THEME)
  }

  function handleLogout() {
    adminLogout()
    router.push("/admin/login")
  }

  const bodyFont = findFont(BODY_FONT_OPTIONS, theme.bodyFont, DEFAULT_THEME.bodyFont)
  const headingFont = findFont(HEADING_FONT_OPTIONS, theme.headingFont, DEFAULT_THEME.headingFont)

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <AdminHeader maxWidthClass="max-w-4xl" onLogout={handleLogout} />

      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">الشكل العام للموقع</h1>
          <p className="mt-1 text-sm text-gray-500">
            غيّري الألوان والخطوط وشوفي المعاينة على طول — التغييرات بتُطبّق على
            كل صفحات المتجر بعد الحفظ.
          </p>
        </div>

        {loading && <p className="text-sm text-gray-500">جارِ التحميل...</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!loading && (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              {/* الألوان */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">
                  الألوان
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <ColorField
                    label="اللون الأساسي (الذهبي / البراند)"
                    value={theme.brand}
                    onChange={(v) => set("brand", v)}
                  />
                  <ColorField
                    label="لون التمييز الغامق (Hover / تفاصيل)"
                    value={theme.brandDark}
                    onChange={(v) => set("brandDark", v)}
                  />
                  <ColorField
                    label="لون النصوص الغامقة / الخلفيات الداكنة"
                    value={theme.ink}
                    onChange={(v) => set("ink", v)}
                  />
                  <ColorField
                    label="لون خلفية الموقع"
                    value={theme.bg}
                    onChange={(v) => set("bg", v)}
                  />
                </div>
              </div>

              {/* الخطوط */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">
                  الخطوط
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">خط العناوين</p>
                    <select
                      value={theme.headingFont}
                      onChange={(e) => set("headingFont", e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none"
                    >
                      {HEADING_FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">خط النصوص</p>
                    <select
                      value={theme.bodyFont}
                      onChange={(e) => set("bodyFont", e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none"
                    >
                      {BODY_FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  type="button"
                  className="flex-1 rounded-full border border-black/10 py-3 text-sm sm:flex-none sm:px-8"
                >
                  الرجوع للافتراضي
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                  className="flex-1 rounded-full py-3 text-sm text-white disabled:opacity-60 sm:flex-none sm:px-8"
                  style={{ background: theme.ink }}
                >
                  {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التغييرات"}
                </button>
              </div>
            </div>

            {/* معاينة حية */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <p className="mb-2 text-sm font-medium text-gray-700">معاينة</p>
              <div
                className="overflow-hidden rounded-2xl border border-black/10 shadow-sm"
                style={{ background: theme.bg }}
              >
                <div
                  className="px-5 py-3 text-center text-xs"
                  style={{ background: theme.ink, color: theme.brand }}
                >
                  ✦ شحن لجميع المحافظات
                </div>
                <div className="p-6 text-center">
                  <p
                    className="text-2xl"
                    style={{ fontFamily: headingFont.family, color: theme.ink }}
                  >
                    أناقتك...{" "}
                    <span style={{ color: theme.brand }}>بطابع دهب</span>
                  </p>
                  <p
                    className="mx-auto mt-3 max-w-[240px] text-sm text-gray-500"
                    style={{ fontFamily: bodyFont.family }}
                  >
                    عبايات مصرية بتصميمات راقية تجمع بين الاحتشام والأناقة.
                  </p>
                  <button
                    className="mt-5 rounded-full px-6 py-2.5 text-xs text-white"
                    style={{ background: theme.brand, fontFamily: bodyFont.family }}
                  >
                    اكتشفي المجموعة
                  </button>
                  <button
                    className="mt-3 block w-full rounded-full border py-2.5 text-xs"
                    style={{
                      borderColor: theme.brandDark,
                      color: theme.brandDark,
                      fontFamily: bodyFont.family,
                    }}
                  >
                    زرار بلون التمييز
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
