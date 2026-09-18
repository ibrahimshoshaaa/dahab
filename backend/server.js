const crypto = require("crypto")
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const multer = require("multer")
const { v2: cloudinary } = require("cloudinary")
const { db, generateTrackingCode, initDb } = require("./database")

// ---------- Cloudinary config ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("مسموح فقط بصور JPG وPNG وWebP"))
    }
    cb(null, true)
  },
})

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png"
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  return null
}

const app = express()
const PORT = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === "production"
const ADMIN_USER = process.env.ADMIN_USER
const ADMIN_PASS = process.env.ADMIN_PASS
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || (!isProduction ? "dev-only-secret" : null)

if (isProduction && (!ADMIN_USER || !ADMIN_PASS || !ADMIN_SESSION_SECRET)) {
  throw new Error("ADMIN_USER, ADMIN_PASS and ADMIN_SESSION_SECRET are required in production")
}
if (!isProduction && (!ADMIN_USER || !ADMIN_PASS)) {
  console.warn("WARNING: Using development admin credentials. Set ADMIN_USER and ADMIN_PASS.")
}

const allowedOrigins = String(process.env.FRONTEND_ORIGIN || (isProduction ? "" : "*")).split(",").map(s => s.trim()).filter(Boolean)
if (isProduction && allowedOrigins.length === 0) {
  throw new Error("FRONTEND_ORIGIN is required in production")
}
app.use(cors({
  origin: (origin, cb) => {
    if (!origin && !isProduction) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error("Origin not allowed"))
  },
  credentials: true,
}))
app.use(express.json({ limit: "1mb" }))
app.disable("x-powered-by")
app.set("trust proxy", 1)

const rateBuckets = new Map()
function rateLimit(key, limit, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown"
    const now = Date.now()
    const bucketKey = key + ":" + ip
    const old = rateBuckets.get(bucketKey)
    if (!old || now - old.started > windowMs) rateBuckets.set(bucketKey, { started: now, count: 1 })
    else {
      old.count += 1
      if (old.count > limit) return res.status(429).json({ success:false, message:"محاولات كثيرة، حاولي مرة أخرى بعد قليل" })
    }
    next()
  }
}
setInterval(() => {
  const cutoff=Date.now()-15*60*1000
  for (const [k,v] of rateBuckets) if(v.started<cutoff) rateBuckets.delete(k)
}, 5*60*1000).unref()

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000

function base64Url(value) {
  return Buffer.from(value).toString("base64url")
}

function signSession(payload) {
  const body = base64Url(JSON.stringify(payload))
  const signature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(body).digest("base64url")
  return body + "." + signature
}

function verifySession(token) {
  if (!token || !ADMIN_SESSION_SECRET) return null
  const parts = String(token).split(".")
  const body = parts[0], signature = parts[1]
  if (!body || !signature) return null
  const expected = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(body).digest("base64url")
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    if (!payload.exp || payload.exp <= Date.now() || payload.sub !== "admin") return null
    return payload
  } catch {
    return null
  }
}

function getCookie(req, name) {
  const header = String(req.headers.cookie || "")
  for (const part of header.split(";")) {
    const index = part.indexOf("=")
    if (index === -1) continue
    const key = part.slice(0, index).trim()
    if (key === name) return decodeURIComponent(part.slice(index + 1).trim())
  }
  return null
}

function setAdminCookie(res, token, maxAgeSeconds) {
  const parts = [
    "dahab-admin-session=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "Max-Age=" + maxAgeSeconds,
    isProduction ? "Secure" : "",
    isProduction ? "SameSite=None" : "SameSite=Lax",
  ].filter(Boolean)
  res.setHeader("Set-Cookie", parts.join("; "))
}

function clearAdminCookie(res) {
  const parts = [
    "dahab-admin-session=",
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    isProduction ? "Secure" : "",
    isProduction ? "SameSite=None" : "SameSite=Lax",
  ].filter(Boolean)
  res.setHeader("Set-Cookie", parts.join("; "))
}

function getAdminSession(req) {
  return verifySession(getCookie(req, "dahab-admin-session"))
}

function requireAdmin(req, res, next) {
  if (!getAdminSession(req)) {
    return res.status(401).json({ success: false, message: "غير مصرح لك بهذا الإجراء" })
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin
    if (isProduction && (!origin || !allowedOrigins.includes(origin))) {
      return res.status(403).json({ success: false, message: "مصدر الطلب غير مسموح" })
    }
  }

  next()
}

