"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getAdminToken,
  adminLogout,
  fetchSettings,
  updateSettings,
  uploadImage,
  type SiteSettings,
} from "../../lib/api"

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
  story_title_line1:           "Story — السطر الأول",
  story_title_line2:           "Story — السطر الثاني (ذهبي مائل)",
  story_body:                  "Story — النص",
  story_image:                 "Story — الصورة",
  accessories_item1_title:     "إكسسوارات — العنصر 1 (اسم)",
  accessories_item1_image:     "إكسسوارات — العنصر 1 (صورة)",
  accessories_item2_title:     "إكسسوارات — العنصر 2 (اسم)",
  accessories_item2_image:     "إكسسوارات — العنصر 2 (صورة)",
  accessories_item3_title:     "إكسسوارات — العنصر 3 (اسم)",
  accessories_item3_image:     "إكسسوارات — العنصر 3 (صورة)",
  accessories_item4_title:     "إكسسوارات — العنصر 4 (اسم)",
  accessories_item4_image:     "إكسسوارات — العنصر 4 (صورة)",
  footer_description:          "الفوتر — نص الوصف",
}

const TEXTAREA_KEYS = new Set(["hero_subtitle", "story_body", "announcement_bar"])
const IMAGE_KEYS = new Set([
  "hero_image", "story_image",
  "collection_abaya_image", "collection_accessories_image",
  "accessories_item1_image", "accessories_item2_image",
  "accessories_item3_image", "accessories_item4_image",
])

const FIELD_ORDER = Object.keys(FIELD_LABELS)

// ── ImageField component ──────────────────────────────────────────────────────
function ImageField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string
  value: string
  onChange: (key: string, value: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError("")
    try {
      const url = await uploadImage(file)
      onChange(fieldKey, url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "فشل الرفع")
    } finally {
      setUploading(false)
      // reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      {/* URL input + upload button side by side */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder="رابط الصورة أو ارفع من جهازك ←"
          className="min-w-0 flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#a48343]"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-xl border border-[#a48343] px-4 py-2 text-sm text-[#a48343] transition hover:bg-[#a48343] hover:text-white disabled:opacity-50"
        >
          {uploading ? "جارِ الرفع..." : "⬆ رفع صورة"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      {/* Preview */}
      {value && (
        <div>
          <p className="mb-1 text-xs text-gray-400">معاينة:</p>
          <img
            src={value}
            alt="preview"
            className="h-36 w-full rounded-xl object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
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

  const SaveBtn = ({ className = "" }: { className?: string }) => (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`rounded-xl bg-[#171512] px-6 py-3 text-sm text-white transition hover:bg-[#a48343] disabled:opacity-50 ${className}`}
    >
      {saving ? "جارِ الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ التغييرات"}
    </button>
  )

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f4]">

      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
          <div className="font-serif text-2xl tracking-widest">
            DAHAB <span className="text-sm text-gray-400">ADMIN</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="text-gray-500">الطلبات</Link>
            <Link href="/admin/products" className="text-gray-500">المنتجات</Link>
            <Link href="/admin/homepage" className="font-medium">الصفحة الرئيسية</Link>
            <Link href="/admin/pages" className="text-gray-500">الصفحات الثابتة</Link>
            <Link href="/admin/messages" className="text-gray-500">الرسائل</Link>
            <button onClick={handleLogout} className="text-gray-500">تسجيل الخروج</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">محتوى الصفحة الرئيسية</h1>
            <p className="mt-1 text-sm text-gray-500">
              ارفع صورة من جهازك أو الصق رابط — التغييرات تظهر على الموقع بعد الحفظ.
            </p>
          </div>
          <SaveBtn />
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
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#a48343]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#a48343]"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <SaveBtn />
        </div>

      </section>
    </main>
  )
}
