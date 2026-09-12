"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getAdminToken,
  adminLogout,
  fetchAdminOrders,
  updateOrderStatus,
} from "../../lib/api"
import AdminHeader from "../components/AdminHeader"
import { X, MessageCircle, Search } from "lucide-react"

type OrderItem = {
  id: number
  product_name: string
  price: number
  quantity: number
  selected_color?: string
  selected_size?: string
}

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
  tracking_code?: string
  created_at: string
  items: OrderItem[]
}

const statuses = [
  "جديد",
  "تم التأكيد",
  "جاري التجهيز",
  "تم الشحن",
  "تم التسليم",
  "ملغي",
]

const statusColors: Record<string, string> = {
  "جديد": "bg-blue-50 text-blue-600 border-blue-200",
  "تم التأكيد": "bg-purple-50 text-purple-600 border-purple-200",
  "جاري التجهيز": "bg-amber-50 text-amber-600 border-amber-200",
  "تم الشحن": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "تم التسليم": "bg-green-50 text-green-600 border-green-200",
  "ملغي": "bg-red-50 text-red-600 border-red-200",
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function normalizePhone(phone: string) {
  // حول أي رقم مصري لصيغة دولية 20xxxxxxxxxx
  let p = phone.replace(/\D/g, "")
  if (p.startsWith("0020")) p = p.slice(2)
  if (p.startsWith("20") && p.length === 12) return p
  if (p.startsWith("01") && p.length === 11) return "2" + p
  if (p.startsWith("1") && p.length === 10) return "20" + p
  return p
}

function buildWhatsAppMessage(order: Order) {
  const items = order.items
    .map(
      (item) =>
        `• ${item.product_name}${
          item.selected_color ? ` - لون: ${item.selected_color}` : ""
        }${item.selected_size ? ` - مقاس: ${item.selected_size}` : ""} ×${
          item.quantity
        } = ${(item.price * item.quantity).toLocaleString("ar-EG")} ج`
    )
    .join("\n")

  return `مرحبًا ${order.customer_name} 👋

بخصوص طلبك رقم #DAH-${order.id} من متجر دهب:

${items}

الإجمالي: ${order.total.toLocaleString("ar-EG")} جنيه
حالة الطلب: ${order.status}

شكرًا لثقتكم فينا 🌟`
}

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("الكل")
  const [search, setSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

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
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status })
    }
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

  const filteredOrders = useMemo(() => {
    let result =
      filter === "الكل" ? orders : orders.filter((o) => o.status === filter)

    const q = search.trim()
    if (q) {
      const lowerQ = q.toLowerCase()
      result = result.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(lowerQ) ||
          o.phone.includes(q) ||
          String(o.id).includes(q) ||
          (o.tracking_code && o.tracking_code.toLowerCase().includes(lowerQ))
      )
    }
    return result
  }, [orders, filter, search])

  const stats = {
    total: orders.length,
    new: orders.filter((o) => o.status === "جديد").length,
    revenue: orders
      .filter((o) => o.status !== "ملغي")
      .reduce((sum, o) => sum + o.total, 0),
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <AdminHeader onLogout={handleLogout} />

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

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">الطلبات</h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم / التليفون / رقم الطلب..."
                className="w-64 rounded-xl border border-black/10 bg-white py-2 pl-3 pr-9 text-sm outline-none focus:border-[var(--brand-dark)]"
              />
            </div>

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
        </div>

        {loading && <p className="text-sm text-gray-500">جارِ التحميل...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && filteredOrders.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">
            {search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد طلبات"}
          </p>
        )}

        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="block w-full rounded-2xl bg-white p-5 text-right shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      #DAH-{order.id} — {order.customer_name}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        statusColors[order.status] ||
                        "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.phone} · {order.governorate} - {order.area}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(order.created_at)} ·{" "}
                    {order.items?.length || 0} صنف
                  </p>
                </div>

                <span className="text-lg font-semibold">
                  {order.total.toLocaleString("ar-EG")} جنيه
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── نافذة تفاصيل الطلب ─────────────────────────────── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  طلب #DAH-{selectedOrder.id}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            {/* بيانات العميل */}
            <div className="mb-4 rounded-2xl bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium">بيانات العميل</p>
              <p className="text-sm">
                <span className="text-gray-400">الاسم: </span>
                {selectedOrder.customer_name}
              </p>
              <p className="mt-1 text-sm">
                <span className="text-gray-400">التليفون: </span>
                <span dir="ltr">{selectedOrder.phone}</span>
              </p>
              <p className="mt-1 text-sm">
                <span className="text-gray-400">العنوان: </span>
                {selectedOrder.governorate} - {selectedOrder.area}
              </p>
              <p className="mt-1 text-sm">
                <span className="text-gray-400">تفاصيل العنوان: </span>
                {selectedOrder.address}
              </p>
              {selectedOrder.notes && (
                <p className="mt-1 text-sm">
                  <span className="text-gray-400">ملاحظات: </span>
                  {selectedOrder.notes}
                </p>
              )}
              {selectedOrder.tracking_code && (
                <p className="mt-1 text-sm">
                  <span className="text-gray-400">كود التتبع: </span>
                  <span dir="ltr" className="font-mono">
                    {selectedOrder.tracking_code}
                  </span>
                </p>
              )}
            </div>

            {/* الأصناف */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium">المنتجات</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2 text-sm"
                  >
                    <span>
                      {item.product_name}
                      {item.selected_color && (
                        <span className="text-gray-400">
                          {" "}
                          · {item.selected_color}
                        </span>
                      )}
                      {item.selected_size && (
                        <span className="text-gray-400">
                          {" "}
                          · {item.selected_size}
                        </span>
                      )}
                      <span className="text-gray-400"> ×{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      {(item.price * item.quantity).toLocaleString("ar-EG")} ج
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                <span className="text-sm font-semibold">الإجمالي</span>
                <span className="text-lg font-bold">
                  {selectedOrder.total.toLocaleString("ar-EG")} جنيه
                </span>
              </div>
            </div>

            {/* الحالة */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium">حالة الطلب</p>
              <select
                value={selectedOrder.status}
                onChange={(e) =>
                  handleStatusChange(selectedOrder.id, e.target.value)
                }
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* أزرار */}
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${normalizePhone(selectedOrder.phone)}?text=${encodeURIComponent(
                  buildWhatsAppMessage(selectedOrder)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 py-3 text-sm text-white transition hover:bg-green-600"
              >
                <MessageCircle size={16} />
                واتساب العميل
              </a>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-full border border-black/10 py-3 text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
