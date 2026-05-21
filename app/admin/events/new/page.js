'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    date: '',
    venue: '',
    city: '',
    notification_offset_minutes: 5,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setSaving(false)
      return
    }
    router.push(`/admin/import?event=${data.event.id}`)
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-DEFAULT">New Event</h1>
        <p className="text-gray-500 text-sm mt-1">Set up a new event. You can import the agenda and delegates on the next step.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Event Name</label>
            <input
              className="input"
              placeholder="e.g. Meet The Managers 2026 — Cape Town"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                className="input"
                placeholder="e.g. Cape Town"
                value={form.city}
                onChange={e => update('city', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Venue</label>
            <input
              className="input"
              placeholder="e.g. Cape Town International Convention Centre (CTICC)"
              value={form.venue}
              onChange={e => update('venue', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Notification Timing</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="30"
                className="input w-24"
                value={form.notification_offset_minutes}
                onChange={e => update('notification_offset_minutes', parseInt(e.target.value))}
              />
              <span className="text-sm text-gray-500">minutes before the next session starts</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Delegates will receive their WhatsApp rating prompt this many minutes before the next session begins.</p>
          </div>

          {error && <p className="text-sm text-pink-brand">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Event & Import Data →'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
