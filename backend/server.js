const crypto = require("crypto")
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const multer = require("multer")
const { v2: cloudinary } = require("cloudinary")
const db = require("./database")
const { generateTrackingCode } = require("./database")

// ---------- Cloudinary config ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// multer: store upload in memory (no disk temp file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
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

// ---------- very simple in-memory admin sessions ----------
// Demo-level auth: tokens live only in server memory and reset on restart.
// Good enough for a single-admin dashboard; swap for real sessions/JWT later.
const adminTokens = new Set()

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "غير مصرح لك بهذا الإجراء",
    })
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

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dahab Backend is running",
  })
})

// ---------- admin auth ----------

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {}

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({
      success: false,
      message: "بيانات الدخول غير صحيحة",
    })
  }

  const token = crypto.randomBytes(24).toString("hex")
  adminTokens.add(token)

  res.json({
    success: true,
    token,
  })
})

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const header = req.headers.authorization || ""
  const token = header.slice(7)
  adminTokens.delete(token)

  res.json({ success: true })
})

// ---------- products (public) ----------

app.get("/api/products", (req, res) => {
  try {
    const products = db
      .prepare("SELECT * FROM products WHERE active = 1 ORDER BY id DESC")
      .all()
      .map(parseProduct)

    res.json({ success: true, products })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب المنتجات" })
  }
})

app.get("/api/products/:slug", (req, res) => {
  try {
    const row = db
      .prepare("SELECT * FROM products WHERE slug = ?")
      .get(req.params.slug)

    if (!row) {
      return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    }

    res.json({ success: true, product: parseProduct(row) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب المنتج" })
  }
})

// ---------- products (admin) ----------

app.get("/api/admin/products", requireAdmin, (req, res) => {
  try {
    const products = db
      .prepare("SELECT * FROM products ORDER BY id DESC")
      .all()
      .map(parseProduct)

    res.json({ success: true, products })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب المنتجات" })
  }
})

function slugify(name) {
  return (
    String(name)
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `product-${Date.now()}`
  )
}

app.post("/api/admin/products", requireAdmin, (req, res) => {
  try {
    const {
      name,
      category,
      price,
      oldPrice,
      image,
      badge,
      colors,
      sizes,
      description,
      featured,
      bestSeller,
      active,
    } = req.body || {}

    if (!name || !category || price === undefined || !image) {
      return res.status(400).json({
        success: false,
        message: "بيانات المنتج غير مكتملة",
      })
    }

    let slug = slugify(name)
    const exists = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug)
    if (exists) slug = `${slug}-${Date.now()}`

    const result = db
      .prepare(`
        INSERT INTO products
        (slug, name, category, price, old_price, image, badge, colors, sizes, description, featured, best_seller, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        slug,
        name,
        category,
        Number(price),
        oldPrice ? Number(oldPrice) : null,
        image,
        badge || null,
        JSON.stringify(colors || []),
        JSON.stringify(sizes || []),
        description || "",
        featured ? 1 : 0,
        bestSeller ? 1 : 0,
        active === false ? 0 : 1
      )

    res.status(201).json({ success: true, id: result.lastInsertRowid, slug })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إضافة المنتج" })
  }
})

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id)

    if (!existing) {
      return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    }

    const {
      name,
      category,
      price,
      oldPrice,
      image,
      badge,
      colors,
      sizes,
      description,
      featured,
      bestSeller,
      active,
    } = req.body || {}

    db.prepare(`
      UPDATE products SET
        name = ?, category = ?, price = ?, old_price = ?, image = ?,
        badge = ?, colors = ?, sizes = ?, description = ?,
        featured = ?, best_seller = ?, active = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      category ?? existing.category,
      price !== undefined ? Number(price) : existing.price,
      oldPrice !== undefined ? (oldPrice ? Number(oldPrice) : null) : existing.old_price,
      image ?? existing.image,
      badge !== undefined ? badge : existing.badge,
      colors !== undefined ? JSON.stringify(colors) : existing.colors,
      sizes !== undefined ? JSON.stringify(sizes) : existing.sizes,
      description !== undefined ? description : existing.description,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      bestSeller !== undefined ? (bestSeller ? 1 : 0) : existing.best_seller,
      active !== undefined ? (active ? 1 : 0) : existing.active,
      id
    )

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تعديل المنتج" })
  }
})

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  try {
    const result = db.prepare("DELETE FROM products WHERE id = ?").run(Number(req.params.id))

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف المنتج" })
  }
})

// ---------- orders ----------

app.get("/api/orders", requireAdmin, (req, res) => {
  try {
    const orders = db
      .prepare("SELECT * FROM orders ORDER BY id DESC")
      .all()

    res.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الطلبات",
    })
  }
})

