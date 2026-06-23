'use client'

import { useEffect, useState, useCallback } from 'react'
import { Save } from 'lucide-react'
import { Button, Toggle, Card, Spinner } from '@/components/admin/ui'

interface ScheduleDay {
  id?: string; dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_DAYS: ScheduleDay[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i, openTime: '10:00', closeTime: '23:00', isClosed: false,
}))

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: unknown }>
}

export default function SchedulePage() {
  const [days, setDays] = useState<ScheduleDay[]>(DEFAULT_DAYS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [savedDays, setSavedDays] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Record<number, string>>({})

  const fetchSchedule = useCallback(async () => {
    const r = await fetch('/api/admin/schedule').then(r => r.json())
    if (r.success && Array.isArray(r.data)) {
      const serverDays = r.data as ScheduleDay[]
      setDays(DEFAULT_DAYS.map(def => {
        const found = serverDays.find(s => s.dayOfWeek === def.dayOfWeek)
        return found ?? def
      }))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  function updateDay(dayOfWeek: number, patch: Partial<ScheduleDay>) {
    setDays(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
  }

  async function saveDay(day: ScheduleDay) {
    const errs = { ...errors }
    if (!day.isClosed) {
      if (!day.openTime) { errs[day.dayOfWeek] = 'Open time required'; setErrors(errs); return }
      if (!day.closeTime) { errs[day.dayOfWeek] = 'Close time required'; setErrors(errs); return }
    }
    delete errs[day.dayOfWeek]; setErrors(errs)

    setSaving(day.dayOfWeek)
    const body = {
      dayOfWeek: day.dayOfWeek,
      openTime: day.isClosed ? day.openTime || '00:00' : day.openTime,
      closeTime: day.isClosed ? day.closeTime || '00:00' : day.closeTime,
      isClosed: day.isClosed,
    }
    const r = await api('/api/admin/schedule', 'POST', body)
    setSaving(null)
    if (r.success) {
      if (r.data && typeof r.data === 'object' && 'id' in r.data) {
        updateDay(day.dayOfWeek, { id: (r.data as { id: string }).id })
      }
      setSavedDays(prev => { const n = new Set(prev); n.add(day.dayOfWeek); return n })
      setTimeout(() => setSavedDays(prev => { const n = new Set(prev); n.delete(day.dayOfWeek); return n }), 2500)
    }
  }

  async function saveAll() {
    for (const day of days) { await saveDay(day) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-brand-accent" /></div>

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-brand-text uppercase">Schedule</h1>
          <p className="font-body text-xs text-brand-dim mt-0.5">Set opening hours for each day of the week.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={saveAll} loading={saving !== null}>
          <Save size={14} /> Save All
        </Button>
      </div>

      <Card className="divide-y divide-brand-border">
        {days.map(day => (
          <div key={day.dayOfWeek} className="px-5 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Day name */}
              <div className="w-28 flex-shrink-0">
                <p className="font-body text-sm font-semibold text-brand-text">{DAY_NAMES[day.dayOfWeek]}</p>
              </div>

              {/* Closed toggle */}
              <Toggle checked={!day.isClosed} onChange={open => updateDay(day.dayOfWeek, { isClosed: !open })} label={day.isClosed ? 'Closed' : 'Open'} />

              {/* Time inputs */}
              {!day.isClosed && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <label className="font-body text-xs text-brand-dim flex-shrink-0">From</label>
                    <input type="time" value={day.openTime} onChange={e => updateDay(day.dayOfWeek, { openTime: e.target.value })}
                      className="bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 font-body text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="font-body text-xs text-brand-dim flex-shrink-0">To</label>
                    <input type="time" value={day.closeTime} onChange={e => updateDay(day.dayOfWeek, { closeTime: e.target.value })}
                      className="bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 font-body text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors" />
                  </div>
                </div>
              )}

              {day.isClosed && <div className="flex-1" />}

              {/* Save button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {errors[day.dayOfWeek] && <span className="font-body text-xs text-red-400">{errors[day.dayOfWeek]}</span>}
                {savedDays.has(day.dayOfWeek) && <span className="font-body text-xs text-green-400">Saved!</span>}
                <Button size="sm" variant="ghost" onClick={() => saveDay(day)} loading={saving === day.dayOfWeek}>
                  <Save size={12} /> Save
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
