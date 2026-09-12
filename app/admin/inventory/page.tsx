"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Minus, Plus, Search, PackageCheck, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchAdminProducts, getAdminToken, updateProductStock, type ApiProduct } from "../../lib/api"
import AdminHeader from "../components/AdminHeader"

export default function AdminInventoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true); setError("")
    try { setProducts(await fetchAdminProducts()) }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل المخزون") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!getAdminToken()) { router.push("/admin/login"); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const low = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length
    const out = products.filter(p => (p.stock ?? 0) === 0).length
    const total = products.reduce((sum, p) => sum + (p.stock ?? 0), 0)
    return { low, out, total }
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(p => {
      const stock = p.stock ?? 0
      const matchesFilter = filter === "all" || (filter === "low" ? stock > 0 && stock <= (p.lowStockThreshold ?? 5) : stock === 0)
      const matchesQuery = !q || `${p.name} ${p.category}`.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [products, query, filter])

  async function setStock(product: ApiProduct, next: number) {
    const stock = Math.max(0, Math.floor(next))
    setSavingId(product.id); setError("")
    try {
      await updateProductStock(product.id, stock)
      setProducts(current => current.map(p => p.id === product.id ? { ...p, stock } : p))
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحديث المخزون") }
    finally { setSavingId(null) }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <AdminHeader onLogout={() => { localStorage.removeItem("dahab-admin-token"); router.push("/admin/login") }} />
      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-1 text-xs text-gray-400">إدارة المتجر</p><h1 className="text-2xl font-semibold">المخزون</h1><p className="mt-1 text-sm text-gray-500">تابع الكميات وعدّلها بسرعة من مكان واحد.</p></div>
          <button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> تحديث</button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-gray-400">إجمالي القطع</p><p className="mt-2 text-2xl font-semibold">{stats.total.toLocaleString("ar-EG")}</p></div>
          <div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs text-amber-700">مخزون منخفض</p><p className="mt-2 text-2xl font-semibold text-amber-800">{stats.low.toLocaleString("ar-EG")}</p></div>
          <div className="col-span-2 rounded-2xl bg-red-50 p-4 sm:col-span-1"><p className="text-xs text-red-700">نفد المخزون</p><p className="mt-2 text-2xl font-semibold text-red-800">{stats.out.toLocaleString("ar-EG")}</p></div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم المنتج أو التصنيف..." className="w-full rounded-xl border border-black/10 bg-white py-3 pr-10 pl-4 text-sm outline-none focus:border-black/30"/></div>
          <div className="flex rounded-xl border border-black/10 bg-white p-1 text-xs">
            {([['all','الكل'],['low','منخفض'],['out','نفد']] as const).map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 ${filter === value ? "bg-black text-white" : "text-gray-500"}`}>{label}</button>)}
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {loading ? <p className="text-sm text-gray-500">جارِ تحميل المخزون...</p> : filtered.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500">لا توجد منتجات مطابقة.</div> : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map(product => {
              const stock = product.stock ?? 0; const threshold = product.lowStockThreshold ?? 5
              const status = stock === 0 ? "out" : stock <= threshold ? "low" : "ok"
              return <div key={product.id} className="flex gap-4 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
                <img src={product.image} alt={product.name} className="h-24 w-20 shrink-0 rounded-xl object-cover sm:h-28 sm:w-24"/>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-medium">{product.name}</p><p className="mt-1 text-xs text-gray-400">{product.category}</p></div>{status === "out" ? <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] text-red-600">نفد</span> : status === "low" ? <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] text-amber-700"><AlertTriangle size={11}/> منخفض</span> : <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">متوفر</span>}</div>
                  <div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-[11px] text-gray-400">الكمية</p><p className="text-xl font-semibold">{stock.toLocaleString("ar-EG")}</p></div><div className="flex items-center gap-2"><button disabled={savingId === product.id || stock === 0} onClick={() => setStock(product, stock - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 disabled:opacity-40" aria-label="نقص قطعة"><Minus size={16}/></button><button disabled={savingId === product.id} onClick={() => setStock(product, stock + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10" aria-label="زود قطعة"><Plus size={16}/></button><div className="relative"><PackageCheck size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="number" min="0" value={stock} disabled={savingId === product.id} onChange={e => { const next = Math.max(0, Number(e.target.value || 0)); setProducts(current => current.map(p => p.id === product.id ? { ...p, stock: next } : p)) }} onBlur={e => setStock(product, Number(e.currentTarget.value || 0))} className="h-10 w-24 rounded-xl border border-black/10 pr-9 pl-2 text-center text-sm outline-none"/></div></div></div>
                  <p className="mt-2 text-[10px] text-gray-400">تنبيه عند {threshold} قطع أو أقل</p>
                </div>
              </div>
            })}
          </div>
        )}
      </section>
    </main>
  )
}
