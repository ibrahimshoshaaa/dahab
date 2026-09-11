const crypto = require("crypto")
const Database = require("better-sqlite3")
const path = require("path")

const dbPath = path.join(__dirname, "dahab.db")

const db = new Database(dbPath)

db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    governorate TEXT NOT NULL,
    area TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'جديد',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    selected_color TEXT,
    selected_size TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    old_price REAL,
    image TEXT NOT NULL,
    badge TEXT,
    colors TEXT NOT NULL DEFAULT '[]',
    sizes TEXT NOT NULL DEFAULT '[]',
    description TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    best_seller INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)


// ---------- migration: public tracking code for orders ----------
// Orders used to be trackable by sequential id through a public endpoint,
// which exposed every customer's PII. Now each order gets an unguessable
// tracking code; customers track with the code only.
function generateTrackingCode() {
  // 8 chars, alphabet without ambiguous characters (0/O, 1/I/L)
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(8)
  let code = ""
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length]
  return code
}

const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name)

if (!orderColumns.includes("tracking_code")) {
  db.exec("ALTER TABLE orders ADD COLUMN tracking_code TEXT")

  const backfill = db.prepare("UPDATE orders SET tracking_code = ? WHERE id = ?")
  const rowsWithoutCode = db
    .prepare("SELECT id FROM orders WHERE tracking_code IS NULL")
    .all()

  for (const row of rowsWithoutCode) {
    backfill.run(generateTrackingCode(), row.id)
  }
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_code
  ON orders(tracking_code)
`)

// ---------- seed products ----------

const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get()

if (productCount.count === 0) {
  const seedProducts = [
    {
      slug: "abaya-lulu",
      name: "عباية لؤلؤة",
      category: "عبايات",
      price: 1499,
      old_price: 1799,
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900",
      badge: "الأكثر مبيعًا",
      colors: ["أسود", "بيج"],
      sizes: ["S", "M", "L", "XL"],
      description: "عباية أنيقة بتصميم راقٍ وخامة مريحة تناسب إطلالتك اليومية والمناسبات.",
      featured: 1,
      best_seller: 1,
    },
    {
      slug: "abaya-dahab",
      name: "عباية دهب",
      category: "عبايات",
      price: 1699,
      old_price: null,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900",
      badge: "جديد",
      colors: ["أسود", "بني"],
      sizes: ["M", "L", "XL", "XXL"],
      description: "تصميم عصري بلمسة فاخرة من دهب.",
      featured: 1,
      best_seller: 0,
    },
    {
      slug: "abaya-nokhba",
      name: "عباية نخبة",
      category: "عبايات",
      price: 1299,
      old_price: 1499,
      image: "https://images.unsplash.com/photo-1585488439659-9d8c3b4f6e8b?w=900",
      badge: "خصم",
      colors: ["أسود"],
      sizes: ["S", "M", "L", "XL"],
      description: "عباية عملية وأنيقة بتفاصيل بسيطة وفخمة.",
      featured: 0,
      best_seller: 1,
    },
    {
      slug: "dahab-bag",
      name: "شنطة دهب",
      category: "إكسسوارات",
      price: 799,
      old_price: null,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900",
      badge: "جديد",
      colors: ["أسود", "بيج"],
      sizes: [],
      description: "شنطة أنيقة تكمل إطلالتك من دهب.",
      featured: 1,
      best_seller: 0,
    },
    {
      slug: "dahab-scarf",
      name: "طرحة دهب",
      category: "إكسسوارات",
      price: 299,
      old_price: null,
      image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900",
      badge: null,
      colors: ["بيج", "أسود", "أوف وايت"],
      sizes: [],
      description: "طرحة ناعمة وأنيقة بألوان تناسب مختلف الإطلالات.",
      featured: 0,
      best_seller: 0,
    },
    {
      slug: "classic-abaya",
      name: "عباية كلاسيك",
      category: "عبايات",
      price: 1399,
      old_price: null,
      image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=900",
      badge: null,
      colors: ["أسود", "رمادي"],
      sizes: ["M", "L", "XL", "XXL"],
      description: "ستايل كلاسيكي مناسب لكل يوم.",
      featured: 0,
      best_seller: 1,
    },
    {
      slug: "gold-accessory",
      name: "إكسسوار دهب",
      category: "إكسسوارات",
      price: 399,
      old_price: null,
      image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900",
      badge: "جديد",
      colors: ["ذهبي", "فضي"],
      sizes: [],
      description: "لمسة بسيطة تضيف أناقة مميزة لإطلالتك.",
      featured: 0,
      best_seller: 0,
    },
    {
      slug: "abaya-elite",
      name: "عباية إيليت",
      category: "عبايات",
      price: 1899,
      old_price: null,
      image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=900",
      badge: "حصري",
      colors: ["أسود"],
      sizes: ["S", "M", "L", "XL"],
      description: "تصميم فاخر لمحبي الإطلالات الراقية.",
      featured: 1,
      best_seller: 0,
    },
  ]

  const insertProduct = db.prepare(`
    INSERT INTO products
    (slug, name, category, price, old_price, image, badge, colors, sizes, description, featured, best_seller)
    VALUES (@slug, @name, @category, @price, @old_price, @image, @badge, @colors, @sizes, @description, @featured, @best_seller)
  `)

  const seedAll = db.transaction((items) => {
    for (const item of items) {
      insertProduct.run({
        ...item,
        colors: JSON.stringify(item.colors),
        sizes: JSON.stringify(item.sizes),
      })
    }
  })

  seedAll(seedProducts)
}

// ---------- seed settings ----------

const settingsCount = db.prepare("SELECT COUNT(*) AS count FROM settings").get()

if (settingsCount.count === 0) {
  const defaultSettings = {
    hero_image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=90",
    hero_label: "DAHAB COLLECTION",
    hero_title_line1: "أناقتك...",
    hero_title_line2: "بطابع دهب",
    hero_subtitle: "عبايات مصرية بتصميمات راقية تجمع بين الاحتشام والأناقة وتناسب كل لحظة.",
    hero_button_text: "اكتشفي المجموعة",
    story_title_line1: "لأن الأناقة",
    story_title_line2: "تستحق أن تُحكى",
    story_body: "في دهب نؤمن أن العباية ليست مجرد قطعة ملابس، بل تعبير عن شخصيتك. نقدم تصميمات مصرية معاصرة تجمع بين البساطة والفخامة.",
    story_image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1200&q=90",
    collection_abaya_image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1200&q=90",
    collection_accessories_image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=90",
    accessories_item1_title: "حقائب",
    accessories_item1_image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85",
    accessories_item2_title: "إكسسوارات",
    accessories_item2_image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=85",
    accessories_item3_title: "طرح",
    accessories_item3_image: "https://images.unsplash.com/photo-1601924928378-6bda4b8c3f1d?auto=format&fit=crop&w=700&q=85",
    accessories_item4_title: "لمسات دهب",
    accessories_item4_image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85",
    footer_description: "عبايات مصرية وإكسسوارات مختارة بعناية، لأن أناقتك تستحق الأفضل.",
    announcement_bar: "✦ شحن لجميع المحافظات | الدفع عند الاستلام متاح",
  }

  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
  const seedSettings = db.transaction((obj) => {
    for (const [key, value] of Object.entries(obj)) {
      insertSetting.run(key, value)
    }
  })
  seedSettings(defaultSettings)
}

module.exports = db
module.exports.generateTrackingCode = generateTrackingCode
