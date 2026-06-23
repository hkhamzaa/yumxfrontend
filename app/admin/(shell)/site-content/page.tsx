'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Save, Trash2, ExternalLink } from 'lucide-react'
import { Button, Input, Textarea, Modal, ConfirmModal, Card, Spinner } from '@/components/admin/ui'

interface SiteContentRow { id: string; key: string; value: string; updatedAt: string }

// ─── Friendly labels for known keys ──────────────────────────────────────────
const KNOWN_KEYS: Record<string, { label: string; type: 'text' | 'textarea' | 'url' | 'number' | 'tel'; description?: string }> = {
  delivery_fee:          { label: 'Delivery Fee (Rs.)', type: 'number', description: 'Charged on all delivery orders' },
  phone:                 { label: 'Phone Number', type: 'tel' },
  whatsapp_number:       { label: 'WhatsApp Number', type: 'tel', description: 'Include country code, e.g. 923001234567' },
  whatsapp_message:      { label: 'Default WhatsApp Message', type: 'textarea' },
  address:               { label: 'Restaurant Address', type: 'textarea' },
  email:                 { label: 'Contact Email', type: 'text' },
  instagram_url:         { label: 'Instagram URL', type: 'url' },
  facebook_url:          { label: 'Facebook URL', type: 'url' },
  home_hero_title:       { label: 'Homepage Hero Title', type: 'text' },
  home_hero_subtitle:    { label: 'Homepage Hero Subtitle', type: 'textarea' },
  about_us:              { label: 'About Us Text', type: 'textarea' },
}

const INTERNAL_KEYS = ['_order_seq']

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: unknown }>
}

function ContentField({ row, onSaved, onDelete }: { row: SiteContentRow; onSaved: () => void; onDelete: () => void }) {
  const [value, setValue] = useState(row.value)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const isDirty = value !== row.value
  const meta = KNOWN_KEYS[row.key]
  const label = meta?.label ?? row.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const type = meta?.type ?? 'text'

  async function save() {
    setLoading(true)
    const r = await api(`/api/admin/site-content/${row.id}`, 'PUT', { value })
    setLoading(false)
    if (r.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved() }
  }

  const inputClass = "w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide">{label}</label>
          {meta?.description && <p className="font-body text-xs text-brand-dim mt-0.5">{meta.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {type === 'url' && value && (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand-dim hover:text-brand-accent p-1"><ExternalLink size={12} /></a>
          )}
          {saved && <span className="font-body text-xs text-green-400">Saved!</span>}
          <Button size="sm" variant={isDirty ? 'primary' : 'ghost'} onClick={save} loading={loading} disabled={!isDirty}>
            <Save size={12} /> {isDirty ? 'Save' : 'Saved'}
          </Button>
          <button onClick={onDelete} className="text-brand-dim hover:text-red-400 p-1.5 rounded hover:bg-brand-surface transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => setValue(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
      ) : (
        <input type={type === 'number' ? 'number' : type === 'url' ? 'url' : type === 'tel' ? 'tel' : 'text'}
          value={value} onChange={e => setValue(e.target.value)} className={inputClass} />
      )}
    </div>
  )
}

function AddKeyModal({ open, onClose, onSaved, existingKeys }: {
  open: boolean; onClose: () => void; onSaved: () => void; existingKeys: string[]
}) {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (open) { setKey(''); setValue(''); setError(null) } }, [open])

  async function save() {
    const k = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
    if (!k) { setError('Key is required'); return }
    if (existingKeys.includes(k)) { setError('Key already exists'); return }
    setLoading(true)
    const r = await api('/api/admin/site-content', 'POST', { key: k, value })
    setLoading(false)
    if (r.success) { onSaved(); onClose() } else { setError('Failed to add key') }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Content Key">
      <div className="space-y-4">
        <Input label="Key (lowercase + underscores)" value={key} onChange={e => setKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))} placeholder="my_custom_key" />
        <Textarea label="Value" value={value} onChange={e => setValue(e.target.value)} rows={3} />
        {error && <p className="font-body text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={loading}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SiteContentPage() {
  const [rows, setRows] = useState<SiteContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SiteContentRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    const r = await fetch('/api/admin/site-content').then(r => r.json())
    if (r.success) setRows((r.data as SiteContentRow[]).filter(row => !INTERNAL_KEYS.includes(row.key)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await api(`/api/admin/site-content/${deleteTarget.id}`, 'DELETE')
    setDeleteLoading(false); setDeleteTarget(null); fetchAll()
  }

  // Sort: known keys first in KNOWN_KEYS order, then alphabetically
  const knownOrder = Object.keys(KNOWN_KEYS)
  const sorted = [...rows].sort((a, b) => {
    const ai = knownOrder.indexOf(a.key), bi = knownOrder.indexOf(b.key)
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return -1
    if (bi >= 0) return 1
    return a.key.localeCompare(b.key)
  })

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-accent" /></div>

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-brand-text uppercase">Site Content</h1>
          <p className="font-body text-xs text-brand-dim mt-0.5">Changes save individually — click Save next to each field.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setAddModal(true)}><Plus size={14} /> Add Key</Button>
      </div>

      <Card className="p-5 divide-y divide-brand-border">
        {sorted.map((row, i) => (
          <div key={row.id} className={i > 0 ? 'pt-5 mt-5' : ''}>
            <ContentField row={row} onSaved={fetchAll} onDelete={() => setDeleteTarget(row)} />
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="font-body text-sm text-brand-muted text-center py-8">No content keys yet.</p>
        )}
      </Card>

      <AddKeyModal open={addModal} onClose={() => setAddModal(false)} onSaved={fetchAll} existingKeys={rows.map(r => r.key)} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading}
        title="Delete Content Key" message={`Delete key "${deleteTarget?.key}"? This may break frontend content that reads this key.`} />
    </div>
  )
}
