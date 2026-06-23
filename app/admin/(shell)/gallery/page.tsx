'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button, Input, Toggle, Modal, ConfirmModal, EmptyState, Card, Spinner, Badge } from '@/components/admin/ui'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface GalleryImage {
  id: string; imageUrl: string; caption: string | null; displayOrder: number; isActive: boolean
}

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: unknown }>
}

function GalleryModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial?: GalleryImage; onSaved: () => void
}) {
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setImageUrl(initial?.imageUrl ?? ''); setCaption(initial?.caption ?? '')
      setDisplayOrder(String(initial?.displayOrder ?? 0)); setIsActive(initial?.isActive ?? true)
      setError(null)
    }
  }, [open, initial])

  async function save() {
    if (!imageUrl.trim()) { setError('Image is required'); return }
    setLoading(true)
    const body = { imageUrl: imageUrl.trim(), caption: caption.trim() || null, displayOrder: parseInt(displayOrder) || 0, isActive }
    const r = initial
      ? await api(`/api/admin/gallery/${initial.id}`, 'PUT', body)
      : await api('/api/admin/gallery', 'POST', body)
    setLoading(false)
    if (r.success) { onSaved(); onClose() } else { setError('Save failed') }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Image' : 'Add Image'}>
      <div className="space-y-4">
        <ImageUpload label="Image *" value={imageUrl} onChange={setImageUrl} />
        <Input label="Caption" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Optional caption" />
        <div className="flex items-center gap-4">
          <Input label="Display Order" type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="w-24" />
          <Toggle checked={isActive} onChange={setIsActive} label="Active" />
        </div>
        {error && <p className="font-body text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={loading}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editImage, setEditImage] = useState<GalleryImage | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    const r = await fetch('/api/admin/gallery').then(r => r.json())
    if (r.success) setImages(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await api(`/api/admin/gallery/${deleteTarget.id}`, 'DELETE')
    setDeleteLoading(false); setDeleteTarget(null); fetch_()
  }

  async function toggleActive(img: GalleryImage) {
    await api(`/api/admin/gallery/${img.id}`, 'PUT', { isActive: !img.isActive })
    fetch_()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-accent" /></div>

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl text-brand-text uppercase">Gallery</h1>
        <Button size="sm" onClick={() => { setEditImage(undefined); setModal(true) }}><Plus size={14} /> Add Image</Button>
      </div>

      {images.length === 0 ? (
        <EmptyState title="No gallery images yet" action={<Button size="sm" onClick={() => setModal(true)}><Plus size={14} /> Add Image</Button>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map(img => (
            <Card key={img.id} className="overflow-hidden group relative">
              <div className="relative aspect-square bg-brand-border">
                <Image src={img.imageUrl} alt={img.caption ?? 'Gallery'} fill sizes="250px" className={`object-cover transition-opacity ${img.isActive ? 'opacity-100' : 'opacity-40'}`} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                  <button onClick={() => toggleActive(img)} className="p-1.5 bg-brand-surface rounded-lg text-brand-text hover:text-brand-accent transition-colors" title="Toggle visibility">
                    {img.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => setDeleteTarget(img)} className="p-1.5 bg-brand-surface rounded-lg text-brand-text hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {img.caption && (
                <div className="px-2 py-1.5">
                  <p className="font-body text-xs text-brand-muted truncate">{img.caption}</p>
                </div>
              )}
              {!img.isActive && (
                <div className="absolute top-1.5 left-1.5">
                  <Badge color="red">Hidden</Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <GalleryModal open={modal} onClose={() => setModal(false)} initial={editImage} onSaved={fetch_} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading}
        title="Delete Image" message="Remove this image from the gallery? This cannot be undone." />
    </div>
  )
}