app.post("/api/orders", (req, res) => {
  try {
    const {
      customer_name,
      phone,
      governorate,
      area,
      address,
      notes,
      items,
      total,
    } = req.body

    if (
      !customer_name ||
      !phone ||
      !governorate ||
      !area ||
      !address ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      total === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "بيانات الطلب غير مكتملة",
      })
    }

    const createOrder = db.transaction(() => {
      // unguessable tracking code (unique, retried on the tiny chance of collision)
      let trackingCode = generateTrackingCode()
      while (
        db
          .prepare("SELECT 1 FROM orders WHERE tracking_code = ?")
          .get(trackingCode)
      ) {
        trackingCode = generateTrackingCode()
      }

      const orderResult = db
        .prepare(`
          INSERT INTO orders
          (
            customer_name,
            phone,
            governorate,
            area,
            address,
            notes,
            total,
            tracking_code
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          customer_name,
          phone,
          governorate,
          area,
          address,
          notes || "",
          Number(total),
          trackingCode
        )

      const orderId = orderResult.lastInsertRowid

      const insertItem = db.prepare(`
        INSERT INTO order_items
        (
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          selected_color,
          selected_size
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of items) {
        insertItem.run(
          orderId,
          Number(item.product_id),
          item.product_name,
          Number(item.price),
          Number(item.quantity),
          item.selected_color || null,
          item.selected_size || null
        )
      }

      return { orderId, trackingCode }
    })

    const { orderId, trackingCode } = createOrder()

    res.status(201).json({
      success: true,
      message: "تم إنشاء الطلب بنجاح",
      order_id: orderId,
      tracking_code: trackingCode,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء الطلب",
    })
  }
})

// Public tracking by unguessable code — replaces the old sequential-id lookup
// that exposed every order's customer PII to enumeration.
app.get("/api/orders/track/:code", (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase()

    const order = db
      .prepare("SELECT * FROM orders WHERE tracking_code = ?")
      .get(code)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على طلب بهذا الكود",
      })
    }

    const items = db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(order.id)

    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        customer_name: order.customer_name,
        created_at: order.created_at,
      },
      items,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: "حدث خطأ",
    })
  }
})

// Order detail by id is admin-only — sequential ids are guessable.
app.get("/api/orders/:id", requireAdmin, (req, res) => {
  try {
    const orderId = Number(req.params.id)

    const order = db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود",
      })
    }

    const items = db
      .prepare(
        "SELECT * FROM order_items WHERE order_id = ?"
      )
      .all(orderId)

    res.json({
      success: true,
      order,
      items,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: "حدث خطأ",
    })
  }
})

app.patch("/api/orders/:id/status", requireAdmin, (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const { status } = req.body

    const allowedStatuses = [
      "جديد",
      "تم التأكيد",
      "جاري التجهيز",
      "تم الشحن",
      "تم التسليم",
      "ملغي",
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "حالة الطلب غير صحيحة",
      })
    }

    const result = db
      .prepare("UPDATE orders SET status = ? WHERE id = ?")
      .run(status, orderId)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود",
      })
    }

    res.json({
      success: true,
      message: "تم تحديث حالة الطلب",
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الطلب",
    })
  }
})


// ---------- contact messages ----------

app.post("/api/contact", (req, res) => {
  try {
    const { name, phone, message } = req.body || {}

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "من فضلك أكملي كل الحقول",
      })
    }

    const result = db
      .prepare(
        "INSERT INTO contact_messages (name, phone, message) VALUES (?, ?, ?)"
      )
      .run(name, phone, message)

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إرسال الرسالة" })
  }
})

app.get("/api/admin/contact-messages", requireAdmin, (req, res) => {
  try {
    const messages = db
      .prepare("SELECT * FROM contact_messages ORDER BY id DESC")
      .all()

    res.json({ success: true, messages })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الرسائل" })
  }
})

app.patch("/api/admin/contact-messages/:id/read", requireAdmin, (req, res) => {
  try {
    db.prepare("UPDATE contact_messages SET is_read = 1 WHERE id = ?").run(
      req.params.id
    )
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء التحديث" })
  }
})

app.delete("/api/admin/contact-messages/:id", requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM contact_messages WHERE id = ?").run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الحذف" })
  }
})


// ---------- settings (public read + admin write) ----------

app.get("/api/settings", (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all()
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    res.json({ success: true, settings })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الإعدادات" })
  }
})

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  try {
    const updates = req.body || {}
    const upsert = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    const runAll = db.transaction((obj) => {
      for (const [key, value] of Object.entries(obj)) {
        upsert.run(key, String(value))
      }
    })
    runAll(updates)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ الإعدادات" })
  }
})
// ---------- image upload (admin) ----------

app.post("/api/admin/upload", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "لم يتم إرسال صورة" })
    }

    // Check Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary غير مُعدّ — أضف المتغيرات في ملف .env",
      })
    }

    // Upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "dahab-store", resource_type: "image" },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(req.file.buffer)
    })

    res.json({ success: true, url: result.secure_url })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({ success: false, message: "فشل رفع الصورة: " + error.message })
  }
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dahab Backend running on http://localhost:${PORT}`)
})
