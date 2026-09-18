"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getAdminToken,
  adminLogout,
  fetchSettings,
  updateSettings,
  type SiteSettings,
} from "../../lib/api"
import AdminHeader from "../components/AdminHeader"
import ImageField from "../components/ImageField"

const FIELD_LABELS: Record<string, string> = {
  announcement_bar:            "شريط الإعلان (أعلى الصفحة)",
  hero_image:                  "Hero — الصورة الخلفية",
  hero_label:                  "Hero — النص الصغير (DAHAB COLLECTION)",
  hero_title_line1:            "Hero — السطر الأول من العنوان",
  hero_title_line2:            "Hero — السطر الثاني (باللون الذهبي)",
  hero_subtitle:               "Hero — النص التوضيحي",
  hero_button_text:            "Hero — نص الزر",
  collection_abaya_image:      "قسم المجموعات — صورة العبايات",
  collection_accessories_image:"قسم المجموعات — صورة الإكسسوارات",
  accessories_item1_title:     "كمّلي إطلالتك — حقائب (اسم)",
  accessories_item1_image:     "كمّلي إطلالتك — حقائب (صورة)",
  accessories_item3_title:     "كمّلي إطلالتك — طرح (اسم)",
  accessories_item3_image:     "كمّلي إطلالتك — طرح (صورة)",
  footer_description:          "الفوتر — نص الوصف",
}

const TEXTAREA_KEYS = new Set(["hero_subtitle", "announcement_bar"])
const IMAGE_KEYS = new Set([
  "hero_image",
  "collection_abaya_image", "collection_accessories_image",
  "accessories_item1_image", "accessories_item3_image",
])

const FIELD_ORDER = Object.keys(FIELD_LABELS)

// ── Page ─────────────────────────────────────────────────────────────────────
type SaveBtnProps = { className?: string; saving: boolean; saved: boolean; onSave: () => void }

const SaveBtn = ({ className = "", saving, saved, onSave }: SaveBtnProps) => (
    <button
      onClick={onSave}
      disabled={saving}
      className={`rounded-xl bg-[var(--ink)] px-6 py-3 text-sm text-white transition hover:bg-[var(--brand)] disabled:opacity-50 ${className}`}
    >
      {saving ? "جارِ الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ التغييرات"}
    </button>
  )
export default function AdminHomepage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!getAdminToken()) { router.push("/admin/login"); return }
    fetchSettings().then((data) => {
      setSettings(data)
      setLoading(false)
    })
  }, [router])

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      await updateSettings(settings)
      setSaved(true)
    } catch {
      setError("حدث خطأ أثناء الحفظ — تأكد من اتصال الباك إند")
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    adminLogout()
    router.push("/admin/login")
  }



  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">

      <AdminHeader maxWidthClass="max-w-4xl" onLogout={handleLogout} />

      <section className="mx-auto max-w-4xl px-5 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">محتوى الصفحة الرئيسية</h1>
            <p className="mt-1 text-sm text-gray-500">
              ارفع صورة من جهازك أو الصق رابط — التغييرات تظهر على الموقع بعد الحفظ.
            </p>
          </div>
          <SaveBtn saving={saving} saved={saved} onSave={handleSave} />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">جارِ التحميل...</p>
        ) : (
          <div className="space-y-5">
            {FIELD_ORDER.map((key) => {
              const label = FIELD_LABELS[key]
              const value = settings[key] ?? ""
              const isImage = IMAGE_KEYS.has(key)
              const isTextarea = TEXTAREA_KEYS.has(key)

              return (
                <div key={key} className="rounded-2xl bg-white p-5 shadow-sm">
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    {label}
                  </label>

                  {isImage ? (
                    <ImageField
                      fieldKey={key}
                      value={value}
                      onChange={handleChange}
                    />
                  ) : isTextarea ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <SaveBtn saving={saving} saved={saved} onSave={handleSave} />
        </div>

      </section>
    </main>
  )
}
