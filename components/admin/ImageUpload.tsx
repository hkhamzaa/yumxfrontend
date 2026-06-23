'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Cloudinary not configured (set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const json = (await res.json()) as { secure_url: string }
      onChange(json.secure_url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide">{label}</span>
      )}

      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-brand-border group">
          <Image src={value} alt="Upload preview" fill className="object-cover" sizes="400px" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-brand-surface text-brand-text text-xs font-body font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-brand-border transition-colors"
            >
              <Upload size={12} /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-600/80 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-colors"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer',
            uploading ? 'border-brand-accent/40 cursor-wait' : 'border-brand-border hover:border-brand-accent/50'
          )}
        >
          {uploading ? (
            <><Loader2 size={20} className="animate-spin text-brand-accent" />
            <span className="font-body text-xs text-brand-muted">Uploading…</span></>
          ) : (
            <><Upload size={20} className="text-brand-dim" />
            <span className="font-body text-xs text-brand-muted">Click or drag to upload image</span></>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = '' } }}
      />

      {/* URL fallback */}
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Or paste image URL…"
        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 font-body text-xs text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors"
      />

      {error && <p className="font-body text-xs text-red-400">{error}</p>}
    </div>
  )
}
