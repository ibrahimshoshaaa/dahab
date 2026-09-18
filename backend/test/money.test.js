const assert = require("node:assert/strict")
const test = require("node:test")
const { toCents, fromCents, addCents, percentDiscountCents } = require("../money")

test("money uses integer cents without floating-point drift", () => {
  assert.equal(toCents(0.1), 10)
  assert.equal(toCents(0.29), 29)
  assert.equal(addCents(toCents(0.1), toCents(0.2)), 30)
  assert.equal(fromCents(12345), 123.45)
})

test("percentage discounts are calculated in cents", () => {
  assert.equal(percentDiscountCents(999, 10), 100)
  assert.equal(fromCents(percentDiscountCents(toCents(1499.99), 15)), 225)
})

test("invalid money is rejected", () => {
  assert.throws(() => toCents(-1), TypeError)
  assert.throws(() => toCents(Number.POSITIVE_INFINITY), TypeError)
  assert.throws(() => fromCents(-1), TypeError)
})
