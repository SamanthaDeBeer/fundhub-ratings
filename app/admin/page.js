'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-DEFAULT">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your FundHub events and ratings.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/events/new" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-navy-DEFAULT/10 flex items-center justify-center text-xl flex-shrink-0">📅</div>
            <div>
              <p className="font-semibold text-navy-DEFAULT group-hover:text-navy-light">New Event</p>
              <p className="text-xs text-gray-500 mt-0.5">Create a new event and configure rooms</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/import" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-brand/20 flex items-center justify-center text-xl flex-shrink-0">⬆</div>
            <div>
              <p className="font-semibold text-navy-DEFAULT group-hover:text-navy-light">Import Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Upload agenda and delegate spreadsheets</p>
            </div>
          </div>
        </Link>
        <Link href="/scan" target="_blank" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-brand/10 flex items-center justify-center text-xl flex-shrink-0">⊙</div>
            <div>
              <p className="font-semibold text-navy-DEFAULT group-hover:text-navy-light">Open Scanner</p>
              <p className="text-xs text-gray-500 mt-0.5">Registration desk barcode scanner</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Events list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-DEFAULT">Events</h2>
          <Link href="/admin/events/new" className="btn-primary text-xs px-4 py-2">+ New Event</Link>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm py-6 text-center">Loading events…</p>
        ) : events.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">No events yet.</p>
            <Link href="/admin/events/new" className="btn-cyan mt-4 text-sm">Create your first event</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Event</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Venue</th>
                  <th className="table-header">Sessions</th>
                  <th className="table-header">Delegates</th>
                  <th className="table-header">Ratings</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="table-row">
                    <td className="table-cell font-medium text-navy-DEFAULT">{event.name}</td>
                    <td className="table-cell">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="table-cell">{event.venue}</td>
                    <td className="table-cell">{event.session_count ?? '—'}</td>
                    <td className="table-cell">{event.delegate_count ?? '—'}</td>
                    <td className="table-cell">{event.rating_count ?? '—'}</td>
                    <td className="table-cell">
                      <Link href={`/admin/results?event=${event.id}`} className="text-navy-DEFAULT font-medium text-xs hover:underline">
                        View results →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
