"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useFavorites } from "../context/FavoritesContext"
import { fetchSettings } from "../lib/api"
import SiteLogo from "./SiteLogo"

const DEFAULT_ANNOUNCEMENT = ""

const NAV_LINKS: [string, string][] = [
  ["/", "الرئيسية"],
  ["/products", "العبايات"],
  ["/#accessories", "الإكسسوارات"],
  ["/#new", "وصل حديثًا"],
  ["/contact", "تواصل معنا"],
]

// هيدر واحد مشترك بين كل صفحات الموقع (الرئيسية، المنتج، السلة، ...)
// عشان شكله يفضل ثابت في كل مكان بدل ما كل صفحة تعمل هيدر مبسّط لوحدها.
export default function SiteHeader() {
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { cartCount, mounted } = useCart()
  const { favoritesCount, mounted: favoritesMounted } = useFavorites()

  useEffect(() => {
    fetchSettings().then((data) => {
      if (data.announcement_bar) setAnnouncement(data.announcement_bar)
    })
  }, [])

  return (
    <>
      {announcement && (
        <div className="bg-white py-2 text-center text-xs text-[var(--ink)]">
          {announcement}
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[var(--bg)]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-3 items-center px-5">

          <div className="flex items-center justify-self-start">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>

            <nav className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={href} className="text-sm hover:text-[var(--brand)]">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <Link href="/" className="justify-self-center flex items-center justify-center">
            <SiteLogo className="h-11 w-auto object-contain sm:h-12" />
          </Link>

          <div className="flex items-center justify-self-end gap-4">
            <button className="hidden sm:block">
              <Search size={21} strokeWidth={1.5} />
            </button>

            <Link href="/favorites" className="relative">
              <Heart size={21} strokeWidth={1.5} />
              {favoritesMounted && favoritesCount > 0 && (
                <span className="absolute -right-2 -top-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-[3px] text-[9px] leading-none text-white">
                  {favoritesCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingBag size={22} strokeWidth={1.5} />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-2 -top-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ink)] px-[3px] text-[9px] leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile menu drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-[var(--bg)] px-6 py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <SiteLogo className="h-9 w-auto object-contain" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-black/5 py-4 text-base"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex items-center gap-5 pt-6">
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Heart size={18} strokeWidth={1.5} />
                المفضلة
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                السلة
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
