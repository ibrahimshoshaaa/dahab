"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const navItems = [
  { href: "/admin", label: "الرئيسية" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/products", label: "المنتجات" },
  { href: "/admin/inventory", label: "المخزون" },
  { href: "/admin/customers", label: "العملاء" },
  { href: "/admin/reports", label: "التقارير" },
  { href: "/admin/coupons", label: "العروض" },
  { href: "/admin/notifications", label: "الإشعارات" },
  { href: "/admin/homepage", label: "الصفحة الرئيسية" },
  { href: "/admin/pages", label: "الصفحات الثابتة" },
  { href: "/admin/theme", label: "الشكل العام" },
  { href: "/admin/messages", label: "الرسائل" },
]

export default function AdminHeader({
  maxWidthClass = "max-w-7xl",
  unreadCount = 0,
  onLogout,
}: {
  maxWidthClass?: string
  unreadCount?: number
  onLogout: () => void
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
  }

  return (
    <header className="border-b border-black/10 bg-white">
      <div
        className={`mx-auto flex ${maxWidthClass} items-center justify-between px-5 py-5`}
      >
        <div className="font-serif text-2xl tracking-widest">
          DAHAB <span className="text-sm text-gray-400">ADMIN</span>
        </div>

        {/* نافيجيشن سطح المكتب */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "font-medium" : "text-gray-500"}
            >
              {item.label}
              {item.href === "/admin/messages" && unreadCount > 0 && (
                <span className="mr-1.5 rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
          <button onClick={onLogout} className="text-gray-500">
            تسجيل الخروج
          </button>
        </nav>

        {/* زرار المنيو للموبايل */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-gray-600 md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* منيو الموبايل */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-black/10 bg-white px-5 py-3 text-sm md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between rounded-lg px-2 py-2.5 ${
                isActive(item.href) ? "font-medium" : "text-gray-500"
              }`}
            >
              {item.label}
              {item.href === "/admin/messages" && unreadCount > 0 && (
                <span className="rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="rounded-lg px-2 py-2.5 text-right text-gray-500"
          >
            تسجيل الخروج
          </button>
        </nav>
      )}
    </header>
  )
}
