const CENTS_PER_UNIT = 100

function toCents(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new TypeError("Money value must be a finite non-negative number")
  }
  const cents = Math.round((numeric + Number.EPSILON) * CENTS_PER_UNIT)
  if (!Number.isSafeInteger(cents)) throw new RangeError("Money value is too large")
  return cents
}

function fromCents(cents) {
  const numeric = Number(cents)
  if (!Number.isSafeInteger(numeric) || numeric < 0) {
    throw new TypeError("Money cents must be a non-negative safe integer")
  }
  return numeric / CENTS_PER_UNIT
}

function addCents(...values) {
  const total = values.reduce((sum, value) => sum + Number(value), 0)
  if (!Number.isSafeInteger(total) || total < 0) throw new RangeError("Money total is too large")
  return total
}

function percentDiscountCents(subtotalCents, percent) {
  const numeric = Number(percent)
  if (!Number.isFinite(numeric) || numeric < 0) throw new TypeError("Invalid percentage")
  return Math.round(subtotalCents * numeric / 100)
}

module.exports = { CENTS_PER_UNIT, toCents, fromCents, addCents, percentDiscountCents }
