'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as XLSX from 'xlsx'

const scoreColor = (avg) => {
  if (!avg) return 'bg-gray-100 text-gray-400'
  if (avg >= 4.5) return 'bg-green-100 text-green-800'
  if (avg >= 3.5) return 'bg-blue-100 text-blue-800'
  if (avg >= 2.5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-pink-brand/10 text-pink-brand'
}

function ScoreBar({ count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
    </div>
  )
}

export default function ResultsPage() {
  const params = useSearchParams()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(params.get('event') || '')
  const [stats, setStats] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [activeTab, setActiveTab] = useState('sessions')
  const [sortBy, setSortBy] = useState('avg_desc')

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => setEvents(d.events || []))
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    setLoading(true)
    fetch(`/api/results?event=${selectedEvent}`).then(r => r.json()).then(d => {
      setStats(d.sessions || [])
      setReviews(d.reviews || [])
      setSummary(d.summary || null)
      setLoading(false)
    })
  }, [selectedEvent])

  function sortedSessions() {
    const s = [...stats]
    switch (sortBy) {
      case 'avg_desc': return s.sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))
      case 'avg_asc': return s.sort((a, b) => (a.avg_score || 0) - (b.avg_score || 0))
      case 'count_desc': return s.sort((a, b) => b.rating_count - a.rating_count)
      case 'time': return s.sort((a, b) => a.start_time?.localeCompare(b.start_time))
      case 'room': return s.sort((a, b) => a.room?.localeCompare(b.room))
      default: return s
    }
  }

  function exportToExcel() {
    const wb = XLSX.utils.book_new()

    // Sessions summary sheet
    const sessionData = sortedSessions().map(s => ({
      Room: s.room,
      Speaker: s.speaker_name,
      Company: s.company,
      'Start Time': s.start_time?.substring(0, 5),
      'End Time': s.end_time?.substring(0, 5),
      'Delegates Booked': s.delegates_booked,
      'Ratings Received': s.rating_count,
      'Response Rate': s.delegates_booked > 0 ? `${Math.round((s.rating_count / s.delegates_booked) * 100)}%` : '—',
      'Average Score': s.avg_score ? parseFloat(s.avg_score).toFixed(2) : '—',
      '5 Stars': s.score_5,
      '4 Stars': s.score_4,
      '3 Stars': s.score_3,
      '2 Stars': s.score_2,
      '1 Star': s.score_1,
    }))
    const ws1 = XLSX.utils.json_to_sheet(sessionData)
    ws1['!cols'] = [10, 30, 25, 10, 10, 16, 16, 14, 14, 8, 8, 8, 8, 8].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws1, 'Session Ratings')

    // Reviews sheet
    const reviewData = reviews.map(r => ({
      Speaker: r.session?.speaker_name,
      Company: r.session?.company,
      Room: r.session?.room,
      Score: r.score,
      Review: r.review,
      Anonymous: r.is_anonymous ? 'Yes' : 'No',
      'Delegate Name': r.is_anonymous ? '—' : r.delegate?.name,
      'Submitted At': new Date(r.submitted_at).toLocaleString('en-GB'),
    }))
    const ws2 = XLSX.utils.json_to_sheet(reviewData)
    ws2['!cols'] = [25, 25, 10, 6, 60, 10, 25, 20].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws2, 'Reviews')

    const eventName = events.find(e => e.id === selectedEvent)?.name || 'Event'
    XLSX.writeFile(wb, `${eventName.replace(/\s+/g, '_')}_Ratings.xlsx`)
  }

  const overallAvg = summary?.overall_avg ? parseFloat(summary.overall_avg).toFixed(2) : '—'
  const responseRate = summary?.delegates_checked_in && summary?.total_ratings
    ? Math.round((summary.total_ratings / (summary.delegates_checked_in * (summary.session_count || 1))) * 100)
    : null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-DEFAULT">Results</h1>
          <p className="text-gray-500 text-sm mt-1">Session ratings and delegate feedback.</p>
        </div>
        {selectedEvent && (
          <button onClick={exportToExcel} className="btn-primary">
            ↓ Export to Excel
          </button>
        )}
      </div>

      {/* Event selector */}
      <div className="card mb-6">
        <label className="label">Select Event</label>
        <select className="input" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
          <option value="">— Choose an event —</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      {loading && <p className="text-gray-400 text-sm text-center py-8">Loading results…</p>}

      {!loading && selectedEvent && summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Sessions Rated', value: summary.sessions_with_ratings, sub: `of ${summary.session_count} total` },
              { label: 'Total Ratings', value: summary.total_ratings },
              { label: 'Overall Average', value: overallAvg, sub: 'out of 5.00' },
              { label: 'Delegates Checked In', value: summary.delegates_checked_in, sub: `of ${summary.total_delegates}` },
            ].map(({ label, value, sub }) => (
              <div key={label} className="card text-center">
                <p className="text-2xl font-bold text-navy-DEFAULT">{value ?? '—'}</p>
                <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-gray-400">{sub}</p>}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
            {['sessions', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeTab === tab ? 'bg-white text-navy-DEFAULT shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'sessions' ? 'Sessions' : `Reviews (${reviews.length})`}
              </button>
            ))}
          </div>

          {/* Sessions tab */}
          {activeTab === 'sessions' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">{stats.length} sessions</p>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-navy-DEFAULT"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="avg_desc">Highest rated first</option>
                  <option value="avg_asc">Lowest rated first</option>
                  <option value="count_desc">Most ratings first</option>
                  <option value="time">By time</option>
                  <option value="room">By room</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="table-header">Speaker / Company</th>
                      <th className="table-header">Room</th>
                      <th className="table-header">Time</th>
                      <th className="table-header text-right">Ratings</th>
                      <th className="table-header text-right">Avg</th>
                      <th className="table-header">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSessions().map(session => (
                      <tr key={session.session_id} className="table-row">
                        <td className="table-cell">
                          <p className="font-medium text-navy-DEFAULT">{session.speaker_name}</p>
                          {session.company && <p className="text-xs text-gray-400">{session.company}</p>}
                        </td>
                        <td className="table-cell text-xs">{session.room}</td>
                        <td className="table-cell text-xs">{session.start_time?.substring(0, 5).replace(':', 'h')}</td>
                        <td className="table-cell text-right text-xs">
                          {session.rating_count}<span className="text-gray-300">/{session.delegates_booked}</span>
                        </td>
                        <td className="table-cell text-right">
                          {session.avg_score ? (
                            <span className={`badge ${scoreColor(parseFloat(session.avg_score))}`}>
                              {parseFloat(session.avg_score).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="table-cell w-32">
                          {session.rating_count > 0 ? (
                            <div className="space-y-0.5">
                              {[5, 4, 3, 2, 1].map(star => (
                                <ScoreBar
                                  key={star}
                                  count={session[`score_${star}`]}
                                  total={session.rating_count}
                                  color={star >= 4 ? 'bg-green-400' : star === 3 ? 'bg-yellow-400' : 'bg-pink-brand'}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">No ratings yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-gray-400 text-sm">No written reviews yet.</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-navy-DEFAULT text-sm">{review.session?.speaker_name}</span>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-gray-400 text-xs">{review.session?.room}</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{review.review}"</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {review.is_anonymous ? 'Anonymous' : review.delegate?.name} · {new Date(review.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`badge text-sm px-3 py-1 ${scoreColor(review.score)}`}>
                          {'★'.repeat(review.score)}{'☆'.repeat(5 - review.score)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {!loading && !selectedEvent && (
        <div className="card text-center py-12">
          <p className="text-gray-400">Select an event above to view results.</p>
        </div>
      )}
    </div>
  )
}
