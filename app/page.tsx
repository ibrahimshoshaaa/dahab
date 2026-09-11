"use client";
import { useEffect, useState } from "react"
import { products as mockProducts, type Product } from "./data/products"
import Link from "next/link"
import { fetchProducts, fetchSettings, type SiteSettings } from "./lib/api"
import { useCart } from "./context/CartContext"
import { useFavorites } from "./context/FavoritesContext"

import { Search, Heart, ShoppingBag, Menu, X, ArrowLeft, Truck, RotateCcw, ShieldCheck } from "lucide-react";

const DEFAULT_SETTINGS: SiteSettings = {
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

function s(settings: SiteSettings, key: string): string {
  return settings[key] ?? DEFAULT_SETTINGS[key] ?? ""
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)
  const { cartCount, mounted } = useCart()
  const { toggleFavorite, isFavorite, favoritesCount, mounted: favoritesMounted } = useFavorites()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchProducts().then(setProducts),
      fetchSettings().then((data) => {
        if (Object.keys(data).length > 0) setSettings(data)
      }),
    ]).finally(() => setIsLoaded(true))
  }, [])

  const navLinks = [
    ["#", "الرئيسية"],
    ["#products", "العبايات"],
    ["#accessories", "الإكسسوارات"],
    ["#new", "وصل حديثًا"],
    ["#footer", "تواصل معنا"],
  ]

  const accessoryItems = [
    [s(settings, "accessories_item1_title"), s(settings, "accessories_item1_image")],
    [s(settings, "accessories_item2_title"), s(settings, "accessories_item2_image")],
    [s(settings, "accessories_item3_title"), s(settings, "accessories_item3_image")],
    [s(settings, "accessories_item4_title"), s(settings, "accessories_item4_image")],
  ]

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#a48343] border-t-transparent" />
      </div>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f4] text-[#171512]">

      <div className="bg-[#171512] py-2 text-center text-xs text-[#e8d19b]">
        {s(settings, "announcement_bar")}
      </div>

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf8f4]/95 backdrop-blur-xl">
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
              {navLinks.map(([href, label]) => (
                <a key={href} href={href} className="text-sm hover:text-[#a48343]">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <a href="#" className="justify-self-center text-center">
            <div className="font-serif text-3xl tracking-[0.2em]">DAHAB</div>
            <div className="mt-1 text-[9px] tracking-[0.5em] text-[#a48343]">
              دهب
            </div>
          </a>

          <div className="flex items-center justify-self-end gap-4">
            <button className="hidden sm:block">
              <Search size={21} strokeWidth={1.5} />
            </button>

            <Link href="/favorites" className="relative">
              <Heart size={21} strokeWidth={1.5} />
              {favoritesMounted && favoritesCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#a48343] text-[9px] text-white">
                  {favoritesCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingBag size={22} strokeWidth={1.5} />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#171512] text-[9px] text-white">
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

          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-[#faf8f4] px-6 py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="font-serif text-2xl tracking-[0.2em]">DAHAB</div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navLinks.map(([href, label]) => (
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

      {/* ── Hero ── */}
      <section className="relative min-h-[620px] overflow-hidden lg:min-h-[720px]">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${s(settings, "hero_image")}')` }}
        />

        <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-black/5" />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-6 lg:min-h-[720px]">

          <div className="max-w-xl text-white">

            <p className="mb-5 text-xs tracking-[0.35em] text-[#e8d19b]">
              {s(settings, "hero_label")}
            </p>

            <h1 className="text-5xl font-light leading-tight sm:text-6xl lg:text-7xl">
              {s(settings, "hero_title_line1")}
              <br />
              <span className="font-serif italic text-[#e8d19b]">
                {s(settings, "hero_title_line2")}
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-8 text-white/80 sm:text-base">
              {s(settings, "hero_subtitle")}
            </p>

            <a
              href="#products"
              className="mt-8 inline-flex items-center gap-4 bg-white px-7 py-4 text-sm text-[#171512] transition hover:bg-[#e8d19b]"
            >
              {s(settings, "hero_button_text")}
              <ArrowLeft size={18} />
            </a>

          </div>
        </div>
      </section>

      {/* ── Collection grid ── */}
      <section className="mx-auto max-w-7xl px-5 py-20">

        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[#a48343]">
            EXPLORE DAHAB
          </p>
          <h2 className="text-3xl font-light sm:text-4xl">
            اكتشفي مجموعتنا
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          <a href="#products" className="group relative h-[480px] overflow-hidden">
            <img
              src={s(settings, "collection_abaya_image")}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              alt="العبايات"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 right-8 text-white">
              <p className="mb-2 text-xs text-[#e8d19b]">أناقة بتفاصيل مصرية</p>
              <h3 className="text-3xl font-light">العبايات</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm">
                تسوقي الآن <ArrowLeft size={16} />
              </span>
            </div>
          </a>

          <a href="#accessories" className="group relative h-[480px] overflow-hidden">
            <img
              src={s(settings, "collection_accessories_image")}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              alt="الإكسسوارات"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 right-8 text-white">
              <p className="mb-2 text-xs text-[#e8d19b]">كمّلي إطلالتك</p>
              <h3 className="text-3xl font-light">الإكسسوارات</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm">
                تسوقي الآن <ArrowLeft size={16} />
              </span>
            </div>
          </a>

        </div>
      </section>

      {/* ── Products grid ── */}
      <section id="products" className="border-y border-black/5 bg-white py-20">

        <div className="mx-auto max-w-7xl px-5">

          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-3 text-[11px] tracking-[0.3em] text-[#a48343]">
                NEW SEASON
              </p>
              <h2 id="new" className="text-3xl font-light sm:text-4xl">
                أحدث المنتجات
              </h2>
            </div>
            <a href="#" className="hidden text-sm sm:block">عرض الكل ←</a>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <Link key={product.slug} href={`/products/${product.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ede7]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 bg-white px-3 py-1.5 text-[10px]">
                    {product.badge}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(product)
                    }}
                    className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90"
                    aria-label="إضافة للمفضلة"
                  >
                    <Heart
                      size={17}
                      strokeWidth={1.5}
                      className={isFavorite(product.id) ? "fill-[#a48343] text-[#a48343]" : ""}
                    />
                  </button>
                </div>
                <div className="pt-4">
                  <h3 className="text-sm">{product.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-medium">{product.price} ج.م</span>
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.oldPrice} ج.م
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="bg-[#171512] text-white">

        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">

          <div className="flex items-center px-7 py-20 lg:px-16">
            <div>
              <p className="mb-5 text-[11px] tracking-[0.3em] text-[#c8a85c]">
                THE DAHAB STORY
              </p>
              <h2 className="text-4xl font-light leading-tight sm:text-5xl">
                {s(settings, "story_title_line1")}
                <br />
                <span className="font-serif italic text-[#d9bb78]">
                  {s(settings, "story_title_line2")}
                </span>
              </h2>
              <p className="mt-7 max-w-lg text-sm leading-8 text-white/60">
                {s(settings, "story_body")}
              </p>
            </div>
          </div>

          <div className="min-h-[500px]">
            <img
              src={s(settings, "story_image")}
              className="h-full w-full object-cover"
              alt="Dahab"
            />
          </div>

        </div>
      </section>

      {/* ── Accessories ── */}
      <section id="accessories" className="mx-auto max-w-7xl px-5 py-20">

        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[#a48343]">
            COMPLETE YOUR LOOK
          </p>
          <h2 className="text-3xl font-light sm:text-4xl">
            كمّلي إطلالتك
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {accessoryItems.map(([title, image]) => (
            <a key={title} href="#" className="group relative aspect-square overflow-hidden">
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25" />
              <h3 className="absolute bottom-5 right-5 text-xl text-white">{title}</h3>
            </a>
          ))}
        </div>
      </section>

      {/* ── Features bar ── */}
      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {[
            [Truck, "شحن سريع", "لجميع المحافظات"],
            [RotateCcw, "استبدال سهل", "بكل سهولة"],
            [ShieldCheck, "جودة مختارة", "نختارها بعناية"],
            [ShoppingBag, "دفع عند الاستلام", "آمن وسهل"],
          ].map(([Icon, title, subtitle]) => (
            <div
              key={title as string}
              className="flex flex-col items-center border-l border-black/5 px-3 py-10 text-center"
            >
              <Icon size={25} strokeWidth={1.2} className="mb-4 text-[#a48343]" />
              <h3 className="text-sm">{title as string}</h3>
              <p className="mt-1 text-[11px] text-gray-400">{subtitle as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-[#f1ede5] px-5 py-20 text-center">
        <p className="mb-3 text-[11px] tracking-[0.3em] text-[#a48343]">STAY IN TOUCH</p>
        <h2 className="text-3xl font-light">كوني أول من يعرف جديد دهب</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-500">
          اشتركي معنا ليصلك كل جديد من التشكيلات والعروض.
        </p>
        <div className="mx-auto mt-7 flex max-w-md border-b border-black/30">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="min-w-0 flex-1 bg-transparent px-2 py-4 text-sm outline-none"
          />
          <button className="px-4 text-sm">اشتراك ←</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="footer" className="bg-[#171512] px-5 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">

          <div className="md:col-span-2">
            <div className="font-serif text-3xl tracking-[0.2em]">DAHAB</div>
            <div className="mt-1 text-[9px] tracking-[0.5em] text-[#c8a85c]">دهب</div>
            <p className="mt-5 max-w-sm text-sm leading-8 text-white/50">
              {s(settings, "footer_description")}
            </p>
            <div className="mt-6 flex gap-4">
              <span className="text-sm font-medium">Instagram</span>
              <span className="text-sm font-medium">Facebook</span>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm text-[#e6ca8b]">تسوقي</h3>
            <div className="space-y-3 text-sm text-white/50">
              <a className="block" href="#products">العبايات</a>
              <a className="block" href="#accessories">الإكسسوارات</a>
              <a className="block" href="#new">وصل حديثًا</a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm text-[#e6ca8b]">مساعدة</h3>
            <div className="space-y-3 text-sm text-white/50">
              <Link className="block hover:text-white transition" href="/track">تتبع طلبك</Link>
              <Link className="block" href="/contact">تواصل معنا</Link>
              <Link className="block" href="/shipping">الشحن والتوصيل</Link>
              <Link className="block" href="/returns">الاستبدال والاسترجاع</Link>
            </div>
          </div>

        </div>

        <div className="mx-auto mt-14 max-w-7xl border-t border-white/10 pt-6 text-center text-[11px] text-white/30">
          © 2026 DAHAB — جميع الحقوق محفوظة
        </div>
      </footer>

    </main>
  );
}
