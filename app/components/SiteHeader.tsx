"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Heart, ShoppingBag, Menu, X, ArrowLeft } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useFavorites } from "../context/FavoritesContext"
import { fetchProducts, fetchSettings, type ApiProduct } from "../lib/api"
import SiteLogo from "./SiteLogo"

const DEFAULT_ANNOUNCEMENT = ""
const NAV_LINKS: [string, string][] = [
  ["/", "الرئيسية"],
  ["/products?category=عبايات", "العبايات"],
  ["/products?category=إكسسوارات", "الإكسسوارات"],
  ["/products", "وصل حديثًا"],
  ["/contact", "تواصل معنا"],
]

export default function SiteHeader() {
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<ApiProduct[]>([])
  const { cartCount, mounted } = useCart()
  const { favoritesCount, mounted: favoritesMounted } = useFavorites()

  useEffect(() => {
    fetchSettings().then((data) => { if (data.announcement_bar) setAnnouncement(data.announcement_bar) })
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    fetchProducts().then(setProducts)
  }, [searchOpen])

  const results = query.trim()
    ? products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : []

  return (
    <>
      {announcement && <div className="bg-white py-2 text-center text-xs text-[var(--ink)]">{announcement}</div>}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[var(--bg)]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-3 items-center px-5">
          <div className="flex items-center justify-self-start">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu size={24} strokeWidth={1.5} /></button>
            <nav className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map(([href, label]) => <Link key={href} href={href} className="text-sm hover:text-[var(--brand)]">{label}</Link>)}
            </nav>
          </div>
          <Link href="/" className="flex items-center justify-center justify-self-center"><SiteLogo className="h-11 w-auto object-contain sm:h-12" /></Link>
          <div className="flex items-center justify-self-end gap-4">
            <button onClick={() => { setSearchOpen(true); setQuery("") }} className="hidden sm:block" aria-label="بحث"><Search size={21} strokeWidth={1.5} /></button>
            <Link href="/favorites" className="relative" aria-label="المفضلة"><Heart size={21} strokeWidth={1.5} />{favoritesMounted && favoritesCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-[3px] text-[9px] text-white">{favoritesCount}</span>}</Link>
            <Link href="/cart" className="relative" aria-label="السلة"><ShoppingBag size={22} strokeWidth={1.5} />{mounted && cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ink)] px-[3px] text-[9px] text-white">{cartCount}</span>}</Link>
          </div>
        </div>
      </header>

      {searchOpen && <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setSearchOpen(false)}>
        <div className="mx-auto mt-20 w-[calc(100%-24px)] max-w-2xl overflow-hidden rounded-3xl bg-[var(--bg)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-black/10 p-4">
            <Search size={20} className="text-gray-400" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحثي عن عباية أو إكسسوار..." className="min-w-0 flex-1 bg-transparent py-2 outline-none" />
            <button onClick={() => setSearchOpen(false)} aria-label="إغلاق"><X size={21} /></button>
          </div>
          {query.trim() && <div className="max-h-[60vh] overflow-auto p-3">
            {results.length ? results.map((product) => <Link key={product.id} href={`/products/${product.slug}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-4 rounded-2xl p-3 hover:bg-white">
              <img src={product.image} alt={product.name} className="h-16 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><p className="text-xs text-gray-400">{product.category}</p><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-1 text-sm">{product.price.toLocaleString("ar-EG")} جنيه</p></div><ArrowLeft size={17} />
            </Link>) : <p className="p-8 text-center text-sm text-gray-500">لا توجد نتائج مطابقة.</p>}
          </div>}
          {!query.trim() && <div className="p-8 text-center"><p className="text-sm text-gray-500">اكتبي اسم المنتج للبحث داخل مجموعة دهب.</p></div>}
        </div>
      </div>}

      {mobileMenuOpen && <div className="fixed inset-0 z-[60] lg:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-[var(--bg)] px-6 py-6 shadow-xl">
          <div className="mb-8 flex items-center justify-between"><SiteLogo className="h-9 w-auto object-contain" /><button onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق القائمة"><X size={22} strokeWidth={1.5} /></button></div>
          <button onClick={() => { setMobileMenuOpen(false); setSearchOpen(true) }} className="mb-3 flex items-center gap-3 border-b border-black/5 py-4 text-base"><Search size={19} /> بحث عن منتج</button>
          <nav className="flex flex-col gap-1">{NAV_LINKS.map(([href,label]) => <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="border-b border-black/5 py-4 text-base">{label}</Link>)}</nav>
          <div className="mt-auto flex items-center gap-5 pt-6"><Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-gray-600"><Heart size={18} /> المفضلة</Link><Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-gray-600"><ShoppingBag size={18} /> السلة</Link></div>
        </div>
      </div>}
    </>
  )
}
