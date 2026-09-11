"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminLogin } from "../../lib/api"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await adminLogin(username, password)
      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "بيانات الدخول غير صحيحة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[var(--ink)] px-5"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8"
      >
        <div className="mb-8 text-center">
          <div className="font-serif text-3xl tracking-widest">DAHAB</div>
          <p className="mt-1 text-xs tracking-[0.3em] text-gray-400">
            ADMIN
          </p>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium">اسم المستخدم</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-sm font-medium">كلمة المرور</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
          />
        </label>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-black py-3.5 text-sm text-white disabled:opacity-60"
        >
          {loading ? "جارِ الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </main>
  )
}