function safeJsonParse(value, fallback) {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function parseProduct(row) {
  const sizeChart = safeJsonParse(row.size_chart, null)
  const normalizedSizeChart =
    sizeChart && Array.isArray(sizeChart.columns) && Array.isArray(sizeChart.rows)
      ? sizeChart
      : null

  return {
    ...row,
    oldPrice: row.old_price,
    colors: safeJsonParse(row.colors, []),
    sizes: safeJsonParse(row.sizes, []),
    images: safeJsonParse(row.images, []),
    sizeChart: normalizedSizeChart,
    materialDetails: row.material_details || "",
    careInstructions: row.care_instructions || "",
    featured: !!row.featured,
    bestSeller: !!row.best_seller,
    active: !!row.active,
    stock: Number(row.stock ?? 0),
    lowStockThreshold: Number(row.low_stock_threshold ?? 5),
    variantStock: safeJsonParse(row.variant_stock, {}),
  }
}

function slugify(name) {
  const english = String(name).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return english || `product-${Date.now()}`
}

app.get("/", (req, res) => {
  res.json({ success: true, message: "Dahab Backend is running" })
})

// ---------- admin auth ----------

app.post("/api/admin/login", rateLimit("login", 8, 10*60*1000), (req, res) => {
  const { username, password } = req.body || {}
  const expectedUser = ADMIN_USER || "admin"
  const expectedPass = ADMIN_PASS || "dahab123"
  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" })
  }
  const token = signSession({ sub: "admin", exp: Date.now() + ADMIN_SESSION_TTL_MS, nonce: crypto.randomBytes(16).toString("hex") })
  setAdminCookie(res, token, Math.floor(ADMIN_SESSION_TTL_MS / 1000))
  res.json({ success: true })
})

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  clearAdminCookie(res)
  res.json({ success: true })
})

// ---------- products (public) ----------

app.get("/api/products", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM products WHERE active = 1 ORDER BY id DESC")
    res.json({ success: true, products: result.rows.map(parseProduct) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب المنتجات" })
  }
})

app.get("/api/products/:slug", async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT * FROM products WHERE slug = ? AND active = 1", args: [req.params.slug] })
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    res.json({ success: true, product: parseProduct(result.rows[0]) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب المنتج" })
  }
})

