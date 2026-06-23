'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button, Input, Textarea, Toggle, Modal, ConfirmModal, EmptyState, Card, Spinner, Badge } from '@/components/admin/ui'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface ComboDeal {
  id: string; dealNumber: string; title: string; description: string | null
  imageUrl: string | null; price: string | number; isActive: boolean; displayOrder: number
}

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: unknown }>
}

function DealModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial?: ComboDeal; onSaved: () => void
}) {
  const [dealNumber, setDealNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [displayOrder, setDisplayOrder] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDealNumber(initial?.dealNumber ?? ''); setTitle(initial?.title ?? '')
      setDescription(initial?.description ?? ''); setImageUrl(initial?.imageUrl ?? '')
      setPrice(initial ? String(initial.price) : ''); setIsActive(initial?.isActive ?? true)
      setDisplayOrder(String(initial?.displayOrder ?? 0)); setError(null)
    }
  }, [open, initial])

  async function save() {
    if (!dealNumber.trim()) { setError('Deal number is required'); return }
    if (!title.trim()) { setError('Title is required'); return }
    if (!parseFloat(price) || parseFloat(price) <= 0) { setError('Valid price is required'); return }
    setLoading(true)
    const body = {
      dealNumber: dealNumber.trim(), title: title.trim(),
      description: description.trim() || null, imageUrl: imageUrl || null,
      price: parseFloat(price), isActive, displayOrder: parseInt(displayOrder) || 0,
    }
    const r = initial
      ? await api(`/api/admin/combo-deals/${initial.id}`, 'PUT', body)
      : await api('/api/admin/combo-deals', 'POST', body)
    setLoading(false)
    if (r.success) { onSaved(); onClose() } else { setError(typeof r.error === 'string' ? r.error : 'Save failed') }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Combo Deal' : 'New Combo Deal'} width="max-w-xl">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Deal Number *" value={dealNumber} onChange={e => setDealNumber(e.target.value)} placeholder="01" />
          <Input label="Price (Rs.) *" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Family Deal" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <ImageUpload label="Image" value={imageUrl} onChange={setImageUrl} />
        <div className="flex gap-6">
          <Toggle checked={isActive} onChange={setIsActive} label="Active" />
          <Input label="Display Order" type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="w-24" />
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

export default function ComboDealsPage() {
  const [deals, setDeals] = useState<ComboDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editDeal, setEditDeal] = useState<ComboDeal | undefined>()
  const [deleteDeal, setDeleteDeal] = useState<ComboDeal | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchDeals = useCallback(async () => {
    const r = await fetch('/api/admin/combo-deals').then(r => r.json())
    if (r.success) setDeals(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  async function handleDelete() {
    if (!deleteDeal) return
    setDeleteLoading(true)
    await api(`/api/admin/combo-deals/${deleteDeal.id}`, 'DELETE')
    setDeleteLoading(false); setDeleteDeal(null); fetchDeals()
  }

  async function toggleActive(deal: ComboDeal) {
    await api(`/api/admin/combo-deals/${deal.id}`, 'PUT', { isActive: !deal.isActive })
    fetchDeals()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-accent" /></div>

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl text-brand-text uppercase">Combo Deals</h1>
        <Button size="sm" onClick={() => { setEditDeal(undefined); setModal(true) }}><Plus size={14} /> New Deal</Button>
      </div>

      {deals.length === 0 ? (
        <EmptyState title="No combo deals yet" action={<Button size="sm" onClick={() => setModal(true)}><Plus size={14} /> New Deal</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => (
            <Card key={deal.id} className="overflow-hidden">
              {deal.imageUrl && (
                <div className="relative h-36 bg-brand-border">
                  <Image src={deal.imageUrl} alt={deal.title} fill sizes="300px" className="object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-body text-xs text-brand-dim">Deal {deal.dealNumber}</p>
                    <p className="font-body text-sm font-semibold text-brand-text">{deal.title}</p>
                  </div>
                  <span className="font-display font-bold text-base text-brand-accent whitespace-nowrap">{formatPrice(deal.price)}</span>
                </div>
                {deal.description && <p className="font-body text-xs text-brand-dim mb-3 line-clamp-2">{deal.description}</p>}
                <div className="flex items-center justify-between">
                  <button onClick={() => toggleActive(deal)}>
                    <Badge color={deal.isActive ? 'green' : 'red'}>{deal.isActive ? 'Active' : 'Inactive'}</Badge>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditDeal(deal); setModal(true) }} className="text-brand-dim hover:text-brand-accent p-1.5 rounded hover:bg-brand-surface transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteDeal(deal)} className="text-brand-dim hover:text-red-400 p-1.5 rounded hover:bg-brand-surface transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DealModal open={modal} onClose={() => setModal(false)} initial={editDeal} onSaved={fetchDeals} />
      <ConfirmModal open={!!deleteDeal} onClose={() => setDeleteDeal(null)} onConfirm={handleDelete} loading={deleteLoading}
        title="Delete Combo Deal" message={`Delete "${deleteDeal?.title}"? This cannot be undone.`} />
    </div>
  )
}
