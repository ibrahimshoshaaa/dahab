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

const FIELD_LABELS: Record<string, string> = {
  contact_phone: "رقم التليفون",
  contact_email: "البريد الإلكتروني",
  contact_address: "العنوان",
  contact_hours: "مواعيد خدمة العملاء",
  contact_instagram_url: "رابط Instagram",
  contact_facebook_url: "رابط Facebook",
  shipping_fast_governorates: "محافظات التوصيل السريع (افصلي بينهم بفاصلة ,)",
  shipping_fast_days: "مدة التوصيل السريع",
  shipping_regular_governorates: "باقي المحافظات (افصلي بينهم بفاصلة ,)",
  shipping_regular_days: "مدة التوصيل لباقي المحافظات",
  shipping_note: "ملاحظة أسفل صفحة الشحن",
  returns_period_days: "مدة الاستبدال/الاسترجاع (بالأيام)",
  returns_conditions: "شروط الاستبدال/الاسترجاع (سطر لكل شرط)",
  returns_exceptions: "حالات مستثناة (سطر لكل حالة)",
}

const TEXTAREA_KEYS = new Set([
  "shipping_fast_governorates",
  "shipping_regular_governorates",
  "shipping_note",
  "returns_conditions",
  "returns_exceptions",
])

const GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "صفحة تواصل معنا",
    keys: [
      "contact_phone",
      "contact_email",
      "contact_address",
      "contact_hours",
      "contact_instagram_url",
      "contact_facebook_url",
    ],
  },
  {
    title: "صفحة الشحن والتوصيل",
    keys: [
      "shipping_fast_governorates",
      "shipping_fast_days",
      "shipping_regular_governorates",
      "shipping_regular_days",
      "shipping_note",
    ],
  },
  {
    title: "صفحة الاستبدال والاسترجاع",
    keys: ["returns_period_days", "returns_conditions", "returns_exceptions"],
  },
]

type SaveButtonProps = {
  className?: string
  saving: boolean
  saved: boolean
  onSave: () => void
}

function SaveButton({ className = "", saving, saved, onSave }: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className={`rounded-xl bg-[var(--ink)] px-6 py-3 text-sm text-white transition hover:bg-[var(--brand)] disabled:opacity-50 ${className}`}
    >
      {saving ? "جارِ الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ التغييرات"}
    </button>
  )
}

export default function AdminPagesEditor() {
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin/login")
      return
    }
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
            <h1 className="text-xl font-semibold">
              بيانات صفحات تواصل معنا / الشحن / الاستبدال
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              التغييرات تظهر على الموقع فورًا بعد الحفظ.
            </p>
          </div>
          <SaveButton saving={saving} saved={saved} onSave={handleSave} />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">جارِ التحميل...</p>
        ) : (
          <div className="space-y-10">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="mb-4 text-sm font-semibold text-[var(--brand)]">
                  {group.title}
                </h2>

                <div className="space-y-5">
                  {group.keys.map((key) => {
                    const label = FIELD_LABELS[key]
                    const value = settings[key] ?? ""
                    const isTextarea = TEXTAREA_KEYS.has(key)

                    return (
                      <div key={key} className="rounded-2xl bg-white p-5 shadow-sm">
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          {label}
                        </label>

                        {isTextarea ? (
                          <textarea
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            rows={4}
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
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <SaveButton saving={saving} saved={saved} onSave={handleSave} />
        </div>
      </section>
    </main>
  )
}
