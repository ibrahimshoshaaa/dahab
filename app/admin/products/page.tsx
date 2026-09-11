"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, Plus } from "lucide-react"
import {
  getAdminToken,
  adminLogout,
  fetchAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ApiProduct,
} from "../../lib/api"

const emptyForm = {
  id: undefined as number | undefined,
  name: "",
  category: "عبايات",
  price: "",
  oldPrice: "",
  image: "",
  badge: "",
  colors: "",
  sizes: "",
  description: "",
  featured: false,
  bestSeller: false,
  active: true,
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await fetchAdminProducts()
      setProducts(data)
    } catch {
      setError("تعذر تحميل المنتجات")
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

  function openNewForm() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(product: ApiProduct) {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      image: product.image,
      badge: product.badge || "",
      colors: product.colors.join(", "),
      sizes: product.sizes.join(", "),
      description: product.description,
      featured: !!product.featured,
      bestSeller: !!product.bestSeller,
      active: product.active !== false,
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const payload = {
      name: form.name,
      category: form.category as "عبايات" | "إكسسوارات",
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      image: form.image,
      badge: form.badge || undefined,
      colors: form.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: form.description,
      featured: form.featured,
      bestSeller: form.bestSeller,
      active: form.active,
    }

    try {
      if (form.id) {
        await updateProduct(form.id, payload)
      } else {
        await createProduct(payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ المنتج")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("متأكد من حذف هذا المنتج؟")) return
    try {
      await deleteProduct(id)
      setProducts((current) => current.filter((p) => p.id !== id))
    } catch {
      setError("تعذر حذف المنتج")
    }
  }

  function handleLogout() {
    adminLogout()
    router.push("/admin/login")
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f4]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="font-serif text-2xl tracking-widest">
            DAHAB <span className="text-sm text-gray-400">ADMIN</span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="text-gray-500">
              الطلبات
            </Link>
            <Link href="/admin/products" className="font-medium">
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">المنتجات</h1>

          <button
            onClick={openNewForm}
            className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm text-white"
          >
            <Plus size={16} />
            إضافة منتج
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">جارِ التحميل...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="aspect-[4/3] bg-[#eee]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400">{product.category}</p>
                      <h3 className="font-medium">{product.name}</h3>
                    </div>

                    {product.active === false && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
                        مخفي
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm font-semibold">
                    {product.price.toLocaleString("ar-EG")} جنيه
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEditForm(product)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-2 text-sm"
                    >
                      <Pencil size={14} />
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center justify-center rounded-xl border border-red-100 px-3 text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSave}
            dir="rtl"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"
          >
            <h2 className="mb-5 text-lg font-semibold">
              {form.id ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h2>

            <div className="space-y-4">
              <input
                required
                placeholder="اسم المنتج"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              >
                <option value="عبايات">عبايات</option>
                <option value="إكسسوارات">إكسسوارات</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="السعر"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
                />
                <input
                  type="number"
                  placeholder="السعر قبل الخصم (اختياري)"
                  value={form.oldPrice}
                  onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <input
                required
                placeholder="رابط الصورة"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <input
                placeholder="badge (مثال: جديد)"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <input
                placeholder="الألوان (افصل بينها بفاصلة)"
                value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <input
                placeholder="المقاسات (افصل بينها بفاصلة)"
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <textarea
                placeholder="الوصف"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({ ...form, featured: e.target.checked })
                    }
                  />
                  مميز
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.bestSeller}
                    onChange={(e) =>
                      setForm({ ...form, bestSeller: e.target.checked })
                    }
                  />
                  الأكثر مبيعًا
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                  ظاهر في المتجر
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full border border-black/10 py-3 text-sm"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-black py-3 text-sm text-white disabled:opacity-60"
              >
                {saving ? "جارِ الحفظ..." : "حفظ"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
