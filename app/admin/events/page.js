'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => {
      setEvents(d.events || [])
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-DEFAULT">Events</h1>
          <p className="text-gray-500 text-sm mt-1">All FundHub events.</p>
        </div>
        <Link href="/admin/events/new" className="btn-primary">+ New Event</Link>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Loading…</p>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No events created yet.</p>
            <Link href="/admin/events/new" className="btn-cyan">Create your first event</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div>
                  <p className="font-semibold text-navy-DEFAULT">{event.name}</p>
                  <p className="text-sm text-gray-500">{event.venue} · {event.city} · {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/import?event=${event.id}`} className="btn-secondary text-xs px-3 py-1.5">Import</Link>
                  <Link href={`/admin/results?event=${event.id}`} className="btn-primary text-xs px-3 py-1.5">Results</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
