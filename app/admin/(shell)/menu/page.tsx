'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button, Input, Textarea, Select, Toggle, Modal, ConfirmModal, EmptyState, Card, Spinner, Badge } from '@/components/admin/ui'
import { ImageUpload } from '@/components/admin/ImageUpload'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; slug: string; imageUrl: string | null; displayOrder: number; isActive: boolean; _count?: { items: number } }
interface Variant { id: string; label: string; price: string | number }
interface MenuItem { id: string; name: string; description: string | null; imageUrl: string | null; categoryId: string; isAvailable: boolean; isFeatured: boolean; variants: Variant[]; category: { name: string } }

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: unknown }>
}

// ─── Category Form Modal ──────────────────────────────────────────────────────

function CategoryModal({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void
  initial?: Category; onSaved: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [displayOrder, setDisplayOrder] = useState(String(initial?.displayOrder ?? 0))
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setImageUrl(initial?.imageUrl ?? '')
      setDisplayOrder(String(initial?.displayOrder ?? 0))
      setIsActive(initial?.isActive ?? true)
      setError(null)
    }
  }, [open, initial])

  async function save() {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    const body = { name: name.trim(), imageUrl: imageUrl || null, displayOrder: parseInt(displayOrder) || 0, isActive }
    const r = initial
      ? await api(`/api/admin/menu/categories/${initial.id}`, 'PUT', body)
      : await api('/api/admin/menu/categories', 'POST', body)
    setLoading(false)
    if (r.success) { onSaved(); onClose() } else { setError(typeof r.error === 'string' ? r.error : 'Save failed') }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Category' : 'New Category'}>
      <div className="space-y-4">
        <Input label="Name *" value={name} onChange={e => setName(e.target.value)} error={error ?? undefined} />
        <ImageUpload label="Category Image" value={imageUrl} onChange={setImageUrl} />
        <Input label="Display Order" type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} />
        <Toggle checked={isActive} onChange={setIsActive} label="Active" />
        {error && <p className="font-body text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={loading}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Variant row (inline form) ────────────────────────────────────────────────

function VariantRow({ variant, itemId, onSaved, onDelete, isOnly }: {
  variant: Variant; itemId: string; onSaved: () => void; onDelete: () => void; isOnly: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(variant.label)
  const [price, setPrice] = useState(String(variant.price))
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    const r = await api(`/api/admin/menu/items/${itemId}/variants/${variant.id}`, 'PUT', {
      label: label.trim(), price: parseFloat(price),
    })
    setLoading(false)
    if (r.success) { setEditing(false); onSaved() }
  }

  async function del() {
    if (isOnly) return
    await api(`/api/admin/menu/items/${itemId}/variants/${variant.id}`, 'DELETE')
    onSaved(); onDelete()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label"
          className="flex-1 bg-brand-bg border border-brand-border rounded px-2 py-1 font-body text-xs text-brand-text focus:outline-none focus:border-brand-accent" />
        <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" placeholder="Price"
          className="w-24 bg-brand-bg border border-brand-border rounded px-2 py-1 font-body text-xs text-brand-text focus:outline-none focus:border-brand-accent" />
        <button onClick={save} disabled={loading} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} className="text-brand-dim hover:text-brand-text p-1 text-xs">✕</button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-1.5 group">
      <span className="font-body text-sm text-brand-text">{variant.label}</span>
      <div className="flex items-center gap-3">
        <span className="font-body text-sm text-brand-muted tabular-nums">{formatPrice(variant.price)}</span>
        <button onClick={() => setEditing(true)} className="text-brand-dim hover:text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity p-1"><Pencil size={12} /></button>
        <button onClick={del} disabled={isOnly} className="text-brand-dim hover:text-red-400 disabled:opacity-20 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

// ─── Item Form Modal ──────────────────────────────────────────────────────────

function ItemModal({ open, onClose, initial, categories, onSaved }: {
  open: boolean; onClose: () => void
  initial?: MenuItem; categories: Category[]; onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [variants, setVariants] = useState<{ label: string; price: string }[]>([{ label: '', price: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? ''); setDescription(initial?.description ?? ''); setImageUrl(initial?.imageUrl ?? '')
      setCategoryId(initial?.categoryId ?? categories[0]?.id ?? ''); setIsAvailable(initial?.isAvailable ?? true)
      setIsFeatured(initial?.isFeatured ?? false)
      setVariants(initial?.variants.map(v => ({ label: v.label, price: String(v.price) })) ?? [{ label: 'Regular', price: '' }])
      setError(null)
    }
  }, [open, initial, categories])

  async function save() {
    if (!name.trim()) { setError('Name is required'); return }
    if (!categoryId) { setError('Category is required'); return }
    const validVariants = variants.filter(v => v.label.trim() && parseFloat(v.price) > 0)
    if (!validVariants.length) { setError('At least one variant with label and price is required'); return }
    setLoading(true)

    if (initial) {
      await api(`/api/admin/menu/items/${initial.id}`, 'PUT', {
        name: name.trim(), description: description.trim() || null, imageUrl: imageUrl || null,
        categoryId, isAvailable, isFeatured,
      })
      // Sync variants: current variants from modal form vs server
    } else {
      await api('/api/admin/menu/items', 'POST', {
        name: name.trim(), description: description.trim() || null, imageUrl: imageUrl || null,
        categoryId, isAvailable, isFeatured,
        variants: validVariants.map(v => ({ label: v.label.trim(), price: parseFloat(v.price) })),
      })
    }
    setLoading(false)
    onSaved(); onClose()
  }

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Item' : 'New Menu Item'} width="max-w-2xl">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name *" value={name} onChange={e => setName(e.target.value)} />
          <Select label="Category *" options={catOptions} value={categoryId} onChange={e => setCategoryId(e.target.value)} />
        </div>
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <ImageUpload label="Image" value={imageUrl} onChange={setImageUrl} />
        <div className="flex gap-6">
          <Toggle checked={isAvailable} onChange={setIsAvailable} label="Available" />
          <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured" />
        </div>

        {!initial && (
          <div>
            <p className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Variants *</p>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={v.label} onChange={e => { const n = [...variants]; n[i].label = e.target.value; setVariants(n) }}
                    placeholder="Label (e.g. Regular, Large)"
                    className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-2 font-body text-sm text-brand-text focus:outline-none focus:border-brand-accent" />
                  <input value={v.price} onChange={e => { const n = [...variants]; n[i].price = e.target.value; setVariants(n) }}
                    placeholder="Price" type="number" step="0.01"
                    className="w-28 bg-brand-bg border border-brand-border rounded-lg px-3 py-2 font-body text-sm text-brand-text focus:outline-none focus:border-brand-accent" />
                  {variants.length > 1 && (
                    <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-brand-dim hover:text-red-400 p-1"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setVariants([...variants, { label: '', price: '' }])}
                className="flex items-center gap-1 font-body text-xs text-brand-accent hover:underline mt-1">
                <Plus size={12} /> Add variant
              </button>
            </div>
          </div>
        )}

        {error && <p className="font-body text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={loading}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Item row with expandable variants ───────────────────────────────────────

function ItemRow({ item, categories, onRefresh, onEdit, onDelete }: {
  item: MenuItem; categories: Category[]; onRefresh: () => void
  onEdit: (item: MenuItem) => void; onDelete: (item: MenuItem) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [variants, setVariants] = useState<Variant[]>(item.variants)
  const [addLabel, setAddLabel] = useState(''); const [addPrice, setAddPrice] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  async function addVariant() {
    if (!addLabel.trim() || !parseFloat(addPrice)) return
    setAddLoading(true)
    const r = await api(`/api/admin/menu/items/${item.id}/variants`, 'POST', { label: addLabel.trim(), price: parseFloat(addPrice) })
    setAddLoading(false)
    if (r.success) { setAddLabel(''); setAddPrice(''); onRefresh() }
  }

  async function toggleAvail() {
    await api(`/api/admin/menu/items/${item.id}`, 'PUT', { isAvailable: !item.isAvailable })
    onRefresh()
  }

  return (
    <>
      <tr className="hover:bg-brand-bg/40 transition-colors">
        <td className="px-4 py-3">
          {item.imageUrl ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-brand-border flex-shrink-0">
              <Image src={item.imageUrl} alt={item.name} fill sizes="40px" className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-border flex items-center justify-center text-lg">🍔</div>
          )}
        </td>
        <td className="px-4 py-3">
          <p className="font-body text-sm font-semibold text-brand-text">{item.name}</p>
          <p className="font-body text-xs text-brand-dim">{item.category.name}</p>
        </td>
        <td className="px-4 py-3 font-body text-xs text-brand-muted">{item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}</td>
        <td className="px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            {item.isFeatured && <Badge color="orange">Featured</Badge>}
            <Badge color={item.isAvailable ? 'green' : 'red'}>{item.isAvailable ? 'Available' : 'Unavailable'}</Badge>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={toggleAvail} className="text-brand-dim hover:text-brand-accent p-1.5 rounded-lg hover:bg-brand-surface transition-colors" title="Toggle availability"><Check size={14} /></button>
            <button onClick={() => onEdit(item)} className="text-brand-dim hover:text-brand-accent p-1.5 rounded-lg hover:bg-brand-surface transition-colors"><Pencil size={14} /></button>
            <button onClick={() => onDelete(item)} className="text-brand-dim hover:text-red-400 p-1.5 rounded-lg hover:bg-brand-surface transition-colors"><Trash2 size={14} /></button>
            <button onClick={() => setExpanded(e => !e)} className="text-brand-dim hover:text-brand-text p-1.5 rounded-lg hover:bg-brand-surface transition-colors">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 pb-3 bg-brand-bg/30">
            <p className="font-body text-xs text-brand-dim uppercase tracking-wide mb-2 pt-2">Variants</p>
            <div className="divide-y divide-brand-border/50 mb-3">
              {item.variants.map(v => (
                <VariantRow key={v.id} variant={v} itemId={item.id} onSaved={onRefresh} onDelete={onRefresh} isOnly={item.variants.length === 1} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="New variant label"
                className="flex-1 bg-brand-bg border border-brand-border rounded px-2 py-1.5 font-body text-xs text-brand-text focus:outline-none focus:border-brand-accent" />
              <input value={addPrice} onChange={e => setAddPrice(e.target.value)} type="number" step="0.01" placeholder="Price"
                className="w-24 bg-brand-bg border border-brand-border rounded px-2 py-1.5 font-body text-xs text-brand-text focus:outline-none focus:border-brand-accent" />
              <Button size="sm" onClick={addVariant} loading={addLoading}><Plus size={13} /></Button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('')
  const [tab, setTab] = useState<'items' | 'categories'>('items')

  // Modals
  const [catModal, setCatModal] = useState(false)
  const [editCat, setEditCat] = useState<Category | undefined>()
  const [itemModal, setItemModal] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'cat' | 'item'; id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    const [catRes, itemRes] = await Promise.all([
      fetch('/api/admin/menu/categories').then(r => r.json()),
      fetch(`/api/admin/menu/items${catFilter ? `?categoryId=${catFilter}` : ''}?limit=100`).then(r => r.json()),
    ])
    if (catRes.success) setCategories(catRes.data)
    if (itemRes.success) setItems(itemRes.data.items)
    setLoading(false)
  }, [catFilter])

  useEffect(() => { setLoading(true); fetchAll() }, [fetchAll])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    if (deleteTarget.type === 'cat') await api(`/api/admin/menu/categories/${deleteTarget.id}`, 'DELETE')
    else await api(`/api/admin/menu/items/${deleteTarget.id}`, 'DELETE')
    setDeleteLoading(false)
    setDeleteTarget(null)
    fetchAll()
  }

  const catOptions = [{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display font-black text-2xl text-brand-text uppercase">Menu</h1>
        <Button size="sm" onClick={() => { tab === 'categories' ? (setEditCat(undefined), setCatModal(true)) : (setEditItem(undefined), setItemModal(true)) }}>
          <Plus size={14} /> Add {tab === 'categories' ? 'Category' : 'Item'}
        </Button>
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 w-fit">
        {(['items', 'categories'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg font-body text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted hover:text-brand-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-accent" /></div>
      ) : tab === 'categories' ? (
        // ── Categories tab ───
        categories.length === 0 ? (
          <EmptyState title="No categories yet" action={<Button size="sm" onClick={() => setCatModal(true)}><Plus size={14} /> Add Category</Button>} />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-brand-border">
                {['', 'Name', 'Slug', 'Order', 'Status', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-body text-xs font-semibold text-brand-dim uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-brand-border">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-brand-bg/40">
                    <td className="px-4 py-3">
                      {cat.imageUrl ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-brand-border flex-shrink-0">
                          <Image src={cat.imageUrl} alt={cat.name} fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-border flex items-center justify-center text-lg">🏷️</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-semibold text-brand-text">{cat.name}</td>
                    <td className="px-4 py-3 font-body text-xs text-brand-dim">{cat.slug}</td>
                    <td className="px-4 py-3 font-body text-xs text-brand-muted">{cat.displayOrder}</td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-xs font-semibold ${cat.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditCat(cat); setCatModal(true) }} className="text-brand-dim hover:text-brand-accent p-1.5 rounded-lg hover:bg-brand-surface"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget({ type: 'cat', id: cat.id, name: cat.name })} className="text-brand-dim hover:text-red-400 p-1.5 rounded-lg hover:bg-brand-surface"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : (
        // ── Items tab ───
        <>
          <div className="w-48">
            <Select options={catOptions} value={catFilter} onChange={e => setCatFilter(e.target.value)} />
          </div>
          {items.length === 0 ? (
            <EmptyState title="No items yet" action={<Button size="sm" onClick={() => setItemModal(true)}><Plus size={14} /> Add Item</Button>} />
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-brand-border">
                    {['', 'Name', 'Variants', 'Status', ''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left font-body text-xs font-semibold text-brand-dim uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-brand-border">
                    {items.map(item => (
                      <ItemRow key={item.id} item={item} categories={categories} onRefresh={fetchAll}
                        onEdit={i => { setEditItem(i); setItemModal(true) }}
                        onDelete={i => setDeleteTarget({ type: 'item', id: i.id, name: i.name })} />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards for items */}
              <div className="md:hidden divide-y divide-brand-border">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    {item.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />
                      </div>
                    ) : <div className="w-12 h-12 rounded-lg bg-brand-border flex items-center justify-center text-xl flex-shrink-0">🍔</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-brand-text truncate">{item.name}</p>
                      <p className="font-body text-xs text-brand-dim">{item.category.name} · {item.variants.length} variant(s)</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(item); setItemModal(true) }} className="text-brand-dim hover:text-brand-accent p-2"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })} className="text-brand-dim hover:text-red-400 p-2"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <CategoryModal open={catModal} onClose={() => setCatModal(false)} initial={editCat} onSaved={fetchAll} />
      <ItemModal open={itemModal} onClose={() => setItemModal(false)} initial={editItem} categories={categories} onSaved={fetchAll} />
      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading}
        title={`Delete ${deleteTarget?.type === 'cat' ? 'Category' : 'Item'}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
