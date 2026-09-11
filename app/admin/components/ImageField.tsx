"use client"

import { useRef, useState } from "react"
import { uploadImage } from "../../lib/api"

/**
 * حقل صورة عام لاستخدامه في أي صفحة أدمن: تقدري تلصقي رابط الصورة، أو
 * ترفعي صورة من جهازك مباشرة (بترفع على Cloudinary وترجع لينك جاهز).
 */
export default function ImageField({
  fieldKey,
  value,
  onChange,
  previewClassName = "h-36 w-full rounded-xl object-cover",
}: {
  fieldKey: string
  value: string
  onChange: (key: string, value: string) => void
  previewClassName?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError("")
    try {
      const url = await uploadImage(file)
      onChange(fieldKey, url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "فشل الرفع")
    } finally {
      setUploading(false)
      // reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      {/* URL input + upload button side by side */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder="رابط الصورة أو ارفع من جهازك ←"
          className="min-w-0 flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-xl border border-[var(--brand)] px-4 py-2 text-sm text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white disabled:opacity-50"
        >
          {uploading ? "جارِ الرفع..." : "⬆ رفع صورة"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      {/* Preview */}
      {value && (
        <div>
          <p className="mb-1 text-xs text-gray-400">معاينة:</p>
          <img
            src={value}
            alt="preview"
            className={previewClassName}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      )}
    </div>
  )
}
