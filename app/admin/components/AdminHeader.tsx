"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react"

const groups = [
  {
    label: "المبيعات",
    items: [
      { href: "/admin/orders", label: "الطلبات" },
      { href: "/admin/customers", label: "العملاء" },
      { href: "/admin/reports", label: "التقارير" },
      { href: "/admin/analytics", label: "تحليلات العملاء" },
    ],
  },
  {
    label: "المنتجات والمخزون",
    items: [
      { href: "/admin/products", label: "المنتجات" },
      { href: "/admin/inventory", label: "المخزون" },
      { href: "/admin/coupons", label: "العروض" },
      { href: "/admin/reviews", label: "التقييمات" },
    ],
  },
  {
    label: "إدارة الموقع",
    items: [
      { href: "/admin/homepage", label: "الصفحة الرئيسية" },
      { href: "/admin/pages", label: "الصفحات الثابتة" },
      { href: "/admin/theme", label: "الشكل العام" },
    ],
  },
  {
    label: "التواصل",
    items: [
      { href: "/admin/messages", label: "الرسائل" },
      { href: "/admin/notifications", label: "الإشعارات" },
    ],
  },
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
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
  }

  function groupIsActive(items: { href: string }[]) {
    return items.some((item) => isActive(item.href))
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className={`mx-auto flex ${maxWidthClass} items-center justify-between px-4 py-4 sm:px-5`}>
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="font-serif text-xl tracking-[0.18em] sm:text-2xl">DAHAB</span>
          <span className="h-5 w-px bg-black/10" />
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            <LayoutDashboard size={16} />
            لوحة التحكم
            <span className="text-xs font-normal text-gray-400">ADMIN</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          <Link
            href="/admin"
            className={`rounded-xl px-3 py-2 transition ${isActive("/admin") ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            الرئيسية
          </Link>

          {groups.map((group) => {
            const active = groupIsActive(group.items)
            return (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenGroup((v) => (v === group.label ? null : group.label))}
                  className={`flex items-center gap-1 rounded-xl px-3 py-2 transition ${active ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {group.label}
                  <ChevronDown size={14} className={openGroup === group.label ? "rotate-180 transition" : "transition"} />
                </button>
                {openGroup === group.label && (
                  <div className="absolute right-0 top-full mt-2 min-w-48 overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenGroup(null)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${isActive(item.href) ? "bg-gray-100 font-medium text-black" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {item.label}
                        {item.href === "/admin/messages" && unreadCount > 0 && (
                          <span className="rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] text-white">{unreadCount}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={onLogout}
            className="ml-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-gray-500 hover:bg-gray-100"
          >
            <LogOut size={15} />
            خروج
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-gray-600 md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/10 bg-white px-4 py-3 md:hidden">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${isActive("/admin") ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <LayoutDashboard size={17} /> الرئيسية
          </Link>

          <div className="space-y-1">
            {groups.map((group) => {
              const active = groupIsActive(group.items)
              const expanded = openGroup === group.label
              return (
                <div key={group.label} className="overflow-hidden rounded-xl border border-black/5">
                  <button
                    type="button"
                    onClick={() => setOpenGroup((v) => (v === group.label ? null : group.label))}
                    className={`flex w-full items-center justify-between px-3 py-3 text-right text-sm ${active ? "font-medium text-black" : "text-gray-600"}`}
                  >
                    <span>{group.label}</span>
                    <ChevronDown size={17} className={expanded ? "rotate-180 transition" : "transition"} />
                  </button>
                  {expanded && (
                    <div className="border-t border-black/5 bg-gray-50/70 px-2 py-1.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setOpen(false); setOpenGroup(null) }}
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${isActive(item.href) ? "bg-white font-medium text-black shadow-sm" : "text-gray-500"}`}
                        >
                          {item.label}
                          {item.href === "/admin/messages" && unreadCount > 0 && (
                            <span className="rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] text-white">{unreadCount}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right text-sm text-gray-500 hover:bg-gray-50"
          >
            <LogOut size={17} /> تسجيل الخروج
          </button>
        </nav>
      )}
    </header>
  )
}
