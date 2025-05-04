import * as React from "react"

export function Avatar({ src, alt, fallback }: { src?: string; alt?: string; fallback?: React.ReactNode }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
      {fallback}
    </div>
  )
}