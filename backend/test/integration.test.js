const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawn } = require("node:child_process")
const test = require("node:test")

const port = 4300 + Math.floor(Math.random() * 200)
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dahab-integration-"))
const dbPath = path.join(tempDir, "test.db")
const env = {
  ...process.env,
  NODE_ENV: "test",
  PORT: String(port),
  TURSO_DATABASE_URL: `file:${dbPath}`,
  ADMIN_USER: "integration-admin",
  ADMIN_PASS: "integration-pass",
  ADMIN_SESSION_SECRET: "integration-secret",
  FRONTEND_ORIGIN: `http://127.0.0.1:${port}`,
  CLOUDINARY_CLOUD_NAME: "",
}
let serverProcess
let adminCookie

async function request(pathname, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (adminCookie) headers.Cookie = adminCookie
  return fetch(`http://127.0.0.1:${port}${pathname}`, { ...options, headers })
}

async function json(response) {
  const body = await response.json()
  return { response, body }
}

async function login() {
  const response = await request("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "integration-admin", password: "integration-pass" }),
  })
  assert.equal(response.status, 200)
  const setCookie = response.headers.get("set-cookie")
  assert.ok(setCookie)
  adminCookie = setCookie.split(";")[0]
}

async function createProduct(name, stock, price = 100) {
  const { response, body } = await json(await request("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      category: "عبايات",
      price,
      image: "https://example.com/test.jpg",
      stock,
      active: true,
    }),
  }))
  assert.equal(response.status, 201)
  return body.id
}

async function createOrder(productId, key, quantity = 1, total = 100) {
  return json(await request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Integration Test",
      phone: "01012345678",
      governorate: "المنوفية",
      area: "اختبار",
      address: "عنوان اختبار",
      total,
      idempotency_key: key,
      items: [{ product_id: productId, product_name: "client value", price: total, quantity }],
    }),
  }))
}

async function waitForServer() {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error("Integration server did not start")
}

test.before(async () => {
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  await waitForServer()
  await login()
})

test.after(async () => {
  if (serverProcess) serverProcess.kill("SIGTERM")
  fs.rmSync(tempDir, { recursive: true, force: true })
})

test("admin authorization rejects unauthenticated access", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/products`)
  assert.equal(response.status, 401)
})

test("concurrent last-item orders allow only one purchase", async () => {
  const productId = await createProduct("Concurrent Stock Product", 1, 100)
  const results = await Promise.all([
    createOrder(productId, "concurrent-key-1"),
    createOrder(productId, "concurrent-key-2"),
  ])
  const successes = results.filter(({ response }) => response.status === 201)
  assert.equal(successes.length, 1, JSON.stringify(results.map(({ response, body }) => ({ status: response.status, body }))))
})

test("idempotency returns the same order and rejects a different payload", async () => {
  const productId = await createProduct("Idempotent Product", 3, 150)
  const first = await createOrder(productId, "idempotency-key-1", 1, 150)
  assert.equal(first.response.status, 201, JSON.stringify(first.body))
  const replay = await createOrder(productId, "idempotency-key-1", 1, 150)
  assert.equal(replay.response.status, 200)
  assert.equal(replay.body.order_id, first.body.order_id)
  const mismatch = await createOrder(productId, "idempotency-key-1", 2, 300)
  assert.equal(mismatch.response.status, 409)
})

test("cancel and reopen restore and consume stock exactly once", async () => {
  const productId = await createProduct("Cancel Reopen Product", 1, 200)
  const order = await createOrder(productId, "cancel-reopen-key", 1, 200)
  assert.equal(order.response.status, 201, JSON.stringify(order.body))

  let response = await request(`/api/orders/${order.body.order_id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ملغي" }),
  })
  assert.equal(response.status, 200)

  response = await request(`/api/orders/${order.body.order_id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ملغي" }),
  })
  assert.equal(response.status, 200)

  const productsAfterCancel = await json(await request("/api/admin/products"))
  const cancelledProduct = productsAfterCancel.body.products.find((p) => p.id === productId)
  assert.equal(cancelledProduct.stock, 1)

  response = await request(`/api/orders/${order.body.order_id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "جديد" }),
  })
  assert.equal(response.status, 200)

  const productsAfterReopen = await json(await request("/api/admin/products"))
  const reopenedProduct = productsAfterReopen.body.products.find((p) => p.id === productId)
  assert.equal(reopenedProduct.stock, 0)
})

test("public tracking does not expose customer identity", async () => {
  const productId = await createProduct("Tracking Privacy Product", 2, 250)
  const order = await createOrder(productId, "tracking-privacy-key", 1, 250)
  assert.equal(order.response.status, 201)

  const tracked = await json(await request(`/api/orders/track/${order.body.tracking_code}`))
  assert.equal(tracked.response.status, 200)
  assert.equal(tracked.body.order.status, "جديد")
  assert.equal(tracked.body.order.total, 250)
  assert.equal(tracked.body.order.customer_name, undefined)
})

test("coupon usage is concurrency-safe", async () => {
  const productId = await createProduct("Coupon Race Product", 2, 100)
  const couponResponse = await json(await request("/api/admin/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "RACE1",
      type: "percent",
      value: 10,
      minOrder: 0,
      maxUses: 1,
      active: true,
    }),
  }))
  assert.equal(couponResponse.response.status, 201)

  const makeCouponOrder = (key) => request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Coupon Race",
      phone: "01012345678",
      governorate: "المنوفية",
      area: "اختبار",
      address: "عنوان اختبار",
      total: 90,
      coupon_code: "RACE1",
      idempotency_key: key,
      items: [{ product_id: productId, product_name: "client value", price: 100, quantity: 1 }],
    }),
  })

  const responses = await Promise.all([
    makeCouponOrder("coupon-race-1"),
    makeCouponOrder("coupon-race-2"),
  ])
  assert.equal(responses.filter((r) => r.status === 201).length, 1)

  const coupons = await json(await request("/api/admin/coupons"))
  const coupon = coupons.body.coupons.find((item) => item.code === "RACE1")
  assert.equal(coupon.used_count, 1)

  const products = await json(await request("/api/admin/products"))
  const product = products.body.products.find((item) => item.id === productId)
  assert.equal(product.stock, 1)
})
