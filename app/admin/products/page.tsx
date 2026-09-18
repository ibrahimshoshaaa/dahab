"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, X, Check, ChevronLeft, ChevronRight, Image as ImageIcon, Package, Tags, FileText, type LucideIcon } from "lucide-react"
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
  slug: "",
  name: "",
  category: "عبايات" as ApiProduct["category"],
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
  stock: "20",
  lowStockThreshold: "5",
  variantStock: {} as Record<string, number>,
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
  const [step, setStep] = useState(1)
  const [colorInput, setColorInput] = useState("")
  const [sizeInput, setSizeInput] = useState("")

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
    setColorInput("")
    setSizeInput("")
    setStep(1)
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
      slug: product.slug ?? "",
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
      stock: String(product.stock ?? 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      variantStock: product.variantStock || {},
    })
    setColorInput("")
    setSizeInput("")
    setStep(1)
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

  function listFromText(value: string) {
    return value.split(",").map((x) => x.trim()).filter(Boolean)
  }

  function buildVariantStock(colors: string[], sizes: string[], current: Record<string, number>) {
    const next: Record<string, number> = {}
    if (colors.length && sizes.length) {
      colors.forEach((color) => sizes.forEach((size) => {
        const key = `${color}|${size}`
        next[key] = Number(current[key] ?? 0)
      }))
    } else if (colors.length) {
      colors.forEach((color) => { const key = `${color}|-`; next[key] = Number(current[key] ?? 0) })
    } else if (sizes.length) {
      sizes.forEach((size) => { const key = `-|${size}`; next[key] = Number(current[key] ?? 0) })
    }
    return next
  }

  function syncVariantStock() {
    setForm((current) => ({ ...current, variantStock: buildVariantStock(listFromText(current.colors), listFromText(current.sizes), current.variantStock) }))
  }

  function addVariant(type: "color" | "size") {
    const raw = type === "color" ? colorInput : sizeInput
    const value = raw.trim().replace(/,/g, "")
    if (!value) return
    setForm((current) => {
      const existing = listFromText(type === "color" ? current.colors : current.sizes)
      if (existing.some((item) => item.toLowerCase() === value.toLowerCase())) return current
      const colors = type === "color" ? [...existing, value] : listFromText(current.colors)
      const sizes = type === "size" ? [...existing, value] : listFromText(current.sizes)
      return { ...current, colors: colors.join(", "), sizes: sizes.join(", "), variantStock: buildVariantStock(colors, sizes, current.variantStock) }
    })
    if (type === "color") setColorInput("")
    else setSizeInput("")
  }

  function removeVariant(type: "color" | "size", value: string) {
    setForm((current) => {
      const colors = type === "color" ? listFromText(current.colors).filter((item) => item !== value) : listFromText(current.colors)
      const sizes = type === "size" ? listFromText(current.sizes).filter((item) => item !== value) : listFromText(current.sizes)
      return { ...current, colors: colors.join(", "), sizes: sizes.join(", "), variantStock: buildVariantStock(colors, sizes, current.variantStock) }
    })
  }

  function validateStep(targetStep: number) {
    if (targetStep >= 2 && (!form.name.trim() || !form.price || Number(form.price) < 0)) {
      setError("اكتبي اسم المنتج والسعر الأول")
      return false
    }
    if (targetStep >= 3 && form.images.every((img) => !img.trim())) {
      setError("أضيفي صورة واحدة على الأقل للمنتج")
      return false
    }
    if (targetStep >= 3) syncVariantStock()
    setError("")
    return true
  }

  function goNext() {
    if (!validateStep(step + 1)) return
    setStep((current) => Math.min(4, current + 1))
  }

  function goBack() {
    setError("")
    setStep((current) => Math.max(1, current - 1))
  }

  async function handleSave() {
    setError("")

    if (!form.name.trim() || !form.price || Number(form.price) < 0) {
      setError("اكتبي اسم المنتج والسعر أولًا")
      setStep(1)
      return
    }

    const images = form.images.map((img) => img.trim()).filter(Boolean)

    if (images.length === 0) {
      setError("من فضلك أضيفي صورة واحدة على الأقل")
      setStep(2)
      return
    }

    setSaving(true)

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
      ...(form.id && form.slug ? { slug: form.slug } : {}),
      category: form.category,
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
      stock: Object.keys(form.variantStock).length ? Object.values(form.variantStock).reduce<number>((sum, value) => sum + Math.max(0, Number(value || 0)), 0) : Math.max(0, Number(form.stock || 0)),
      lowStockThreshold: Math.max(0, Number(form.lowStockThreshold || 0)),
      variantStock: form.variantStock,
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
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-5 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div><h1 className="text-xl font-semibold">المنتجات</h1><p className="mt-1 text-xs text-gray-400">إضافة وتعديل المنتجات والمخزون بسهولة</p></div>
          <button onClick={openNewForm} className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm text-white"><Plus size={16}/> إضافة منتج</button>
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {loading ? <p className="text-sm text-gray-500">جارِ التحميل...</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <div key={product.id} className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="aspect-[4/3] bg-[#eee]"><img src={product.image} alt={product.name} className="h-full w-full object-cover"/></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-gray-400">{product.category}</p><h3 className="font-medium">{product.name}</h3></div>{product.active===false&&<span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500">مخفي</span>}</div><div className="mt-2 flex items-center justify-between gap-2"><p className="text-sm font-semibold">{product.price.toLocaleString("ar-EG")} جنيه</p><span className={`rounded-full px-2.5 py-1 text-[11px] ${(product.stock??0)<=(product.lowStockThreshold??5)?"bg-red-50 text-red-600":"bg-emerald-50 text-emerald-700"}`}>مخزون: {(product.stock??0).toLocaleString("ar-EG")}</span></div><div className="mt-4 flex gap-2"><button onClick={()=>openEditForm(product)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-2 text-sm"><Pencil size={14}/> تعديل</button><button onClick={()=>handleDelete(product.id)} className="flex items-center justify-center rounded-xl border border-red-100 px-3 text-red-600"><Trash2 size={14}/></button></div></div></div>)}</div>}
      </section>

      {showForm && <div className="fixed inset-0 z-50 bg-black/45 p-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div
          dir="rtl"
          className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl"
        >
          <div className="shrink-0 border-b border-black/10 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-gray-400">{form.id?"تعديل منتج":"منتج جديد"}</p><h2 className="mt-1 text-xl font-semibold">{form.id?form.name||"تعديل المنتج":"إضافة منتج جديد"}</h2></div><button type="button" onClick={()=>setShowForm(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-gray-500"><X size={18}/></button></div>
            <div className="mt-5 grid grid-cols-4 gap-1.5">{([
              { number: 1, label: "البيانات", Icon: Package },
              { number: 2, label: "الصور", Icon: ImageIcon },
              { number: 3, label: "المخزون", Icon: Tags },
              { number: 4, label: "التفاصيل", Icon: FileText },
            ] as { number: number; label: string; Icon: LucideIcon }[]).map(({ number, label, Icon }) => {
              const done = step > number
              return <button key={number} type="button" onClick={() => number < step && setStep(number)} className={`rounded-xl px-1 py-2 text-center text-[10px] sm:text-xs ${step === number ? "bg-black text-white" : done ? "bg-gray-100 text-black" : "bg-gray-50 text-gray-400"}`}><span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-current">{done ? <Check size={12} /> : <Icon size={12} />}</span>{label}</button>
            })}</div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {step===1 && <div className="space-y-4"><div><label className="mb-1.5 block text-sm font-medium">اسم المنتج</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: عباية لؤلؤة" className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div>{form.id&&<div><label className="mb-1.5 block text-xs text-gray-500">الرابط المختصر</label><input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")})} placeholder="pearl-abaya" dir="ltr" className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm outline-none"/></div>}<div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-sm font-medium">السعر</label><input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="1499" className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div><div><label className="mb-1.5 block text-sm font-medium">السعر قبل الخصم</label><input min="0" type="number" value={form.oldPrice} onChange={e=>setForm({...form,oldPrice:e.target.value})} placeholder="اختياري" className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div></div><div><label className="mb-1.5 block text-sm font-medium">القسم</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"><option value="عبايات">عبايات</option><option value="إكسسوارات">إكسسوارات</option><option value="حقائب">حقائب</option><option value="طرح">طرح</option></select></div><div><label className="mb-1.5 block text-sm font-medium">الشارة <span className="font-normal text-gray-400">اختياري</span></label><input value={form.badge} onChange={e=>setForm({...form,badge:e.target.value})} placeholder="جديد / الأكثر مبيعًا / خصم" className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div></div>}

            {step===2 && <div className="space-y-4"><div className="rounded-2xl bg-neutral-50 p-4"><p className="text-sm font-semibold">صور المنتج</p><p className="mt-1 text-xs leading-5 text-gray-500">الصورة الأولى هي الرئيسية. أضيفي صورة واحدة على الأقل، ويمكنك إضافة حتى {MAX_IMAGES} صور.</p></div><div className="grid gap-3 sm:grid-cols-2">{form.images.map((img,index)=><ProductImageSlot key={index} index={index} value={img} onChange={setImageAt}/>)}</div></div>}

            {step === 3 && (() => {
              const colors = listFromText(form.colors)
              const sizes = listFromText(form.sizes)
              const hasVariants = colors.length > 0 || sizes.length > 0
              const displayColors = colors.length ? colors : ["-"]
              const displaySizes = sizes.length ? sizes : ["-"]
              const total = Object.values(form.variantStock).reduce<number>(
                (sum, value) => sum + Math.max(0, Number(value || 0)),
                0,
              )

              return (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
                        <Package size={17} />
                      </div>
                      <div>
                        <p className="text-base font-semibold">الألوان والمقاسات والقطع</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          أضيفي الألوان والمقاسات أولًا. بعدها سيظهر جدول تلقائيًا، واكتبي عدد القطع الموجودة في كل اختيار.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">الألوان <span className="font-normal text-gray-400">اختياري</span></label>
                    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 focus-within:border-black">
                      {colors.map((color) => (
                        <span key={color} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs">
                          {color}
                          <button type="button" onClick={() => removeVariant("color", color)} className="text-gray-400 hover:text-red-500" aria-label={`حذف لون ${color}`}>
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value.replace(/,/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !colorInput && colors.length) {
                            e.preventDefault()
                            removeVariant("color", colors[colors.length - 1])
                          }
                        }}
                        placeholder={colors.length ? "اكتبي لونًا..." : "مثال: أسود"}
                        className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1.5 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addVariant("color")}
                        disabled={!colorInput.trim()}
                        className="shrink-0 rounded-lg bg-black px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        + إضافة
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">المقاسات <span className="font-normal text-gray-400">اختياري</span></label>
                    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 focus-within:border-black">
                      {sizes.map((size) => (
                        <span key={size} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs">
                          {size}
                          <button type="button" onClick={() => removeVariant("size", size)} className="text-gray-400 hover:text-red-500" aria-label={`حذف مقاس ${size}`}>
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value.replace(/,/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !sizeInput && sizes.length) {
                            e.preventDefault()
                            removeVariant("size", sizes[sizes.length - 1])
                          }
                        }}
                        placeholder={sizes.length ? "اكتبي مقاسًا..." : "مثال: 1"}
                        className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1.5 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addVariant("size")}
                        disabled={!sizeInput.trim()}
                        className="shrink-0 rounded-lg bg-black px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        + إضافة
                      </button>
                    </div>
                  </div>

                  {!hasVariants ? (
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="mb-3">
                        <p className="text-sm font-semibold">مخزون المنتج</p>
                        <p className="mt-1 text-xs text-gray-500">لو المنتج ليس له ألوان أو مقاسات، اكتبي عدد القطع الإجمالي هنا.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          required
                          min="0"
                          type="number"
                          value={form.stock}
                          onChange={(e) => setForm({ ...form, stock: e.target.value })}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                          placeholder="مثال: 20"
                        />
                        <span className="shrink-0 text-sm text-gray-500">قطعة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">عدد القطع لكل اختيار</p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            كل خانة تمثل اختيارًا مستقلًا. مثال: أسود + 2 = عدد القطع الموجودة من الأسود مقاس 2.
                          </p>
                        </div>
                        <div className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
                          الإجمالي: {total.toLocaleString("ar-EG")} قطعة
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full min-w-[300px] border-collapse text-sm">
                          {colors.length > 0 && sizes.length > 0 ? (
                            <>
                              <thead>
                                <tr className="bg-neutral-50">
                                  <th className="border-b border-l border-black/10 px-3 py-3 text-right font-medium">اللون / المقاس</th>
                                  {sizes.map((size) => (
                                    <th key={size} className="border-b border-l border-black/10 px-3 py-3 text-center font-medium">{size}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {colors.map((color) => (
                                  <tr key={color}>
                                    <th className="border-b border-l border-black/10 px-3 py-3 text-right font-medium">{color}</th>
                                    {sizes.map((size) => {
                                      const key = `${color}|${size}`
                                      const value = Number(form.variantStock[key] ?? 0)
                                      return (
                                        <td key={key} className="border-b border-black/10 p-2">
                                          <input
                                            type="number" min="0" inputMode="numeric" value={value}
                                            onChange={(e) => setForm({ ...form, variantStock: { ...form.variantStock, [key]: Math.max(0, Number(e.target.value || 0)) } })}
                                            className={`w-full rounded-lg border px-3 py-2.5 text-center font-semibold outline-none focus:border-black ${value === 0 ? "border-red-200 bg-red-50" : "border-black/10 bg-white"}`}
                                          />
                                          {value === 0 && <span className="mt-1 block text-center text-[10px] text-red-500">نفد</span>}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </>
                          ) : colors.length > 0 ? (
                            <>
                              <thead><tr className="bg-neutral-50"><th className="border-b border-l border-black/10 px-3 py-3 text-right font-medium">اللون</th><th className="border-b border-black/10 px-3 py-3 text-center font-medium">عدد القطع</th></tr></thead>
                              <tbody>{colors.map((color) => {
                                const key = `${color}|-`
                                const value = Number(form.variantStock[key] ?? 0)
                                return <tr key={color}><th className="border-b border-l border-black/10 px-3 py-3 text-right font-medium">{color}</th><td className="border-b border-black/10 p-2"><input type="number" min="0" inputMode="numeric" value={value} onChange={(e) => setForm({ ...form, variantStock: { ...form.variantStock, [key]: Math.max(0, Number(e.target.value || 0)) } })} className={`w-full rounded-lg border px-3 py-2.5 text-center font-semibold outline-none focus:border-black ${value === 0 ? "border-red-200 bg-red-50" : "border-black/10 bg-white"}`} />{value === 0 && <span className="mt-1 block text-center text-[10px] text-red-500">نفد</span>}</td></tr>
                              })}</tbody>
                            </>
                          ) : (
                            <>
                              <thead><tr className="bg-neutral-50"><th className="border-b border-l border-black/10 px-3 py-3 text-right font-medium">المقاس</th><th className="border-b border-black/10 px-3 py-3 text-center font-medium">عدد القطع</th></tr></thead>
                              <tbody>{sizes.map((size) => {
                                const key = `-|${size}`
                                const value = Number(form.variantStock[key] ?? 0)
                                return <tr key={size}><th className="border-b border-l border-black/10 px-3 py-3 text-right font-medium">{size}</th><td className="border-b border-black/10 p-2"><input type="number" min="0" inputMode="numeric" value={value} onChange={(e) => setForm({ ...form, variantStock: { ...form.variantStock, [key]: Math.max(0, Number(e.target.value || 0)) } })} className={`w-full rounded-lg border px-3 py-2.5 text-center font-semibold outline-none focus:border-black ${value === 0 ? "border-red-200 bg-red-50" : "border-black/10 bg-white"}`} />{value === 0 && <span className="mt-1 block text-center text-[10px] text-red-500">نفد</span>}</td></tr>
                              })}</tbody>
                            </>
                          )}
                        </table>
                      </div>

                      <div className="mt-4 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs leading-5 text-gray-500">
                        <strong className="text-gray-700">مثال:</strong> لو عندك 5 أسود مقاس 1 و8 أسود مقاس 2، اكتبي 5 و8 في الخانات. لو عميل اشترى أسود مقاس 2، المخزون يصبح 7 فقط.
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label className="text-xs text-gray-500">تنبيه عند وصول الإجمالي إلى</label>
                        <input
                          min="0"
                          type="number"
                          value={form.lowStockThreshold}
                          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                          className="w-24 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black"
                        />
                        <span className="text-xs text-gray-400">قطعة</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {step===4 && <div className="space-y-5"><div><label className="mb-1.5 block text-sm font-medium">الوصف</label><textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="اكتبي وصفًا مختصرًا وجذابًا للمنتج..." className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div><div className="rounded-2xl border border-black/10 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">جدول المقاسات <span className="font-normal text-gray-400">اختياري</span></p><div className="flex gap-2"><button type="button" onClick={addSizeChartColumn} className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs">+ عمود</button><button type="button" onClick={addSizeChartRow} className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs">+ صف</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-max border-collapse text-xs"><thead><tr>{form.sizeChartColumns.map((col,i)=><th key={i} className="p-1"><div className="flex items-center gap-1"><input value={col} onChange={e=>setColumnAt(i,e.target.value)} placeholder="اسم العمود" className="w-24 rounded-lg border border-black/10 px-2 py-1.5 outline-none"/>{form.sizeChartColumns.length>1&&<button type="button" onClick={()=>removeSizeChartColumn(i)} className="text-gray-400"><X size={13}/></button>}</div></th>)}</tr></thead><tbody>{form.sizeChartRows.map((row,ri)=><tr key={ri}>{row.map((cell,ci)=><td key={ci} className="p-1"><input value={cell} onChange={e=>setCellAt(ri,ci,e.target.value)} className="w-24 rounded-lg border border-black/10 px-2 py-1.5 outline-none"/></td>)}</tr>)}</tbody></table></div></div><div><label className="mb-1.5 block text-sm font-medium">تفاصيل الخامة <span className="font-normal text-gray-400">اختياري</span></label><textarea rows={2} value={form.materialDetails} onChange={e=>setForm({...form,materialDetails:e.target.value})} placeholder="مثال: قماش كريب فاخر" className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div><div><label className="mb-1.5 block text-sm font-medium">تعليمات العناية <span className="font-normal text-gray-400">اختياري</span></label><textarea rows={3} value={form.careInstructions} onChange={e=>setForm({...form,careInstructions:e.target.value})} placeholder="غسيل يدوي بماء بارد\nلا تستخدمي مبيض\nكوي على حرارة منخفضة" className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm outline-none"/></div><div className="rounded-2xl bg-neutral-50 p-4"><p className="mb-3 text-sm font-semibold">النشر</p><div className="grid gap-3 sm:grid-cols-3"><label className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> مميز</label><label className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm"><input type="checkbox" checked={form.bestSeller} onChange={e=>setForm({...form,bestSeller:e.target.checked})}/> الأكثر مبيعًا</label><label className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> ظاهر في المتجر</label></div></div><div className="rounded-2xl border border-dashed border-black/10 p-4"><p className="text-xs text-gray-500">مراجعة سريعة</p><div className="mt-2 grid grid-cols-3 gap-2 text-center"><div><strong className="block text-lg">{form.images.filter(Boolean).length}</strong><span className="text-[10px] text-gray-400">صور</span></div><div><strong className="block text-lg">{listFromText(form.colors).length}</strong><span className="text-[10px] text-gray-400">ألوان</span></div><div><strong className="block text-lg">{listFromText(form.sizes).length}</strong><span className="text-[10px] text-gray-400">مقاسات</span></div></div></div></div>}
          </div>

          <div className="shrink-0 border-t border-black/10 bg-white px-5 py-4 sm:px-6"><div className="flex gap-2">{step>1&&<button type="button" onClick={goBack} className="flex items-center justify-center gap-1 rounded-xl border border-black/10 px-4 py-3 text-sm"><ChevronRight size={16}/> السابق</button>}<button type="button" onClick={()=>setShowForm(false)} className="rounded-xl border border-black/10 px-4 py-3 text-sm">إلغاء</button>{step<4?<button type="button" onClick={goNext} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-black py-3 text-sm text-white">التالي <ChevronLeft size={16}/></button>:<button type="button" onClick={handleSave} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm text-white disabled:opacity-60"><Check size={16}/>{saving?"جارِ الحفظ...":form.id?"حفظ التعديلات":"حفظ المنتج"}</button>}</div></div>
        </div>
      </div>}
    </main>
  )
}