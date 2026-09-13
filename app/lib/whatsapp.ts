export function whatsappUrl(phone: string, message: string) {
  const digits = String(phone).replace(/\D/g, "")
  const normalized = digits.startsWith("0") ? `20${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
export function orderWhatsappUrl(trackingCode: string) {
  return whatsappUrl("201000000000", `مرحبًا دهب، أريد الاستفسار عن الطلب ${trackingCode}`)
}
