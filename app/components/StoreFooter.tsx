import Link from "next/link"
import { MessageCircle, ArrowUp } from "lucide-react"
import SiteLogo from "./SiteLogo"

export default function StoreFooter() {
  return (
    <footer className="bg-[var(--ink)] px-5 py-14 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <SiteLogo className="h-10 w-auto object-contain" />
          <p className="mt-5 max-w-sm text-sm leading-8 text-white/50">
            عبايات مصرية وإكسسوارات مختارة بعناية، لأن أناقتك تستحق الأفضل.
          </p>
          <div className="mt-6 flex gap-3">
            <a aria-label="Instagram" href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-white/30"><span className="text-sm font-semibold">IG</span></a>
            <a aria-label="Facebook" href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-white/30"><span className="text-sm font-semibold">f</span></a>
            <a aria-label="WhatsApp" href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-white/30"><MessageCircle size={17} /></a>
          </div>
        </div>
        <div>
          <h3 className="mb-5 text-sm text-[var(--brand-soft)]">تسوقي</h3>
          <div className="space-y-3 text-sm text-white/50">
            <Link className="block hover:text-white" href="/products?category=عبايات">العبايات</Link>
            <Link className="block hover:text-white" href="/products?category=إكسسوارات">الإكسسوارات</Link>
            <Link className="block hover:text-white" href="/products">كل المنتجات</Link>
            <Link className="block hover:text-white" href="/favorites">المفضلة</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-5 text-sm text-[var(--brand-soft)]">مساعدة</h3>
          <div className="space-y-3 text-sm text-white/50">
            <Link className="block hover:text-white" href="/track">تتبع طلبك</Link>
            <Link className="block hover:text-white" href="/contact">تواصل معنا</Link>
            <Link className="block hover:text-white" href="/shipping">الشحن والتوصيل</Link>
            <Link className="block hover:text-white" href="/returns">الاستبدال والاسترجاع</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl items-center justify-between border-t border-white/10 pt-6 text-[11px] text-white/30">
        <span>© 2026 DAHAB — جميع الحقوق محفوظة</span>
        <Link href="#" className="flex items-center gap-2 hover:text-white"><ArrowUp size={14} /> للأعلى</Link>
      </div>
    </footer>
  )
}
