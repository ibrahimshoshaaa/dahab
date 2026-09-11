import { products as mockProducts, type Product } from "../data/products"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export type ApiProduct = Product & {
  id: number
  active?: boolean
}

// ---------- public: products ----------

export async function fetchProducts(): Promise<ApiProduct[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" })
    const data = await res.json()

    if (!data.success) throw new Error(data.message)

    return data.products
  } catch {
    // Backend not reachable yet — fall back to local mock data so the
    // storefront stays demoable even without the Express server running.
    return mockProducts
  }
}

export async function fetchProductBySlug(
  slug: string
): Promise<ApiProduct | undefined> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, {
      cache: "no-store",
    })
    const data = await res.json()

    if (!data.success) throw new Error(data.message)

    return data.product
  } catch {
    return mockProducts.find((product) => product.slug === slug)
  }
}

// ---------- public: orders ----------

export type OrderPayload = {
  customer_name: string
  phone: string
  governorate: string
  area: string
  address: string
  notes?: string
  total: number
  items: {
    product_id: number
    product_name: string
    price: number
    quantity: number
    selected_color?: string
    selected_size?: string
  }[]
}

export async function createOrder(payload: OrderPayload) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "تعذر إتمام الطلب")
  }

  return {
    orderId: data.order_id as number,
    trackingCode: data.tracking_code as string,
  }
}

// Public tracking uses the unguessable tracking code — NOT the order id.
// (The old /api/orders/:id endpoint is now admin-only.)
export async function fetchOrderByCode(code: string) {
  const res = await fetch(
    `${API_URL}/api/orders/track/${encodeURIComponent(code.trim().toUpperCase())}`,
    { cache: "no-store" }
  )
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "الطلب غير موجود")
  }

  return data as { order: Record<string, unknown>; items: Record<string, unknown>[] }
}

// ---------- admin ----------

const TOKEN_KEY = "dahab-admin-token"

export function getAdminToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "حدث خطأ")
  }

  return data
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "بيانات الدخول غير صحيحة")
  }

  setAdminToken(data.token)
  return data.token as string
}

export function adminLogout() {
  adminFetch("/api/admin/logout", { method: "POST" }).catch(() => {})
  clearAdminToken()
}

export async function fetchAdminOrders() {
  const data = await adminFetch("/api/orders")
  return data.orders as Record<string, unknown>[]
}

export async function updateOrderStatus(id: number, status: string) {
  return adminFetch(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function fetchAdminProducts() {
  const data = await adminFetch("/api/admin/products")
  return data.products as ApiProduct[]
}

export async function createProduct(payload: Partial<ApiProduct>) {
  return adminFetch("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateProduct(id: number, payload: Partial<ApiProduct>) {
  return adminFetch(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteProduct(id: number) {
  return adminFetch(`/api/admin/products/${id}`, { method: "DELETE" })
}

// ---------- settings ----------

export type SiteSettings = Record<string, string>

export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, { cache: "no-store" })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.settings as SiteSettings
  } catch {
    return {}
  }
}

export async function updateSettings(payload: SiteSettings) {
  return adminFetch("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

// ---------- image upload ----------

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)

  const token = getAdminToken()
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "فشل رفع الصورة")
  }

  return data.url as string
}

// ---------- contact messages ----------

export type ContactMessage = {
  id: number
  name: string
  phone: string
  message: string
  is_read: number
  created_at: string
}

export async function submitContactMessage(payload: {
  name: string
  phone: string
  message: string
}) {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "تعذر إرسال الرسالة")
  }

  return data.id as number
}

export async function fetchContactMessages() {
  const data = await adminFetch("/api/admin/contact-messages")
  return data.messages as ContactMessage[]
}

export async function markContactMessageRead(id: number) {
  return adminFetch(`/api/admin/contact-messages/${id}/read`, {
    method: "PATCH",
  })
}

export async function deleteContactMessage(id: number) {
  return adminFetch(`/api/admin/contact-messages/${id}`, {
    method: "DELETE",
  })
}
