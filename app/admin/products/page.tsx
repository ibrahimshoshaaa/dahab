"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, X } from "lucide-react"
import {
  getAdminToken,
  adminLogout,
  fetchAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  type ApiProduct,
} from "../../lib/api"
import AdminHeader from "../components/AdminHeader"

const MAX_IMAGES = 4

const emptyForm = {
  id: undefined as number | undefined,
  name: "",
  category: "عبايات",
  price: "",
  oldPrice: "",
  images: ["", "", "", ""] as string[],
  badge: "",
  colors: "",
  sizes: "",
  description: "",
  featured: false,
  bestSeller: false,
  active: true,
  // جدول المقاسات: صف أول = أسماء الأعمدة (المقاس، الطول، ...)، باقي الصفوف = القيم
  sizeChartColumns: ["المقاس", "الطول", "الصدر"] as string[],
  sizeChartRows: [["", "", ""]] as string[][],
  materialDetails: "",
  careInstructions: "",
}

// ── ProductImageSlot: صورة واحدة برفع من الجهاز أو رابط ────────────────────────
function ProductImageSlot({
  index,
  value,
  onChange,
}: {
  index: number
  value: string
  onChange: (index: number, value: string) => void
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
      onChange(index, url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "فشل الرفع")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-black/10 p-3">
      <p className="text-xs text-gray-400">
        {index === 0 ? "الصورة الرئيسية" : `صورة ${index + 1}`}
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder="رابط الصورة أو ارفع من جهازك ←"
          className="min-w-0 flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[var(--brand-dark)]"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-xl border border-[var(--brand-dark)] px-3 py-2 text-xs text-[var(--brand-dark)] transition hover:bg-[var(--brand-dark)] hover:text-white disabled:opacity-50"
        >
          {uploading ? "جارِ الرفع..." : "⬆ رفع"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

      {value && (
        <img
          src={value}
          alt={`صورة ${index + 1}`}
          className="h-28 w-full rounded-lg object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
      )}
    </div>
  )
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
    const existingImages = product.images?.length ? product.images : [product.image]
    const images = Array.from({ length: MAX_IMAGES }, (_, i) => existingImages[i] || "")

    const sizeChartColumns = product.sizeChart?.columns?.length
      ? product.sizeChart.columns
      : emptyForm.sizeChartColumns
    const sizeChartRows = product.sizeChart?.rows?.length
      ? product.sizeChart.rows
      : emptyForm.sizeChartRows

    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      images,
      badge: product.badge || "",
      colors: product.colors.join(", "),
      sizes: product.sizes.join(", "),
      description: product.description,
      featured: !!product.featured,
      bestSeller: !!product.bestSeller,
      active: product.active !== false,
      sizeChartColumns,
      sizeChartRows,
      materialDetails: product.materialDetails || "",
      careInstructions: product.careInstructions || "",
    })
    setShowForm(true)
  }

  function setImageAt(index: number, value: string) {
    setForm((current) => {
      const images = [...current.images]
      images[index] = value
      return { ...current, images }
    })
  }

  function setColumnAt(index: number, value: string) {
    setForm((current) => {
      const cols = [...current.sizeChartColumns]
      cols[index] = value
      return { ...current, sizeChartColumns: cols }
    })
  }

  function addSizeChartColumn() {
    setForm((current) => ({
      ...current,
      sizeChartColumns: [...current.sizeChartColumns, ""],
      sizeChartRows: current.sizeChartRows.map((row) => [...row, ""]),
    }))
  }

  function removeSizeChartColumn(index: number) {
    setForm((current) => ({
      ...current,
      sizeChartColumns: current.sizeChartColumns.filter((_, i) => i !== index),
      sizeChartRows: current.sizeChartRows.map((row) => row.filter((_, i) => i !== index)),
    }))
  }

  function setCellAt(rowIndex: number, colIndex: number, value: string) {
    setForm((current) => {
      const rows = current.sizeChartRows.map((row) => [...row])
      rows[rowIndex][colIndex] = value
      return { ...current, sizeChartRows: rows }
    })
  }

  function addSizeChartRow() {
    setForm((current) => ({
      ...current,
      sizeChartRows: [
        ...current.sizeChartRows,
        current.sizeChartColumns.map(() => ""),
      ],
    }))
  }

  function removeSizeChartRow(rowIndex: number) {
    setForm((current) => ({
      ...current,
      sizeChartRows: current.sizeChartRows.filter((_, i) => i !== rowIndex),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const images = form.images.map((img) => img.trim()).filter(Boolean)

    if (images.length === 0) {
      setError("من فضلك أضيفي صورة واحدة على الأقل")
      setSaving(false)
      return
    }

    // نحفظ جدول المقاسات فقط لو فيه أعمدة وصفوف مكتملة
    const sizeChartColumns = form.sizeChartColumns.map((c) => c.trim()).filter(Boolean)
    const sizeChartRows = form.sizeChartRows
      .map((row) => row.map((cell) => cell.trim()))
      .filter((row) => row.some(Boolean))
    const sizeChart =
      sizeChartColumns.length > 0 && sizeChartRows.length > 0
        ? { columns: sizeChartColumns, rows: sizeChartRows }
        : undefined

    const payload = {
      name: form.name,
      category: form.category as "عبايات" | "حقائب" | "طرح",
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      image: images[0],
      images,
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
      sizeChart,
      materialDetails: form.materialDetails || undefined,
      careInstructions: form.careInstructions || undefined,
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
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <AdminHeader onLogout={handleLogout} />

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
                <option value="حقائب">حقائب</option>
                <option value="طرح">طرح</option>
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

              <div>
                <p className="mb-2 text-sm font-medium">
                  صور المنتج (حتى {MAX_IMAGES} صور — الأولى هي الرئيسية)
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {form.images.map((img, index) => (
                    <ProductImageSlot
                      key={index}
                      index={index}
                      value={img}
                      onChange={setImageAt}
                    />
                  ))}
                </div>
              </div>

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

              {/* جدول المقاسات */}
              <div className="rounded-xl border border-black/10 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">جدول المقاسات (اختياري)</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addSizeChartColumn}
                      className="rounded-lg border border-black/10 px-2 py-1 text-xs"
                    >
                      + عمود
                    </button>
                    <button
                      type="button"
                      onClick={addSizeChartRow}
                      className="rounded-lg border border-black/10 px-2 py-1 text-xs"
                    >
                      + صف
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse text-xs">
                    <thead>
                      <tr>
                        {form.sizeChartColumns.map((col, colIndex) => (
                          <th key={colIndex} className="p-1">
                            <div className="flex items-center gap-1">
                              <input
                                value={col}
                                onChange={(e) => setColumnAt(colIndex, e.target.value)}
                                placeholder="اسم العمود"
                                className="w-24 rounded-lg border border-black/10 px-2 py-1.5 text-xs font-medium outline-none"
                              />
                              {form.sizeChartColumns.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSizeChartColumn(colIndex)}
                                  className="text-gray-400 hover:text-red-500"
                                  aria-label="حذف العمود"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.sizeChartRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="p-1">
                              <input
                                value={cell}
                                onChange={(e) =>
                                  setCellAt(rowIndex, colIndex, e.target.value)
                                }
                                className="w-24 rounded-lg border border-black/10 px-2 py-1.5 text-xs outline-none"
                              />
                            </td>
                          ))}
                          <td className="p-1">
                            {form.sizeChartRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSizeChartRow(rowIndex)}
                                className="text-gray-400 hover:text-red-500"
                                aria-label="حذف الصف"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  اسيبي الصفوف فاضية لو مش عايزة تظهري جدول المقاسات في صفحة المنتج.
                </p>
              </div>

              <textarea
                placeholder="تفاصيل الخامة (مثال: قماش كريب فاخر، لا يشف، مناسب لكل الفصول)"
                rows={2}
                value={form.materialDetails}
                onChange={(e) => setForm({ ...form, materialDetails: e.target.value })}
                className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none"
              />

              <textarea
                placeholder={"تعليمات العناية (سطر لكل تعليمة، مثال:\nغسيل يدوي بماء بارد\nلا تستخدمي مبيض\nكوي على حرارة منخفضة"}
                rows={3}
                value={form.careInstructions}
                onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
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
