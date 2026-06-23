'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button, Input, Textarea, Select, Toggle, Modal, ConfirmModal, EmptyState, Card, Spinner, Stars, Badge } from '@/components/admin/ui'

interface Testimonial {
  id: string; customerName: string; rating: number; reviewText: string
  source: string | null; displayOrder: number; isActive: boolean; createdAt: string
}

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: unknown }>
}

const RATING_OPTIONS = [
  { value: '5', label: '5 stars' }, { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' }, { value: '2', label: '2 stars' }, { value: '1', label: '1 star' },
]

function TestimonialModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial?: Testimonial; onSaved: () => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState('5')
  const [reviewText, setReviewText] = useState('')
  const [source, setSource] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCustomerName(initial?.customerName ?? ''); setRating(String(initial?.rating ?? 5))
      setReviewText(initial?.reviewText ?? ''); setSource(initial?.source ?? '')
      setDisplayOrder(String(initial?.displayOrder ?? 0)); setIsActive(initial?.isActive ?? true)
      setError(null)
    }
  }, [open, initial])

  async function save() {
    if (!customerName.trim()) { setError('Customer name is required'); return }
    if (!reviewText.trim()) { setError('Review text is required'); return }
    setLoading(true)
    const body = {
      customerName: customerName.trim(), rating: parseInt(rating),
      reviewText: reviewText.trim(), source: source.trim() || null,
      displayOrder: parseInt(displayOrder) || 0, isActive,
    }
    const r = initial
      ? await api(`/api/admin/testimonials/${initial.id}`, 'PUT', body)
      : await api('/api/admin/testimonials', 'POST', body)
    setLoading(false)
    if (r.success) { onSaved(); onClose() } else { setError('Save failed') }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Testimonial' : 'New Testimonial'}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <Select label="Rating *" options={RATING_OPTIONS} value={rating} onChange={e => setRating(e.target.value)} />
        </div>
        <Textarea label="Review *" value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} />
        <Input label="Source" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Google Reviews" />
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

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<Testimonial | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    const r = await fetch('/api/admin/testimonials').then(r => r.json())
    if (r.success) setTestimonials(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await api(`/api/admin/testimonials/${deleteTarget.id}`, 'DELETE')
    setDeleteLoading(false); setDeleteTarget(null); fetchAll()
  }

  async function toggleActive(t: Testimonial) {
    await api(`/api/admin/testimonials/${t.id}`, 'PUT', { isActive: !t.isActive })
    fetchAll()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-accent" /></div>

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl text-brand-text uppercase">Testimonials</h1>
        <Button size="sm" onClick={() => { setEditItem(undefined); setModal(true) }}><Plus size={14} /> New Testimonial</Button>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState title="No testimonials yet" action={<Button size="sm" onClick={() => setModal(true)}><Plus size={14} /> New Testimonial</Button>} />
      ) : (
        <div className="space-y-3">
          {testimonials.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-body text-sm font-semibold text-brand-text">{t.customerName}</p>
                    {t.source && <span className="font-body text-xs text-brand-dim">via {t.source}</span>}
                    <button onClick={() => toggleActive(t)}>
                      <Badge color={t.isActive ? 'green' : 'red'}>{t.isActive ? 'Active' : 'Hidden'}</Badge>
                    </button>
                  </div>
                  <Stars rating={t.rating} />
                  <p className="font-body text-sm text-brand-muted mt-1.5 leading-relaxed">{t.reviewText}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditItem(t); setModal(true) }} className="text-brand-dim hover:text-brand-accent p-1.5 rounded hover:bg-brand-surface transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteTarget(t)} className="text-brand-dim hover:text-red-400 p-1.5 rounded hover:bg-brand-surface transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TestimonialModal open={modal} onClose={() => setModal(false)} initial={editItem} onSaved={fetchAll} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading}
        title="Delete Testimonial" message={`Delete review by "${deleteTarget?.customerName}"?`} />
    </div>
  )
}
