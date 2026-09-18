"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import SiteHeader from "./SiteHeader"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`dahab-loading-shimmer ${className}`} aria-hidden="true" />
}

export function DahabPageLoading({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div className="dahab-page-loading" aria-busy="true" aria-label="جاري تحميل الصفحة">
      {withHeader && <SiteHeader />}
      <main className="mx-auto min-h-[calc(100vh-80px)] max-w-7xl px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <Skeleton className="mx-auto h-3 w-24 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-12 w-[min(560px,90%)] rounded-2xl" />
          <Skeleton className="mx-auto mt-4 h-4 w-[min(440px,80%)] rounded-full" />
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item}>
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <Skeleton className="mt-4 h-4 w-3/4 rounded-full" />
              <Skeleton className="mt-3 h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function NavigationLoading() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)

    let timer: ReturnType<typeof setTimeout> | null = null

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as Element | null
      const link = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return

      const href = link.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return

      let url: URL
      try {
        url = new URL(link.href, window.location.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      const current = window.location.pathname + window.location.search
      const next = url.pathname + url.search
      if (current === next) return

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setVisible(true), 70)
    }

    document.addEventListener("click", handleClick, true)
    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener("click", handleClick, true)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-[var(--bg)]">
      <div className="pt-20">
        <DahabPageLoading withHeader={false} />
      </div>
    </div>
  )
}
