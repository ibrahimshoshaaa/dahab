"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getAdminToken, adminLogout, fetchAdminOrders, updateOrderStatus } from "../../lib/api"
import AdminHeader from "../components/AdminHeader"
import { X, MessageCircle, Search, Phone, Copy, Check, ChevronDown } from "lucide-react"

type OrderItem = { id: number; product_name: string; price: number; quantity: number; selected_color?: string; selected_size?: string }
type Order = { id: number; customer_name: string; phone: string; governorate: string; area: string; address: string; notes: string; total: number; status: string; tracking_code?: string; created_at: string; items: OrderItem[] }

const statuses = ["جديد", "تم التأكيد", "جاري التجهيز", "تم الشحن", "تم التسليم", "ملغي"]
const statusColors: Record<string, string> = {
  "جديد": "bg-blue-50 text-blue-600 border-blue-200", "تم التأكيد": "bg-purple-50 text-purple-600 border-purple-200",
  "جاري التجهيز": "bg-amber-50 text-amber-600 border-amber-200", "تم الشحن": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "تم التسليم": "bg-green-50 text-green-600 border-green-200", "ملغي": "bg-red-50 text-red-600 border-red-200",
}

function formatDate(dateStr: string) { try { return new Date(dateStr).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) } catch { return dateStr } }
function normalizePhone(phone: string) { let p = phone.replace(/\D/g, ""); if (p.startsWith("0020")) p = p.slice(2); if (p.startsWith("20") && p.length === 12) return p; if (p.startsWith("01") && p.length === 11) return "2" + p; if (p.startsWith("1") && p.length === 10) return "20" + p; return p }
function buildWhatsAppMessage(order: Order) {
  const items = order.items?.map(item => `• ${item.product_name}${item.selected_color ? ` - لون: ${item.selected_color}` : ""}${item.selected_size ? ` - مقاس: ${item.selected_size}` : ""} ×${item.quantity} = ${(item.price * item.quantity).toLocaleString("ar-EG")} ج`).join("\n") || ""
  return `مرحبًا ${order.customer_name} 👋\n\nبخصوص طلبك رقم #DAH-${order.id} من متجر دهب:\n\n${items}\n\nالإجمالي: ${order.total.toLocaleString("ar-EG")} جنيه\nحالة الطلب: ${order.status}\n\nشكرًا لثقتكم فينا 🌟`
}

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("")
  const [filter, setFilter] = useState("الكل"), [search, setSearch] = useState(""), [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sort, setSort] = useState("الأحدث"), [copied, setCopied] = useState("")

  async function load() { setLoading(true); setError(""); try { const data = await fetchAdminOrders(); setOrders(data as unknown as Order[]) } catch { setError("تعذر تحميل الطلبات") } finally { setLoading(false) } }
  useEffect(() => { if (!getAdminToken()) { router.push("/admin/login"); return }; load() }, [])

  async function handleStatusChange(id: number, status: string) {
    const previous = orders.find(o => o.id === id)
    setOrders(current => current.map(o => o.id === id ? { ...o, status } : o))
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status })
    try { await updateOrderStatus(id, status) } catch { if (previous) setOrders(current => current.map(o => o.id === id ? previous : o)); setSelectedOrder(previous || null) }
  }
  function handleLogout() { adminLogout(); router.push("/admin/login") }
  async function copyText(value: string, key: string) { try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(""), 1200) } catch {} }

  const counts = useMemo(() => Object.fromEntries(["الكل", ...statuses].map(s => [s, s === "الكل" ? orders.length : orders.filter(o => o.status === s).length])), [orders])
  const filteredOrders = useMemo(() => {
    let result = filter === "الكل" ? [...orders] : orders.filter(o => o.status === filter)
    const q = search.trim().toLowerCase()
    if (q) result = result.filter(o => [o.customer_name, o.phone, String(o.id), o.tracking_code, o.governorate, o.area, o.address, ...(o.items || []).map(i => `${i.product_name} ${i.selected_color || ""} ${i.selected_size || ""}`)].filter(Boolean).join(" ").toLowerCase().includes(q))
    if (sort === "الأحدث") result.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (sort === "الأقدم") result.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (sort === "الأعلى سعرًا") result.sort((a,b) => b.total - a.total)
    if (sort === "الأقل سعرًا") result.sort((a,b) => a.total - b.total)
    return result
  }, [orders, filter, search, sort])
  const revenue = orders.filter(o => o.status !== "ملغي").reduce((s,o) => s + o.total, 0)

  return <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
    <AdminHeader onLogout={handleLogout} />
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-10">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"><p className="text-xs text-gray-400">إجمالي الطلبات</p><p className="mt-2 text-xl font-semibold sm:text-2xl">{orders.length}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"><p className="text-xs text-gray-400">طلبات جديدة</p><p className="mt-2 text-xl font-semibold sm:text-2xl">{counts["جديد"]}</p></div>
        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:col-span-1 sm:p-5"><p className="text-xs text-gray-400">الإيرادات</p><p className="mt-2 text-xl font-semibold sm:text-2xl">{revenue.toLocaleString("ar-EG")} جنيه</p></div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 className="text-xl font-semibold">الطلبات</h1><div className="flex w-full gap-2 sm:w-auto">
        <div className="relative flex-1 sm:w-80 sm:flex-none"><Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم، الهاتف، المنتج..." className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[var(--brand-dark)]" />{search && <button onClick={()=>setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"><X size={14}/></button>}</div>
        <div className="relative"><select value={sort} onChange={e=>setSort(e.target.value)} className="h-full appearance-none rounded-xl border border-black/10 bg-white py-2.5 pl-8 pr-3 text-sm outline-none"><option>الأحدث</option><option>الأقدم</option><option>الأعلى سعرًا</option><option>الأقل سعرًا</option></select><ChevronDown size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/></div>
      </div></div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{["الكل", ...statuses].map(s=><button key={s} onClick={()=>setFilter(s)} className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${filter===s ? "border-black bg-black text-white" : "border-black/10 bg-white text-gray-600 hover:bg-gray-50"}`}>{s} <span className="mr-1 opacity-70">({counts[s] || 0})</span></button>)}</div>

      {loading && <p className="text-sm text-gray-500">جارِ التحميل...</p>}{error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && filteredOrders.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">{search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد طلبات"}</p>}

      <div className="space-y-3">{filteredOrders.map(order=><div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
        <div className="flex items-start gap-3"><button onClick={()=>setSelectedOrder(order)} className="min-w-0 flex-1 text-right"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">#DAH-{order.id} — {order.customer_name}</p><span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusColors[order.status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{order.status}</span></div><p className="mt-1 text-sm text-gray-500">{order.phone} · {order.governorate} - {order.area}</p><p className="mt-1 text-xs text-gray-400">{formatDate(order.created_at)} · {order.items?.length || 0} صنف</p></button>
          <div className="shrink-0 text-left"><p className="text-base font-semibold sm:text-lg">{order.total.toLocaleString("ar-EG")} جنيه</p><div className="mt-2 flex gap-1"><a href={`tel:${order.phone}`} onClick={e=>e.stopPropagation()} className="rounded-full border border-black/10 p-2 text-gray-600 hover:bg-gray-50" aria-label="اتصال"><Phone size={15}/></a><a href={`https://wa.me/${normalizePhone(order.phone)}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="rounded-full bg-green-500 p-2 text-white hover:bg-green-600" aria-label="واتساب"><MessageCircle size={15}/></a></div></div>
        </div>
        {order.status === "جديد" && <button onClick={()=>handleStatusChange(order.id,"تم التأكيد")} className="mt-3 w-full rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto sm:px-5">✓ تأكيد الطلب</button>}
      </div>)}</div>
    </section>

    {selectedOrder && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={()=>setSelectedOrder(null)}>
      <div dir="rtl" onClick={e=>e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden"/><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-semibold">طلب #DAH-{selectedOrder.id}</h2><p className="mt-1 text-xs text-gray-400">{formatDate(selectedOrder.created_at)}</p></div><button onClick={()=>setSelectedOrder(null)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={20}/></button></div>
        <div className="mb-4 rounded-2xl bg-gray-50 p-4"><p className="mb-3 text-sm font-medium">بيانات العميل</p><div className="flex items-center justify-between gap-2"><p className="text-sm"><span className="text-gray-400">الاسم: </span>{selectedOrder.customer_name}</p></div><div className="mt-2 flex items-center justify-between gap-2"><p className="text-sm"><span className="text-gray-400">التليفون: </span><span dir="ltr">{selectedOrder.phone}</span></p><div className="flex gap-1"><a href={`tel:${selectedOrder.phone}`} className="rounded-lg border border-black/10 bg-white p-2"><Phone size={15}/></a><button onClick={()=>copyText(selectedOrder.phone,"phone")} className="rounded-lg border border-black/10 bg-white p-2">{copied==="phone"?<Check size={15}/>:<Copy size={15}/>}</button></div></div><div className="mt-2 flex items-start justify-between gap-2"><p className="text-sm"><span className="text-gray-400">العنوان: </span>{selectedOrder.governorate} - {selectedOrder.area}<br/>{selectedOrder.address}</p><button onClick={()=>copyText(`${selectedOrder.governorate} - ${selectedOrder.area} - ${selectedOrder.address}`,"address")} className="shrink-0 rounded-lg border border-black/10 bg-white p-2">{copied==="address"?<Check size={15}/>:<Copy size={15}/>}</button></div>{selectedOrder.notes&&<p className="mt-2 text-sm"><span className="text-gray-400">ملاحظات: </span>{selectedOrder.notes}</p>}{selectedOrder.tracking_code&&<p className="mt-2 text-sm"><span className="text-gray-400">كود التتبع: </span><span dir="ltr" className="font-mono">{selectedOrder.tracking_code}</span></p>}</div>
        <div className="mb-4"><p className="mb-2 text-sm font-medium">المنتجات</p><div className="space-y-2">{selectedOrder.items?.map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-3 py-2 text-sm"><span>{item.product_name}{item.selected_color&&<span className="text-gray-400"> · {item.selected_color}</span>}{item.selected_size&&<span className="text-gray-400"> · {item.selected_size}</span>}<span className="text-gray-400"> ×{item.quantity}</span></span><span className="shrink-0 font-medium">{(item.price*item.quantity).toLocaleString("ar-EG")} ج</span></div>)}</div><div className="mt-3 flex justify-between border-t border-black/10 pt-3"><span className="text-sm font-semibold">الإجمالي</span><span className="text-lg font-bold">{selectedOrder.total.toLocaleString("ar-EG")} جنيه</span></div></div>
        <div className="mb-5"><p className="mb-2 text-sm font-medium">حالة الطلب</p><select value={selectedOrder.status} onChange={e=>handleStatusChange(selectedOrder.id,e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none">{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2"><a href={`https://wa.me/${normalizePhone(selectedOrder.phone)}?text=${encodeURIComponent(buildWhatsAppMessage(selectedOrder))}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm text-white hover:bg-green-600"><MessageCircle size={16}/> واتساب</a><a href={`tel:${selectedOrder.phone}`} className="flex items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm"><Phone size={16}/> اتصال</a></div><button onClick={()=>setSelectedOrder(null)} className="mt-2 w-full rounded-xl border border-black/10 py-3 text-sm">إغلاق</button>
      </div>
    </div>}
  </main>
}
