"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getAdminToken,
  adminLogout,
  fetchAdminOrders,
  updateOrderStatus,
} from "../lib/api"

type Order = {
  id: number
  customer_name: string
  phone: string
  governorate: string
  area: string
  address: string
  notes: string
  total: number
  status: string
  created_at: string
}

const statuses = [
  "جديد",
  "تم التأكيد",
  "جاري التجهيز",
  "تم الشحن",
  "تم التسليم",
  "ملغي",
]

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("الكل")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await fetchAdminOrders()
      setOrders(data as unknown as Order[])
    } catch {
      setError("تعذر تحميل الطلبات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin/login")
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStatusChange(id: number, status: string) {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order))
    )
    try {
      await updateOrderStatus(id, status)
    } catch {
      load()
    }
  }

  function handleLogout() {
    adminLogout()
    router.push("/admin/login")
  }

  const filteredOrders =
    filter === "الكل" ? orders : orders.filter((o) => o.status === filter)

  const stats = {
    total: orders.length,
    new: orders.filter((o) => o.status === "جديد").length,
    revenue: orders
      .filter((o) => o.status !== "ملغي")
      .reduce((sum, o) => sum + o.total, 0),
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f4]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="font-serif text-2xl tracking-widest">
            DAHAB <span className="text-sm text-gray-400">ADMIN</span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="font-medium">
              الطلبات
            </Link>
            <Link href="/admin/products" className="text-gray-500">
              المنتجات
            </Link>
            <Link href="/admin/homepage" className="text-gray-500">
              الصفحة الرئيسية
            </Link>
            <Link href="/admin/pages" className="text-gray-500">
              الصفحات الثابتة
            </Link>
            <Link href="/admin/messages" className="text-gray-500">
              الرسائل
            </Link>
            <button onClick={handleLogout} className="text-gray-500">
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">إجمالي الطلبات</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">طلبات جديدة</p>
            <p className="mt-2 text-2xl font-semibold">{stats.new}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">الإيرادات</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats.revenue.toLocaleString("ar-EG")} جنيه
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold">الطلبات</h1>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
          >
            <option value="الكل">كل الحالات</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-gray-500">جارِ التحميل...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && filteredOrders.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">
            لا توجد طلبات
          </p>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    #DAH-{order.id} — {order.customer_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.phone} · {order.governorate} - {order.area}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {order.address}
                    {order.notes ? ` — ملاحظات: ${order.notes}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">
                    {order.total.toLocaleString("ar-EG")} جنيه
                  </span>

                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
