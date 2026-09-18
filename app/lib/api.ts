import { products as mockProducts, type Product } from "../data/products"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:4000" : (() => {
    throw new Error("NEXT_PUBLIC_API_URL is required in production")
  })())

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
  } catch (error) {
    if (process.env.NODE_ENV !== "production") return mockProducts
    throw error instanceof Error ? error : new Error("تعذر الاتصال بالخادم")
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
  } catch (error) {
    if (process.env.NODE_ENV !== "production") return mockProducts.find((product) => product.slug === slug)
    throw error instanceof Error ? error : new Error("تعذر الاتصال بالخادم")
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
  coupon_code?: string
  idempotency_key?: string
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
    discount: Number(data.discount || 0),
    total: Number(data.total || 0),
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

export function getAdminToken() {
  return null
}

export function setAdminToken(_token: string) {}

export function clearAdminToken() {}

async function adminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
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
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "بيانات الدخول غير صحيحة")
  }

  return true
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

export async function updateProductStock(id: number, stock: number) {
  return adminFetch(`/api/admin/products/${id}/stock`, {
    method: "PATCH",
    body: JSON.stringify({ stock }),
  })
}

// ---------- admin customers ----------

export type AdminCustomer = {
  customer_name: string
  phone: string
  governorate: string
  area: string
  address: string
  orders_count: number
  total_spent: number
  last_order_at: string
  first_order_at: string
}

export async function fetchAdminCustomers() {
  const data = await adminFetch("/api/admin/customers")
  return data.customers as AdminCustomer[]
}

export async function fetchCustomerOrders(phone: string) {
  const data = await adminFetch(`/api/admin/customers/${encodeURIComponent(phone)}/orders`)
  return data.orders as Record<string, unknown>[]
}

// ---------- coupons ----------
export type AdminCoupon = { id:number; code:string; type:"percent"|"fixed"; value:number; min_order:number; max_uses:number; used_count:number; expires_at:string|null; starts_at:string|null; max_discount:number|null; min_items:number; product_id:number|null; category:string|null; free_shipping:number; active:number }
export async function fetchAdminCoupons(){const data=await adminFetch("/api/admin/coupons");return data.coupons as AdminCoupon[]}
export async function createCoupon(payload:Record<string,unknown>){return adminFetch("/api/admin/coupons",{method:"POST",body:JSON.stringify(payload)})}
export async function updateCoupon(id:number,payload:Record<string,unknown>){return adminFetch(`/api/admin/coupons/${id}`,{method:"PUT",body:JSON.stringify(payload)})}
export async function deleteCoupon(id:number){return adminFetch(`/api/admin/coupons/${id}`,{method:"DELETE"})}
export async function validateCoupon(code:string,subtotal:number,items?:{product_id:number;quantity:number;category?:string}[]){const res=await fetch(`${API_URL}/api/coupons/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,subtotal,items})});const data=await res.json();if(!res.ok||!data.success)throw new Error(data.message||"الكوبون غير صالح");return data as {coupon:{code:string;type:string;value:number};discount:number;total:number}}

// ---------- reviews ----------
export type ProductReview = { id:number; product_id:number; customer_name:string; rating:number; comment:string; status?:string; created_at:string }
export async function fetchProductReviews(productId:number){const res=await fetch(`${API_URL}/api/products/${productId}/reviews`,{cache:"no-store"});const data=await res.json();if(!res.ok||!data.success)throw new Error(data.message||"تعذر جلب التقييمات");return data as {reviews:ProductReview[];average:number;count:number}}
export async function submitProductReview(productId:number,payload:{customer_name:string;rating:number;comment:string}){const res=await fetch(`${API_URL}/api/products/${productId}/reviews`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok||!data.success)throw new Error(data.message||"تعذر إرسال التقييم");return data}
export async function fetchAdminReviews(){const data=await adminFetch("/api/admin/reviews");return data.reviews as ProductReview[] & {product_name:string}[]}
export async function updateReviewStatus(id:number,status:"pending"|"approved"|"hidden"){return adminFetch(`/api/admin/reviews/${id}`,{method:"PATCH",body:JSON.stringify({status})})}
export async function deleteReview(id:number){return adminFetch(`/api/admin/reviews/${id}`,{method:"DELETE"})}

// ---------- analytics ----------
export async function trackEvent(event:{event_type:"page_view"|"product_view"|"add_to_cart"|"begin_checkout"|"purchase";product_id?:number;path?:string;metadata?:Record<string,unknown>}){try{let sid=typeof window!=="undefined"?localStorage.getItem("dahab-session-id"):null;if(!sid&&typeof window!=="undefined"){sid=crypto.randomUUID();localStorage.setItem("dahab-session-id",sid)};await fetch(`${API_URL}/api/analytics/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...event,session_id:sid})})}catch{}}
export type AnalyticsSummary={days:number;counts:Record<string,number>;uniqueSessions:number;topProducts:{product_id:number;name:string;views:number}[]}
export async function fetchAnalytics(days:number){const data=await adminFetch(`/api/admin/analytics?days=${days}`);return data as AnalyticsSummary}

// ---------- settings ----------

export type SiteSettings = Record<string, string>

export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, { cache: "no-store" })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.settings as SiteSettings
  } catch (error) {
    if (process.env.NODE_ENV !== "production") return {}
    throw error instanceof Error ? error : new Error("تعذر تحميل إعدادات الموقع")
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

  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: "POST",
    credentials: "include",
    headers: {},
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
