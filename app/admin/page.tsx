"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  Box,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  XCircle,
} from "lucide-react"
import {
  adminLogout,
  fetchAdminOrders,
  getAdminToken,
  type ContactMessage,
  fetchContactMessages,
} from "../lib/api"
import AdminHeader from "./components/AdminHeader"

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

const STATUS_ORDER = ["جديد", "تم التأكيد", "جاري التجهيز", "تم الشحن", "تم التسليم", "ملغي"]

const STATUS_STYLE: Record<string, string> = {
  "جديد": "bg-blue-50 text-blue-700",
  "تم التأكيد": "bg-purple-50 text-purple-700",
  "جاري التجهيز": "bg-amber-50 text-amber-700",
  "تم الشحن": "bg-cyan-50 text-cyan-700",
  "تم التسليم": "bg-emerald-50 text-emerald-700",
  "ملغي": "bg-red-50 text-red-700",
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString("ar-EG")} ج.م`
}

function safeDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric" })
}

function isToday(value: string) {
  const date = safeDate(value)
  if (!date) return false
  const now = new Date()
  return dayKey(date) === dayKey(now)
}

function isWithinDays(value: string, days: number) {
  const date = safeDate(value)
  if (!date) return false
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return date >= start && date <= now
}

function statusIcon(status: string) {
  if (status === "جديد") return <Sparkles size={15} />
  if (status === "تم التأكيد") return <CheckCircle2 size={15} />
  if (status === "جاري التجهيز") return <Box size={15} />
  if (status === "تم الشحن") return <Truck size={15} />
  if (status === "تم التسليم") return <PackageCheck size={15} />
  return <XCircle size={15} />
}

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  async function loadDashboard(silent = false) {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const [ordersData, messagesData] = await Promise.all([
        fetchAdminOrders(),
        fetchContactMessages().catch(() => []),
      ])
      setOrders(ordersData as unknown as Order[])
      setMessages(messagesData)
    } catch {
      setError("تعذر تحميل بيانات الداشبورد — تأكد من اتصال الباك إند")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin/login")
      return
    }

    loadDashboard()
    const interval = window.setInterval(() => loadDashboard(true), 30000)
    return () => window.clearInterval(interval)
  }, [router])

  function handleLogout() {
    adminLogout()
    router.push("/admin/login")
  }

  const stats = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== "ملغي")
    const todayOrders = validOrders.filter((order) => isToday(order.created_at))
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const allRevenue = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const weekOrders = validOrders.filter((order) => isWithinDays(order.created_at, 7))
    const weekRevenue = weekOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const averageToday = todayOrders.length ? todayRevenue / todayOrders.length : 0

    return {
      todayOrders,
      todayRevenue,
      allRevenue,
      weekOrders,
      weekRevenue,
      averageToday,
      newOrders: orders.filter((order) => order.status === "جديد").length,
      preparing: orders.filter((order) => order.status === "جاري التجهيز").length,
      shipping: orders.filter((order) => order.status === "تم الشحن").length,
      delivered: orders.filter((order) => order.status === "تم التسليم").length,
      canceled: orders.filter((order) => order.status === "ملغي").length,
      unreadMessages: messages.filter((message) => !message.is_read).length,
    }
  }, [orders, messages])

  const last7Days = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setHours(0, 0, 0, 0)
      date.setDate(now.getDate() - (6 - index))
      const key = dayKey(date)
      const dayOrders = orders.filter((order) => {
        const orderDate = safeDate(order.created_at)
        return order.status !== "ملغي" && orderDate ? dayKey(orderDate) === key : false
      })
      return {
        date,
        label: formatShortDate(date),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      }
    })
  }, [orders])

  const maxRevenue = Math.max(...last7Days.map((day) => day.revenue), 1)

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>()
    orders.forEach((order) => {
      if (order.status === "ملغي") return
      ;(order.items || []).forEach((item) => {
        const current = map.get(item.product_name) || { name: item.product_name, quantity: 0, revenue: 0 }
        current.quantity += Number(item.quantity || 0)
        current.revenue += Number(item.price || 0) * Number(item.quantity || 0)
        map.set(item.product_name, current)
      })
    })
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5)
  }, [orders])

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => (safeDate(b.created_at)?.getTime() || 0) - (safeDate(a.created_at)?.getTime() || 0))
      .slice(0, 6)
  }, [orders])

  const maxProductQty = Math.max(...topProducts.map((product) => product.quantity), 1)

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
        <AdminHeader onLogout={handleLogout} />
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5">
          <div className="animate-pulse space-y-5">
            <div className="h-9 w-48 rounded-xl bg-black/5" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-black/5" />)}
            </div>
            <div className="h-80 rounded-2xl bg-black/5" />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <AdminHeader onLogout={handleLogout} />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-10">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <span>لوحة التحكم</span>
              <span>/</span>
              <span className="text-[var(--brand-dark)]">نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">صباح الخير 👋</h1>
            <p className="mt-1 text-sm text-gray-500">دي نظرة سريعة على أداء متجر دهب اليوم.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-gray-600 transition hover:border-[var(--brand)] disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              تحديث
            </button>
            <Link href="/admin/orders" className="flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm text-white transition hover:bg-[var(--brand)]">
              <ShoppingBag size={16} />
              الطلبات
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => loadDashboard()} className="font-medium underline">إعادة المحاولة</button>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<BarChart3 size={20} />} label="مبيعات اليوم" value={money(stats.todayRevenue)} note={`${stats.todayOrders.length} طلب اليوم`} />
          <StatCard icon={<ShoppingBag size={20} />} label="طلبات اليوم" value={stats.todayOrders.length.toLocaleString("ar-EG")} note={`من ${orders.length.toLocaleString("ar-EG")} إجمالي الطلبات`} />
          <StatCard icon={<Clock3 size={20} />} label="طلبات تحتاج متابعة" value={(stats.newOrders + stats.preparing).toLocaleString("ar-EG")} note={`${stats.newOrders} جديد · ${stats.preparing} تجهيز`} />
          <StatCard icon={<MessageCircle size={20} />} label="رسائل غير مقروءة" value={stats.unreadMessages.toLocaleString("ar-EG")} note="من صفحة تواصل معنا" />
        </div>

        <div className="mb-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-semibold">المبيعات خلال آخر 7 أيام</h2>
                <p className="mt-1 text-xs text-gray-400">الإجمالي: {money(stats.weekRevenue)} · {stats.weekOrders.length} طلب</p>
              </div>
              <div className="rounded-xl bg-[var(--brand-tint)] p-2.5 text-[var(--brand-dark)]"><CalendarDays size={18} /></div>
            </div>

            <div className="flex h-56 items-end gap-2 sm:gap-4">
              {last7Days.map((day) => {
                const height = day.revenue ? Math.max(8, Math.round((day.revenue / maxRevenue) * 100)) : 3
                return (
                  <div key={day.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="relative flex w-full flex-1 items-end justify-center">
                      <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg bg-[var(--ink)] px-2 py-1 text-[10px] text-white group-hover:block">
                        {money(day.revenue)}
                      </div>
                      <div
                        className="w-full max-w-12 rounded-t-xl bg-[var(--brand)] opacity-80 transition-all group-hover:opacity-100"
                        style={{ height: `${height}%` }}
                        title={`${day.label}: ${money(day.revenue)}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 sm:text-xs">{day.label}</span>
                    <span className="text-[10px] font-medium text-gray-500">{day.orders} طلب</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-black/5 bg-[var(--ink)] p-5 text-white shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">حالة الطلبات</h2>
                <p className="mt-1 text-xs text-white/45">كل الطلبات الحالية</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5"><PackageCheck size={18} /></div>
            </div>

            <div className="space-y-3">
              {STATUS_ORDER.map((status) => {
                const count = orders.filter((order) => order.status === status).length
                const percent = orders.length ? Math.round((count / orders.length) * 100) : 0
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-white/75">{statusIcon(status)} {status}</span>
                      <span className="font-medium">{count.toLocaleString("ar-EG")}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-white/75" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="mb-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">الأكثر طلبًا</h2>
                <p className="mt-1 text-xs text-gray-400">حسب عدد القطع المباعة</p>
              </div>
              <Link href="/admin/products" className="text-xs font-medium text-[var(--brand-dark)]">إدارة المنتجات ←</Link>
            </div>

            {topProducts.length === 0 ? (
              <EmptyState text="لسه مفيش مبيعات مسجلة." />
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name}>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-tint)] text-xs font-semibold text-[var(--brand-dark)]">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium">{product.name}</span>
                          <span className="shrink-0 text-xs text-gray-500">{product.quantity} قطعة</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.max(5, (product.quantity / maxProductQty) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">أحدث الطلبات</h2>
                <p className="mt-1 text-xs text-gray-400">آخر الطلبات الواردة</p>
              </div>
              <Link href="/admin/orders" className="text-xs font-medium text-[var(--brand-dark)]">عرض الكل ←</Link>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState text="مفيش طلبات لسه." />
            ) : (
              <div className="divide-y divide-black/5">
                {recentOrders.map((order) => (
                  <Link key={order.id} href="/admin/orders" className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500"><ShoppingBag size={17} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{order.customer_name}</span>
                        <span className="shrink-0 text-sm font-semibold">{money(order.total)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                        <span>#{order.id}</span>
                        <span>·</span>
                        <span>{safeDate(order.created_at)?.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) || ""}</span>
                        <span className={`mr-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {statusIcon(order.status)} {order.status}
                        </span>
                      </div>
                    </div>
                    <ArrowLeft size={15} className="shrink-0 text-gray-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">إحصائيات سريعة</h2>
              <p className="mt-1 text-xs text-gray-400">ملخص يساعدك تاخد قرار أسرع</p>
            </div>
            <BarChart3 size={19} className="text-gray-300" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat icon={<Truck size={17} />} label="تم الشحن" value={stats.shipping} />
            <MiniStat icon={<PackageCheck size={17} />} label="تم التسليم" value={stats.delivered} />
            <MiniStat icon={<XCircle size={17} />} label="ملغي" value={stats.canceled} />
            <MiniStat icon={<Users size={17} />} label="متوسط طلب اليوم" value={money(stats.averageToday)} />
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <QuickAction href="/admin/orders" icon={<Eye size={18} />} title="مراجعة الطلبات" text={`${stats.newOrders} طلب جديد يحتاج مراجعة`} />
          <QuickAction href="/admin/products" icon={<Box size={18} />} title="إدارة المنتجات" text="إضافة أو تعديل المنتجات والأسعار" />
          <QuickAction href="/admin/messages" icon={<MessageCircle size={18} />} title="الرسائل" text={`${stats.unreadMessages} رسالة غير مقروءة`} />
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">يتم تحديث بيانات الداشبورد تلقائيًا كل 30 ثانية.</p>
      </section>
    </main>
  )
}

function StatCard({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="rounded-xl bg-[var(--brand-tint)] p-2 text-[var(--brand-dark)]">{icon}</span>
      </div>
      <p className="truncate text-lg font-semibold sm:text-xl">{value}</p>
      <p className="mt-1 truncate text-[11px] text-gray-400">{note}</p>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
      <span className="rounded-xl bg-white p-2 text-gray-500 shadow-sm">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand)]">
      <span className="rounded-xl bg-[var(--brand-tint)] p-2.5 text-[var(--brand-dark)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-gray-400">{text}</p>
      </div>
      <ArrowUpLeft size={16} className="text-gray-300 transition group-hover:text-[var(--brand-dark)]" />
    </Link>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl bg-gray-50 py-10 text-center text-sm text-gray-400">{text}</div>
}
