"use client"

import { useEffect, useState } from "react"
import { fetchSettings } from "../lib/api"

const DEFAULT_LOGO = "/logo.png"

/**
 * لوجو الموقع — بيقرا الصورة من إعدادات المتجر (لو الأدمن غيّرها من لوحة
 * التحكم)، ولو مفيش إعداد محفوظ بيستخدم اللوجو الافتراضي.
 */
export default function SiteLogo({
  className = "h-10 w-auto object-contain",
  alt = "دهب",
}: {
  className?: string
  alt?: string
}) {
  const [src, setSrc] = useState(DEFAULT_LOGO)

  useEffect(() => {
    let active = true

    fetchSettings().then((settings) => {
      if (!active) return
      if (settings.site_logo) setSrc(settings.site_logo)
    })

    return () => {
      active = false
    }
  }, [])

  return <img src={src} alt={alt} className={className} />
}