// ---------- products (admin) ----------

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM products ORDER BY id DESC")
    res.json({ success: true, products: result.rows.map(parseProduct) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب المنتجات" })
  }
})

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const {
      name, category, price, oldPrice, image, images, badge, colors, sizes, description,
      featured, bestSeller, active, sizeChart, materialDetails, careInstructions,
      stock, lowStockThreshold, variantStock,
    } = req.body || {}
    const imageList = Array.isArray(images) ? images.filter(Boolean) : []
    const mainImage = image || imageList[0]
    if (!name || String(name).trim().length > 200 || !["عبايات", "إكسسوارات"].includes(category) || !Number.isFinite(Number(price)) || Number(price) < 0 || !mainImage || typeof mainImage !== "string" || mainImage.length > 2000) {
      return res.status(400).json({ success: false, message: "بيانات المنتج غير مكتملة" })
    }
    let slug = slugify(name)
    const exists = await db.execute({ sql: "SELECT id FROM products WHERE slug = ?", args: [slug] })
    if (exists.rows[0]) slug = `${slug}-${Date.now()}`
    const result = await db.execute({
      sql: `INSERT INTO products (slug,name,category,price,old_price,image,images,badge,colors,sizes,description,featured,best_seller,active,size_chart,material_details,care_instructions,stock,low_stock_threshold,variant_stock)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [slug, name, category, Number(price), oldPrice ? Number(oldPrice) : null, mainImage,
             JSON.stringify(imageList.length ? imageList : [mainImage]), badge || null,
             JSON.stringify(colors || []), JSON.stringify(sizes || []), description || "",
             featured ? 1 : 0, bestSeller ? 1 : 0, active === false ? 0 : 1,
             JSON.stringify(sizeChart || {}), materialDetails || "", careInstructions || "",
             Math.max(0, Number(stock ?? 20)), Math.max(0, Number(lowStockThreshold ?? 5)),
             JSON.stringify(variantStock && typeof variantStock === "object" ? variantStock : {})]
    })
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid), slug })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إضافة المنتج" })
  }
})

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const ex = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] })
    if (!ex.rows[0]) return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    const e = ex.rows[0]
    const {
      name, slug, category, price, oldPrice, image, images, badge, colors, sizes, description,
      featured, bestSeller, active, sizeChart, materialDetails, careInstructions,
      stock, lowStockThreshold, variantStock,
    } = req.body || {}
    const imageList = Array.isArray(images) ? images.filter(Boolean) : undefined
    const mainImage = image ?? imageList?.[0]
    await db.execute({
      sql: `UPDATE products SET slug=?,name=?,category=?,price=?,old_price=?,image=?,images=?,badge=?,colors=?,sizes=?,description=?,featured=?,best_seller=?,active=?,size_chart=?,material_details=?,care_instructions=?,stock=?,low_stock_threshold=?,variant_stock=? WHERE id=?`,
      args: [slug ?? e.slug, name ?? e.name, category ?? e.category,
             price !== undefined ? Number(price) : e.price,
             oldPrice !== undefined ? (oldPrice ? Number(oldPrice) : null) : e.old_price,
             mainImage ?? e.image,
             imageList !== undefined ? JSON.stringify(imageList.length ? imageList : [mainImage ?? e.image]) : e.images,
             badge !== undefined ? badge : e.badge,
             colors !== undefined ? JSON.stringify(colors) : e.colors,
             sizes !== undefined ? JSON.stringify(sizes) : e.sizes,
             description !== undefined ? description : e.description,
             featured !== undefined ? (featured ? 1 : 0) : e.featured,
             bestSeller !== undefined ? (bestSeller ? 1 : 0) : e.best_seller,
             active !== undefined ? (active ? 1 : 0) : e.active,
             sizeChart !== undefined ? JSON.stringify(sizeChart) : e.size_chart,
             materialDetails !== undefined ? materialDetails : e.material_details,
             careInstructions !== undefined ? careInstructions : e.care_instructions,
             stock !== undefined ? Math.max(0, Number(stock)) : Number(e.stock ?? 0),
             lowStockThreshold !== undefined ? Math.max(0, Number(lowStockThreshold)) : Number(e.low_stock_threshold ?? 5),
             variantStock !== undefined ? JSON.stringify(variantStock && typeof variantStock === "object" ? variantStock : {}) : (e.variant_stock || "{}"),
             id]
    })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تعديل المنتج" })
  }
})

app.patch("/api/admin/products/:id/stock", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const stock = Number(req.body?.stock)
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: "الكمية يجب أن تكون رقمًا صحيحًا غير سالب" })
    }
    const result = await db.execute({
      sql: "UPDATE products SET stock = ? WHERE id = ?",
      args: [stock, id],
    })
    if (result.rowsAffected === 0) return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    res.json({ success: true, stock })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث المخزون" })
  }
})

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [Number(req.params.id)] })
    if (result.rowsAffected === 0) return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف المنتج" })
  }
})

// ---------- reviews ----------
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const productId = Number(req.params.id)
    if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ success:false, message:"معرف المنتج غير صحيح" })
    const result = await db.execute({ sql:"SELECT id,product_id,customer_name,rating,comment,created_at FROM product_reviews WHERE product_id=? AND status='approved' ORDER BY id DESC", args:[productId] })
    const rows = result.rows
    const average = rows.length ? rows.reduce((sum,r)=>sum+Number(r.rating),0)/rows.length : 0
    res.json({ success:true, reviews:rows, average, count:rows.length })
  } catch(error) { console.error(error); res.status(500).json({success:false,message:"تعذر جلب التقييمات"}) }
})
app.post("/api/products/:id/reviews", rateLimit("reviews", 12, 10*60*1000), async (req, res) => {
  try {
    const productId=Number(req.params.id), name=String(req.body?.customer_name||"").trim(), comment=String(req.body?.comment||"").trim(), rating=Number(req.body?.rating)
    if(!Number.isInteger(productId)||!name||name.length>80||!Number.isInteger(rating)||rating<1||rating>5||!comment||comment.length>500) return res.status(400).json({success:false,message:"من فضلك أدخل تقييمًا صحيحًا"})
    const product=await db.execute({sql:"SELECT id FROM products WHERE id=? AND active=1",args:[productId]}); if(!product.rows[0]) return res.status(404).json({success:false,message:"المنتج غير موجود"})
    await db.execute({sql:"INSERT INTO product_reviews(product_id,customer_name,rating,comment,status) VALUES(?,?,?,?,?)",args:[productId,name,rating,comment,"pending"]})
    res.status(201).json({success:true,message:"تم إرسال تقييمك للمراجعة"})
  } catch(error){console.error(error);res.status(500).json({success:false,message:"تعذر إرسال التقييم"})}
})
app.get("/api/admin/reviews", requireAdmin, async (req,res)=>{
  try { const result=await db.execute("SELECT r.*,p.name AS product_name FROM product_reviews r LEFT JOIN products p ON p.id=r.product_id ORDER BY r.id DESC"); res.json({success:true,reviews:result.rows}) }
  catch(error){console.error(error);res.status(500).json({success:false,message:"تعذر جلب التقييمات"})}
})
app.patch("/api/admin/reviews/:id", requireAdmin, async (req,res)=>{
  try { const status=String(req.body?.status||""); if(!["pending","approved","hidden"].includes(status)) return res.status(400).json({success:false,message:"الحالة غير صحيحة"}); const r=await db.execute({sql:"UPDATE product_reviews SET status=? WHERE id=?",args:[status,Number(req.params.id)]}); if(!r.rowsAffected)return res.status(404).json({success:false,message:"التقييم غير موجود"}); res.json({success:true}) }
  catch(error){console.error(error);res.status(500).json({success:false,message:"تعذر تحديث التقييم"})}
})
app.delete("/api/admin/reviews/:id", requireAdmin, async (req,res)=>{
  try { const r=await db.execute({sql:"DELETE FROM product_reviews WHERE id=?",args:[Number(req.params.id)]}); if(!r.rowsAffected)return res.status(404).json({success:false,message:"التقييم غير موجود"});res.json({success:true}) }
  catch(error){res.status(500).json({success:false,message:"تعذر حذف التقييم"})}
})

// ---------- analytics ----------
app.post("/api/analytics/events", rateLimit("analytics", 120, 60*1000), async (req,res)=>{
  try {
    const events=Array.isArray(req.body?.events)?req.body.events:[req.body]
    const allowed=new Set(["page_view","product_view","add_to_cart","begin_checkout","purchase"])
    for(const event of events.slice(0,20)){
      const type=String(event?.event_type||""); if(!allowed.has(type)) continue
      const productId=event?.product_id?Number(event.product_id):null
      await db.execute({sql:"INSERT INTO analytics_events(event_type,product_id,path,session_id,metadata) VALUES(?,?,?,?,?)",args:[type,Number.isInteger(productId)?productId:null,String(event?.path||"").slice(0,300),String(event?.session_id||"").slice(0,120),JSON.stringify(event?.metadata||{})]})
    }
    res.json({success:true})
  }catch(error){console.error(error);res.status(500).json({success:false,message:"تعذر تسجيل الإحصائية"})}
})
app.get("/api/admin/analytics", requireAdmin, async (req,res)=>{
  try {
    const days=Math.min(90,Math.max(1,Number(req.query?.days||30)))
    const modifier=`-${days} days`
    const events=await db.execute({sql:"SELECT event_type,product_id,path,session_id,created_at FROM analytics_events WHERE created_at>=datetime('now', ?) ORDER BY id DESC",args:[modifier]})
    const counts={page_view:0,product_view:0,add_to_cart:0,begin_checkout:0,purchase:0}
    for(const r of events.rows) counts[r.event_type]=(counts[r.event_type]||0)+1
    const uniqueSessions=new Set(events.rows.map(r=>r.session_id).filter(Boolean)).size
    const products=await db.execute({sql:"SELECT product_id,COUNT(*) AS views FROM analytics_events WHERE event_type='product_view' AND created_at>=datetime('now', ?) AND product_id IS NOT NULL GROUP BY product_id ORDER BY views DESC LIMIT 10",args:[modifier]})
    const ids=products.rows.map(r=>Number(r.product_id)); let names=[]
    if(ids.length){const rs=await db.execute(`SELECT id,name FROM products WHERE id IN (${ids.map(()=>'?').join(',')})`,ids); names=rs.rows}
    const nameMap=Object.fromEntries(names.map(r=>[Number(r.id),r.name]))
    res.json({success:true,days,counts,uniqueSessions,topProducts:products.rows.map(r=>({product_id:Number(r.product_id),name:nameMap[Number(r.product_id)]||"منتج",views:Number(r.views)}))})
  }catch(error){console.error(error);res.status(500).json({success:false,message:"تعذر جلب الإحصائيات"})}
})

// ---------- coupons ----------
function couponDiscount(coupon, subtotal, items = []) {
  if (!coupon || !coupon.active) return 0
  const now = Date.now()
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return 0
  if (Number(coupon.min_order || 0) > subtotal) return 0
  if (coupon.max_uses && Number(coupon.used_count || 0) >= Number(coupon.max_uses)) return 0
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) return 0
  if (Number(coupon.min_items || 0) > items.reduce((n,i)=>n+Number(i.quantity||0),0)) return 0
  if (coupon.product_id && !items.some(i=>Number(i.product_id)===Number(coupon.product_id))) return 0
  if (coupon.category && !items.some(i=>String(i.category||"")===String(coupon.category))) return 0
  const raw = coupon.type === "fixed" ? Number(coupon.value) : subtotal * Number(coupon.value) / 100
  const capped = coupon.max_discount ? Math.min(raw, Number(coupon.max_discount)) : raw
  return Math.max(0, Math.min(subtotal, capped))
}

app.post("/api/coupons/validate", rateLimit("coupon", 30, 60*1000), async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase()
    const subtotal = Number(req.body?.subtotal || 0)
    if (!code || !Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ success:false, message:"بيانات الكوبون غير صحيحة" })
    const result = await db.execute({ sql:"SELECT * FROM coupons WHERE code = ?", args:[code] })
    const coupon = result.rows[0]
    const discount = couponDiscount(coupon, subtotal, Array.isArray(req.body?.items) ? req.body.items : [])
    if (!coupon || discount <= 0) return res.status(400).json({ success:false, message:"الكوبون غير صالح أو لا ينطبق على هذا الطلب" })
    res.json({ success:true, coupon:{ code:coupon.code, type:coupon.type, value:coupon.value }, discount, total:Math.max(0, subtotal-discount) })
  } catch(error){ console.error(error); res.status(500).json({success:false,message:"حدث خطأ أثناء التحقق من الكوبون"}) }
})

app.get("/api/admin/coupons", requireAdmin, async (req,res)=>{
  try { const result=await db.execute("SELECT * FROM coupons ORDER BY id DESC"); res.json({success:true,coupons:result.rows}) }
  catch(error){ console.error(error); res.status(500).json({success:false,message:"تعذر جلب الكوبونات"}) }
})
app.post("/api/admin/coupons", requireAdmin, async (req,res)=>{
  try {
    const {code,type,value,minOrder,maxUses,expiresAt,startsAt,maxDiscount,minItems,productId,category,freeShipping,active}=req.body||{}
    const normalized=String(code||"").trim().toUpperCase()
    if(!normalized || !["percent","fixed"].includes(type) || !Number.isFinite(Number(value)) || Number(value)<0 || (type==="percent"&&Number(value)>100)) return res.status(400).json({success:false,message:"بيانات الكوبون غير صحيحة"})
    const r=await db.execute({sql:"INSERT INTO coupons(code,type,value,min_order,max_uses,expires_at,starts_at,max_discount,min_items,product_id,category,free_shipping,active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",args:[normalized,type,Number(value),Math.max(0,Number(minOrder||0)),Math.max(0,Number(maxUses||0)),expiresAt||null,startsAt||null,maxDiscount===""||maxDiscount==null?null:Math.max(0,Number(maxDiscount)),Math.max(0,Number(minItems||0)),productId?Number(productId):null,category||null,freeShipping?1:0,active===false?0:1]})
    res.status(201).json({success:true,id:Number(r.lastInsertRowid)})
  } catch(error){ console.error(error); res.status(400).json({success:false,message:error.message?.includes("UNIQUE")?"كود الكوبون مستخدم بالفعل":"تعذر إنشاء الكوبون"}) }
})
app.put("/api/admin/coupons/:id", requireAdmin, async (req,res)=>{
  try {
    const id=Number(req.params.id), ex=await db.execute({sql:"SELECT * FROM coupons WHERE id=?",args:[id]}); if(!ex.rows[0]) return res.status(404).json({success:false,message:"الكوبون غير موجود"})
    const old=ex.rows[0], b=req.body||{}, type=b.type??old.type, value=b.value!==undefined?Number(b.value):Number(old.value)
    if(!["percent","fixed"].includes(type)||value<0||(type==="percent"&&value>100)) return res.status(400).json({success:false,message:"بيانات الكوبون غير صحيحة"})
    await db.execute({sql:"UPDATE coupons SET code=?,type=?,value=?,min_order=?,max_uses=?,expires_at=?,starts_at=?,max_discount=?,min_items=?,product_id=?,category=?,free_shipping=?,active=? WHERE id=?",args:[String(b.code??old.code).trim().toUpperCase(),type,value,Math.max(0,Number(b.minOrder??old.min_order)),Math.max(0,Number(b.maxUses??old.max_uses)),b.expiresAt===undefined?old.expires_at:(b.expiresAt||null),b.startsAt===undefined?old.starts_at:(b.startsAt||null),b.maxDiscount===undefined?old.max_discount:(b.maxDiscount===""||b.maxDiscount==null?null:Math.max(0,Number(b.maxDiscount))),Math.max(0,Number(b.minItems??old.min_items)),b.productId===undefined?old.product_id:(b.productId?Number(b.productId):null),b.category===undefined?old.category:(b.category||null),b.freeShipping===undefined?old.free_shipping:(b.freeShipping?1:0),b.active===undefined?old.active:(b.active?1:0),id]})
    res.json({success:true})
  } catch(error){ console.error(error); res.status(400).json({success:false,message:"تعذر تعديل الكوبون"}) }
})
app.delete("/api/admin/coupons/:id", requireAdmin, async (req,res)=>{ try { const r=await db.execute({sql:"DELETE FROM coupons WHERE id=?",args:[Number(req.params.id)]}); if(!r.rowsAffected)return res.status(404).json({success:false,message:"الكوبون غير موجود"});res.json({success:true}) }catch(error){res.status(500).json({success:false,message:"تعذر حذف الكوبون"})} })

// ---------- orders ----------

app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM orders ORDER BY id DESC")
    const orders = result.rows
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.execute({ sql: "SELECT * FROM order_items WHERE order_id = ?", args: [order.id] })
        return { ...order, items: items.rows }
      })
    )
    res.json({ success: true, orders: ordersWithItems })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الطلبات" })
  }
})

app.post("/api/orders", rateLimit("orders", 20, 10*60*1000), async (req, res) => {
  let tx = null
  try {
    const { customer_name, phone, governorate, area, address, notes, items, total, coupon_code, idempotency_key } = req.body || {}
    if (!customer_name || !phone || !governorate || !area || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "بيانات الطلب غير مكتملة" })
    }

    const normalizedPhone = String(phone).replace(/\s|-/g, "")
    if (!/^(01[0125]\d{8}|\+?20[0125]1\d{8})$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "رقم الهاتف غير صحيح" })
    }

    const requestKey = String(idempotency_key || "").trim()
    if (requestKey && requestKey.length > 120) {
      return res.status(400).json({ success: false, message: "مفتاح الطلب غير صحيح" })
    }

    if (requestKey) {
      const existing = await db.execute({
        sql: "SELECT id,tracking_code,total,discount FROM orders WHERE idempotency_key = ?",
        args: [requestKey],
      })
      if (existing.rows[0]) {
        const row = existing.rows[0]
        return res.status(200).json({
          success: true,
          message: "تم إنشاء الطلب مسبقًا",
          order_id: Number(row.id),
          tracking_code: row.tracking_code,
          discount: Number(row.discount || 0),
          total: Number(row.total || 0),
        })
      }
    }

    const quantities = new Map()
    for (const item of items) {
      const productId = Number(item.product_id)
      const quantity = Math.floor(Number(item.quantity))
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        return res.status(400).json({ success: false, message: "بيانات المنتجات غير صحيحة" })
      }
      quantities.set(productId, (quantities.get(productId) || 0) + quantity)
    }

    tx = await db.transaction("write")

    const normalizedItems = []
    for (const [productId, quantity] of quantities) {
      const pr = await tx.execute({
        sql: "SELECT id,name,category,price,stock,active,variant_stock FROM products WHERE id = ?",
        args: [productId],
      })
      const product = pr.rows[0]
      if (!product || !product.active) throw Object.assign(new Error("أحد المنتجات لم يعد متاحًا"), { statusCode: 400 })

      const variantStock = safeJsonParse(product.variant_stock, {})
      const matching = items.filter((item) => Number(item.product_id) === productId)
      const requestedVariants = new Map()

      for (const item of matching) {
        const key = `${item.selected_color || "-"}|${item.selected_size || "-"}`
        requestedVariants.set(key, (requestedVariants.get(key) || 0) + Math.floor(Number(item.quantity)))
      }

      if (Object.keys(variantStock).length) {
        for (const [key, qty] of requestedVariants) {
          const available = Number(variantStock[key] ?? 0)
          if (available < qty) {
            throw Object.assign(
              new Error(`الكمية غير متوفرة من ${product.name} (${key.replace("|", " / ")}). المتاح: ${available}`),
              { statusCode: 400 }
            )
          }
        }
      } else if (Number(product.stock || 0) < quantity) {
        throw Object.assign(
          new Error(`الكمية غير متوفرة من ${product.name}. المتاح: ${Number(product.stock || 0)}`),
          { statusCode: 400 }
        )
      }

      for (const item of matching) {
        normalizedItems.push({
          product_id: productId,
          product_name: product.name,
          price: Number(product.price),
          quantity: Math.floor(Number(item.quantity)),
          selected_color: item.selected_color || null,
          selected_size: item.selected_size || null,
          category: product.category,
        })
      }
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let discount = 0
    let coupon = null

    if (coupon_code) {
      const cr = await tx.execute({
        sql: "SELECT * FROM coupons WHERE code = ?",
        args: [String(coupon_code).trim().toUpperCase()],
      })
      coupon = cr.rows[0]
      discount = couponDiscount(coupon, subtotal, normalizedItems)
      if (!coupon || discount <= 0) {
        throw Object.assign(new Error("الكوبون غير صالح أو انتهت صلاحيته"), { statusCode: 400 })
      }
    }

    const finalTotal = Math.max(0, subtotal - discount)
    if (total !== undefined && (!Number.isFinite(Number(total)) || Math.abs(Number(total) - finalTotal) > 0.01)) {
      throw Object.assign(new Error("تغيرت أسعار المنتجات، أعد مراجعة السلة ثم حاول مرة أخرى"), { statusCode: 400 })
    }

    let trackingCode = generateTrackingCode()
    for (;;) {
      const check = await tx.execute({ sql: "SELECT 1 FROM orders WHERE tracking_code = ?", args: [trackingCode] })
      if (!check.rows[0]) break
      trackingCode = generateTrackingCode()
    }

    const orderResult = await tx.execute({
      sql: `INSERT INTO orders (customer_name,phone,governorate,area,address,notes,total,status,tracking_code,coupon_code,discount,idempotency_key)
            VALUES (?,?,?,?,?,?,?,'جديد',?,?,?,?)`,
      args: [
        customer_name,
        normalizedPhone,
        governorate,
        area,
        address,
        notes || "",
        finalTotal,
        trackingCode,
        coupon ? coupon.code : null,
        discount,
        requestKey || null,
      ],
    })
    const orderId = Number(orderResult.lastInsertRowid)

    for (const item of normalizedItems) {
      await tx.execute({
        sql: `INSERT INTO order_items (order_id,product_id,product_name,price,quantity,selected_color,selected_size)
              VALUES (?,?,?,?,?,?,?)`,
        args: [orderId, item.product_id, item.product_name, item.price, item.quantity, item.selected_color, item.selected_size],
      })
    }

    for (const [productId, quantity] of quantities) {
      const current = await tx.execute({
        sql: "SELECT stock,variant_stock FROM products WHERE id=?",
        args: [productId],
      })
      const row = current.rows[0]
      const variantStock = safeJsonParse(row?.variant_stock, {})

      if (Object.keys(variantStock).length) {
        const matching = normalizedItems.filter((i) => i.product_id === productId)
        for (const item of matching) {
          const key = `${item.selected_color || "-"}|${item.selected_size || "-"}`
          const qty = Number(item.quantity)
          const available = Number(variantStock[key] || 0)
          if (available < qty) {
            throw Object.assign(new Error("تغير المخزون أثناء إتمام الطلب، راجعي السلة وحاولي مرة أخرى"), { statusCode: 409 })
          }
          variantStock[key] = available - qty
        }
        const updated = await tx.execute({
          sql: "UPDATE products SET stock=stock-?,variant_stock=? WHERE id=? AND stock>=?",
          args: [quantity, JSON.stringify(variantStock), productId, quantity],
        })
        if (updated.rowsAffected !== 1) {
          throw Object.assign(new Error("تغير المخزون أثناء إتمام الطلب، راجعي السلة وحاولي مرة أخرى"), { statusCode: 409 })
        }
      } else {
        const updated = await tx.execute({
          sql: "UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
          args: [quantity, productId, quantity],
        })
        if (updated.rowsAffected !== 1) {
          throw Object.assign(new Error("تغير المخزون أثناء إتمام الطلب، راجعي السلة وحاولي مرة أخرى"), { statusCode: 409 })
        }
      }
    }

    if (coupon) {
      const used = await tx.execute({
        sql: "UPDATE coupons SET used_count=used_count+1 WHERE id=? AND (max_uses=0 OR used_count < max_uses)",
        args: [coupon.id],
      })
      if (used.rowsAffected !== 1) {
        throw Object.assign(new Error("انتهى عدد استخدامات هذا الكوبون، حاولي مرة أخرى"), { statusCode: 409 })
      }
    }

    await tx.execute({
      sql: "INSERT INTO analytics_events(event_type,path,session_id,metadata) VALUES(?,?,?,?)",
      args: ["purchase", "/checkout", null, JSON.stringify({ order_id: orderId, total: finalTotal })],
    }).catch(() => {})

    await tx.commit()
    tx = null

    res.status(201).json({
      success: true,
      message: "تم إنشاء الطلب بنجاح",
      order_id: orderId,
      tracking_code: trackingCode,
      discount,
      total: finalTotal,
    })
  } catch (error) {
    if (tx) {
      try { await tx.rollback() } catch {}
    }
    const status = Number(error?.statusCode) || 500
    if (status < 500) return res.status(status).json({ success: false, message: error.message })
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إنشاء الطلب" })
  }
})
app.get("/api/orders/track/:code", async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase()
    const result = await db.execute({ sql: "SELECT * FROM orders WHERE tracking_code = ?", args: [code] })
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "لم يتم العثور على طلب بهذا الكود" })
    const order = result.rows[0]
    const items = await db.execute({ sql: "SELECT * FROM order_items WHERE order_id = ?", args: [order.id] })
    res.json({ success: true, order: { id: order.id, status: order.status, total: order.total, customer_name: order.customer_name, created_at: order.created_at }, items: items.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ" })
  }
})

app.get("/api/orders/:id", requireAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const result = await db.execute({ sql: "SELECT * FROM orders WHERE id = ?", args: [orderId] })
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "الطلب غير موجود" })
    const items = await db.execute({ sql: "SELECT * FROM order_items WHERE order_id = ?", args: [orderId] })
    res.json({ success: true, order: result.rows[0], items: items.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ" })
  }
})

app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {
  let tx = null
  try {
    const orderId = Number(req.params.id)
    const { status } = req.body
    const allowedStatuses = ["جديد","تم التأكيد","جاري التجهيز","تم الشحن","تم التسليم","ملغي"]
    if (!Number.isInteger(orderId) || orderId <= 0 || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "بيانات الحالة غير صحيحة" })
    }

    tx = await db.transaction("write")
    const orderResult = await tx.execute({ sql: "SELECT * FROM orders WHERE id = ?", args: [orderId] })
    const order = orderResult.rows[0]
    if (!order) {
      await tx.rollback()
      tx = null
      return res.status(404).json({ success: false, message: "الطلب غير موجود" })
    }

    if (order.status === status) {
      await tx.rollback()
      tx = null
      return res.json({ success: true, message: "حالة الطلب لم تتغير" })
    }

    const wasCancelled = order.status === "ملغي"
    const willBeCancelled = status === "ملغي"

    if (wasCancelled !== willBeCancelled) {
      const items = await tx.execute({
        sql: "SELECT product_id,quantity,selected_color,selected_size FROM order_items WHERE order_id = ?",
        args: [orderId],
      })

      const grouped = new Map()
      for (const item of items.rows) {
        const productId = Number(item.product_id)
        const qty = Number(item.quantity)
        const key = `${item.selected_color || "-"}|${item.selected_size || "-"}`
        const entry = grouped.get(productId) || []
        entry.push({ qty, key })
        grouped.set(productId, entry)
      }

      for (const [productId, lines] of grouped) {
        const productResult = await tx.execute({
          sql: "SELECT stock,variant_stock FROM products WHERE id = ?",
          args: [productId],
        })
        const product = productResult.rows[0]
        if (!product) throw Object.assign(new Error("أحد منتجات الطلب لم يعد موجودًا"), { statusCode: 409 })

        const variantStock = safeJsonParse(product.variant_stock, {})
        const totalQty = lines.reduce((sum, line) => sum + line.qty, 0)

        if (willBeCancelled) {
          if (Object.keys(variantStock).length) {
            for (const line of lines) variantStock[line.key] = Number(variantStock[line.key] || 0) + line.qty
            await tx.execute({
              sql: "UPDATE products SET stock=stock+?,variant_stock=? WHERE id=?",
              args: [totalQty, JSON.stringify(variantStock), productId],
            })
          } else {
            await tx.execute({
              sql: "UPDATE products SET stock=stock+? WHERE id=?",
              args: [totalQty, productId],
            })
          }
        } else {
          if (Object.keys(variantStock).length) {
            for (const line of lines) {
              const available = Number(variantStock[line.key] || 0)
              if (available < line.qty) throw Object.assign(new Error("لا يوجد مخزون كافٍ لإعادة فتح الطلب"), { statusCode: 409 })
              variantStock[line.key] = available - line.qty
            }
            const updated = await tx.execute({
              sql: "UPDATE products SET stock=stock-?,variant_stock=? WHERE id=? AND stock>=?",
              args: [totalQty, JSON.stringify(variantStock), productId, totalQty],
            })
            if (updated.rowsAffected !== 1) throw Object.assign(new Error("لا يوجد مخزون كافٍ لإعادة فتح الطلب"), { statusCode: 409 })
          } else {
            const updated = await tx.execute({
              sql: "UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
              args: [totalQty, productId, totalQty],
            })
            if (updated.rowsAffected !== 1) throw Object.assign(new Error("لا يوجد مخزون كافٍ لإعادة فتح الطلب"), { statusCode: 409 })
          }
        }
      }
    }

    await tx.execute({ sql: "UPDATE orders SET status = ? WHERE id = ?", args: [status, orderId] })
    await tx.commit()
    tx = null
    res.json({ success: true, message: "تم تحديث حالة الطلب" })
  } catch (error) {
    if (tx) {
      try { await tx.rollback() } catch {}
    }
    const status = Number(error?.statusCode) || 500
    if (status < 500) return res.status(status).json({ success: false, message: error.message })
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث الطلب" })
  }
})

// ---------- admin customers ----------

app.get("/api/admin/customers", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM orders ORDER BY id DESC")
    const map = new Map()

    for (const order of result.rows) {
      const phone = String(order.phone || "").trim()
      if (!phone) continue
      const existing = map.get(phone)
      if (!existing) {
        map.set(phone, {
          customer_name: order.customer_name,
          phone,
          governorate: order.governorate,
          area: order.area,
          address: order.address,
          orders_count: 1,
          total_spent: order.status === "ملغي" ? 0 : Number(order.total || 0),
          last_order_at: order.created_at,
          first_order_at: order.created_at,
        })
      } else {
        existing.orders_count += 1
        if (order.status !== "ملغي") existing.total_spent += Number(order.total || 0)
        if (new Date(order.created_at).getTime() < new Date(existing.first_order_at).getTime()) {
          existing.first_order_at = order.created_at
        }
      }
    }

    const customers = Array.from(map.values()).sort(
      (a, b) => new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime()
    )
    res.json({ success: true, customers })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب العملاء" })
  }
})

app.get("/api/admin/customers/:phone/orders", requireAdmin, async (req, res) => {
  try {
    const phone = String(req.params.phone || "").trim()
    if (!phone) return res.status(400).json({ success: false, message: "رقم الهاتف غير صحيح" })

    const result = await db.execute({
      sql: "SELECT * FROM orders WHERE phone = ? ORDER BY id DESC",
      args: [phone],
    })

    const orders = await Promise.all(
      result.rows.map(async (order) => {
        const items = await db.execute({
          sql: "SELECT * FROM order_items WHERE order_id = ?",
          args: [order.id],
        })
        return { ...order, items: items.rows }
      })
    )

    res.json({ success: true, orders })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب طلبات العميل" })
  }
})

// ---------- contact messages ----------

app.post("/api/contact", rateLimit("contact", 10, 10*60*1000), async (req, res) => {
  try {
    const { name, phone, message } = req.body || {}
    if (!name || !phone || !message) return res.status(400).json({ success: false, message: "من فضلك أكملي كل الحقول" })
    const result = await db.execute({ sql: "INSERT INTO contact_messages (name,phone,message) VALUES (?,?,?)", args: [name, phone, message] })
    res.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إرسال الرسالة" })
  }
})

app.get("/api/admin/contact-messages", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM contact_messages ORDER BY id DESC")
    res.json({ success: true, messages: result.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الرسائل" })
  }
})

app.patch("/api/admin/contact-messages/:id/read", requireAdmin, async (req, res) => {
  try {
    await db.execute({ sql: "UPDATE contact_messages SET is_read = 1 WHERE id = ?", args: [req.params.id] })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء التحديث" })
  }
})

app.delete("/api/admin/contact-messages/:id", requireAdmin, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM contact_messages WHERE id = ?", args: [req.params.id] })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الحذف" })
  }
})

// ---------- settings ----------

app.get("/api/settings", async (req, res) => {
  try {
    const result = await db.execute("SELECT key, value FROM settings")
    const settings = Object.fromEntries(result.rows.map((r) => [r.key, r.value]))
    res.json({ success: true, settings })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الإعدادات" })
  }
})

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const updates = req.body || {}
    for (const [key, value] of Object.entries(updates)) {
      await db.execute({
        sql: "INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        args: [key, String(value)]
      })
    }
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ الإعدادات" })
  }
})

// ---------- image upload ----------

app.post("/api/admin/upload", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "لم يتم إرسال صورة" })
    const detectedType = detectImageType(req.file.buffer)
    if (!detectedType || detectedType !== req.file.mimetype) {
      return res.status(400).json({ success: false, message: "نوع ملف الصورة غير صالح" })
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(500).json({ success: false, message: "Cloudinary غير مُعدّ" })
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "dahab-store", resource_type: "image" },
        (error, result) => { if (error) reject(error); else resolve(result) }
      )
      stream.end(req.file.buffer)
    })
    res.json({ success: true, url: result.secure_url })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({ success: false, message: "فشل رفع الصورة: " + error.message })
  }
})

// ---------- start ----------

initDb().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dahab Backend running on http://localhost:${PORT}`)
  })
}).catch((err) => {
  console.error("Failed to init DB:", err)
  process.exit(1)
})
