"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trash2, Phone, Clock } from "lucide-react"
import {
  getAdminToken,
  adminLogout,
  fetchContactMessages,
  markContactMessageRead,
  deleteContactMessage,
  type ContactMessage,
} from "../../lib/api"

export default function AdminMessages() {
  const router = useRouter()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin/login")
      return
    }
    load()
  }, [router])

  function load() {
    setLoading(true)
    fetchContactMessages()
      .then(setMessages)
      .finally(() => setLoading(false))
  }

  function handleOpen(msg: ContactMessage) {
    if (!msg.is_read) {
      markContactMessageRead(msg.id).then(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: 1 } : m))
        )
      })
    }
  }

  function handleDelete(id: number) {
    if (!confirm("متأكدة إنك عايزة تمسحي الرسالة دي؟")) return
    deleteContactMessage(id).then(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    })
  }

  function handleLogout() {
    adminLogout()
    router.push("/admin/login")
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

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
            <Link href="/admin/homepage" className="text-gray-500">الصفحة الرئيسية</Link>
            <Link href="/admin/pages" className="text-gray-500">الصفحات الثابتة</Link>
            <Link href="/admin/messages" className="font-medium">
              الرسائل
              {unreadCount > 0 && (
                <span className="mr-1.5 rounded-full bg-[#a48343] px-1.5 py-0.5 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button onClick={handleLogout} className="text-gray-500">تسجيل الخروج</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">رسائل تواصل معنا</h1>
          <p className="mt-1 text-sm text-gray-500">
            الرسائل اللي بتوصل من فورم "تواصل معنا" في الموقع.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">جارِ التحميل...</p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl bg-white p-14 text-center text-sm text-gray-400 shadow-sm">
            مفيش رسايل لسه.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleOpen(msg)}
                className={`cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition ${
                  !msg.is_read ? "border-r-4 border-[#a48343]" : ""
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{msg.name}</h3>
                      {!msg.is_read && (
                        <span className="rounded-full bg-[#faf3e3] px-2 py-0.5 text-[10px] text-[#a48343]">
                          جديدة
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                      <span dir="ltr" className="flex items-center gap-1">
                        <Phone size={12} />
                        {msg.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(msg.created_at).toLocaleString("ar-EG")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(msg.id)
                    }}
                    className="text-gray-400 transition hover:text-red-600"
                    aria-label="حذف الرسالة"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <p className="text-sm leading-7 text-gray-600">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
