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
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("ملفات الصور فقط مسموحة"))
    }
    cb(null, true)
  },
})

const app = express()
const PORT = process.env.PORT || 4000
const ADMIN_USER = process.env.ADMIN_USER || "admin"
const ADMIN_PASS = process.env.ADMIN_PASS || "dahab123"

app.use(cors())
app.use(express.json())

const adminTokens = new Set()

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ success: false, message: "غير مصرح لك بهذا الإجراء" })
  }
  next()
}

function parseProduct(row) {
  return {
    ...row,
    oldPrice: row.old_price,
    colors: JSON.parse(row.colors || "[]"),
    sizes: JSON.parse(row.sizes || "[]"),
    featured: !!row.featured,
    bestSeller: !!row.best_seller,
    active: !!row.active,
  }
}

function slugify(name) {
  return (
    String(name).trim().toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `product-${Date.now()}`
  )
}

app.get("/", (req, res) => {
  res.json({ success: true, message: "Dahab Backend is running" })
})

// ---------- admin auth ----------

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {}
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" })
  }
  const token = crypto.randomBytes(24).toString("hex")
  adminTokens.add(token)
  res.json({ success: true, token })
})

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const token = (req.headers.authorization || "").slice(7)
  adminTokens.delete(token)
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
    const result = await db.execute({ sql: "SELECT * FROM products WHERE slug = ?", args: [req.params.slug] })
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
    const { name, category, price, oldPrice, image, badge, colors, sizes, description, featured, bestSeller, active } = req.body || {}
    if (!name || !category || price === undefined || !image) {
      return res.status(400).json({ success: false, message: "بيانات المنتج غير مكتملة" })
    }
    let slug = slugify(name)
    const exists = await db.execute({ sql: "SELECT id FROM products WHERE slug = ?", args: [slug] })
    if (exists.rows[0]) slug = `${slug}-${Date.now()}`
    const result = await db.execute({
      sql: `INSERT INTO products (slug,name,category,price,old_price,image,badge,colors,sizes,description,featured,best_seller,active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [slug, name, category, Number(price), oldPrice ? Number(oldPrice) : null, image, badge || null,
             JSON.stringify(colors || []), JSON.stringify(sizes || []), description || "",
             featured ? 1 : 0, bestSeller ? 1 : 0, active === false ? 0 : 1]
    })
    res.status(201).json({ success: true, id: result.lastInsertRowid, slug })
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
    const { name, category, price, oldPrice, image, badge, colors, sizes, description, featured, bestSeller, active } = req.body || {}
    await db.execute({
      sql: `UPDATE products SET name=?,category=?,price=?,old_price=?,image=?,badge=?,colors=?,sizes=?,description=?,featured=?,best_seller=?,active=? WHERE id=?`,
      args: [name ?? e.name, category ?? e.category,
             price !== undefined ? Number(price) : e.price,
             oldPrice !== undefined ? (oldPrice ? Number(oldPrice) : null) : e.old_price,
             image ?? e.image, badge !== undefined ? badge : e.badge,
             colors !== undefined ? JSON.stringify(colors) : e.colors,
             sizes !== undefined ? JSON.stringify(sizes) : e.sizes,
             description !== undefined ? description : e.description,
             featured !== undefined ? (featured ? 1 : 0) : e.featured,
             bestSeller !== undefined ? (bestSeller ? 1 : 0) : e.best_seller,
             active !== undefined ? (active ? 1 : 0) : e.active, id]
    })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تعديل المنتج" })
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

// ---------- orders ----------

app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM orders ORDER BY id DESC")
    res.json({ success: true, orders: result.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الطلبات" })
  }
})

app.post("/api/orders", async (req, res) => {
  try {
    const { customer_name, phone, governorate, area, address, notes, items, total } = req.body
    if (!customer_name || !phone || !governorate || !area || !address || !items || !Array.isArray(items) || items.length === 0 || total === undefined) {
      return res.status(400).json({ success: false, message: "بيانات الطلب غير مكتملة" })
    }

    let trackingCode = generateTrackingCode()
    while (true) {
      const check = await db.execute({ sql: "SELECT 1 FROM orders WHERE tracking_code = ?", args: [trackingCode] })
      if (!check.rows[0]) break
      trackingCode = generateTrackingCode()
    }

    const orderResult = await db.execute({
      sql: `INSERT INTO orders (customer_name,phone,governorate,area,address,notes,total,tracking_code) VALUES (?,?,?,?,?,?,?,?)`,
      args: [customer_name, phone, governorate, area, address, notes || "", Number(total), trackingCode]
    })
    const orderId = orderResult.lastInsertRowid

    for (const item of items) {
      await db.execute({
        sql: `INSERT INTO order_items (order_id,product_id,product_name,price,quantity,selected_color,selected_size) VALUES (?,?,?,?,?,?,?)`,
        args: [orderId, Number(item.product_id), item.product_name, Number(item.price), Number(item.quantity), item.selected_color || null, item.selected_size || null]
      })
    }

    res.status(201).json({ success: true, message: "تم إنشاء الطلب بنجاح", order_id: orderId, tracking_code: trackingCode })
  } catch (error) {
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
  try {
    const orderId = Number(req.params.id)
    const { status } = req.body
    const allowedStatuses = ["جديد","تم التأكيد","جاري التجهيز","تم الشحن","تم التسليم","ملغي"]
    if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "حالة الطلب غير صحيحة" })
    const result = await db.execute({ sql: "UPDATE orders SET status = ? WHERE id = ?", args: [status, orderId] })
    if (result.rowsAffected === 0) return res.status(404).json({ success: false, message: "الطلب غير موجود" })
    res.json({ success: true, message: "تم تحديث حالة الطلب" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث الطلب" })
  }
})

// ---------- contact messages ----------

app.post("/api/contact", async (req, res) => {
  try {
    const { name, phone, message } = req.body || {}
    if (!name || !phone || !message) return res.status(400).json({ success: false, message: "من فضلك أكملي كل الحقول" })
    const result = await db.execute({ sql: "INSERT INTO contact_messages (name,phone,message) VALUES (?,?,?)", args: [name, phone, message] })
    res.json({ success: true, id: result.lastInsertRowid })
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
