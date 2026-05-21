'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import FundHubLogo from '@/components/FundHubLogo'

const STAR_LABELS = { 1: 'Poor', 2: 'Below average', 3: 'Average', 4: 'Good', 5: 'Excellent' }

function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex justify-center gap-3 my-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`star-button ${(hover || value) >= star ? 'text-yellow-400' : 'text-gray-200'} ${disabled ? 'cursor-default' : ''}`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function SessionCard({ session, existingRating, onSubmit }) {
  const [score, setScore] = useState(existingRating?.score || 0)
  const [review, setReview] = useState(existingRating?.review || '')
  const [isAnonymous, setIsAnonymous] = useState(existingRating?.is_anonymous || false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingRating)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!score) return setError('Please select a rating before submitting.')
    setSubmitting(true)
    setError('')
    const result = await onSubmit({ sessionId: session.id, score, review, isAnonymous })
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
      setSubmitting(false)
    }
  }

  const timeStr = session.start_time?.substring(0, 5).replace(':', 'h') || ''

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
      submitted
        ? 'border-green-200 bg-green-50'
        : 'border-gray-100 bg-white'
    }`}>
      {/* Session header */}
      <div className="p-4 border-b border-gray-100 bg-navy-DEFAULT/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-navy-DEFAULT/60 uppercase tracking-wide">{timeStr} · {session.room}</p>
            <p className="font-bold text-navy-DEFAULT text-base mt-0.5">{session.speaker_name}</p>
            {session.company && session.company !== session.speaker_name && (
              <p className="text-sm text-gray-500">{session.company}</p>
            )}
          </div>
          {submitted && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {submitted ? (
          <div className="text-center py-2">
            <p className="text-green-700 font-semibold text-sm">Thank you for your rating!</p>
            {score > 0 && (
              <div className="flex justify-center gap-1 mt-2">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-2xl ${s <= score ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
            )}
            {review && <p className="text-xs text-gray-500 mt-2 italic">"{review}"</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 text-center mb-1">Please rate this session from 1–5</p>
            <p className="text-xs text-center text-gray-400 mb-3">1 = Poor · 5 = Excellent</p>
            <StarRating value={score} onChange={setScore} />
            {score > 0 && (
              <p className="text-center text-sm font-semibold text-navy-DEFAULT mt-1 mb-3">
                {STAR_LABELS[score]}
              </p>
            )}

            <div className="mt-3">
              <textarea
                rows={3}
                className="input text-sm resize-none"
                placeholder="Leave an optional comment… (optional)"
                value={review}
                onChange={e => setReview(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${isAnonymous ? 'bg-navy-DEFAULT' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-gray-500">Submit anonymously</span>
            </div>

            {error && <p className="text-xs text-pink-brand mt-2">{error}</p>}

            <button
              type="submit"
              disabled={submitting || score === 0}
              className="btn-primary w-full mt-4 text-sm"
            >
              {submitting ? 'Submitting…' : 'Submit Rating'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function RatePage() {
  const { token } = useParams()
  const params = useSearchParams()
  const highlightSession = params.get('session')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [delegate, setDelegate] = useState(null)
  const [event, setEvent] = useState(null)
  const [sessions, setSessions] = useState([])
  const [ratings, setRatings] = useState({}) // sessionId → rating

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/rate/${token}`)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Invalid or expired link.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setDelegate(data.delegate)
    setEvent(data.event)
    setSessions(data.sessions || [])
    const ratingMap = {}
    ;(data.ratings || []).forEach(r => { ratingMap[r.session_id] = r })
    setRatings(ratingMap)
    setLoading(false)
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Scroll to highlighted session on load
  useEffect(() => {
    if (highlightSession && !loading) {
      const el = document.getElementById(`session-${highlightSession}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightSession, loading])

  async function handleSubmitRating({ sessionId, score, review, isAnonymous }) {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, sessionId, score, review, isAnonymous }),
    })
    const data = await res.json()
    if (res.ok) {
      setRatings(r => ({ ...r, [sessionId]: { session_id: sessionId, score, review, is_anonymous: isAnonymous } }))
    }
    return data
  }

  const ratedCount = Object.keys(ratings).length
  const totalSessions = sessions.length

  if (loading) {
    return (
      <div className="min-h-screen rating-gradient flex items-center justify-center">
        <div className="text-white/60 text-sm animate-pulse">Loading your sessions…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen rating-gradient flex items-center justify-center p-6">
        <div className="text-center text-white">
          <p className="text-4xl mb-4">⚠</p>
          <p className="font-semibold text-lg mb-2">Link not found</p>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="rating-gradient px-4 py-6 pb-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <FundHubLogo className="h-8 w-auto" variant="light" />
            {event?.logo_url && (
              <img src={event.logo_url} alt="Event logo" className="h-8 w-auto object-contain" />
            )}
          </div>
          <div>
            <p className="text-cyan-brand text-xs font-semibold uppercase tracking-widest mb-1">{event?.name}</p>
            <h1 className="text-white text-xl font-bold">Hi {delegate?.name?.split(' ')[0]} 👋</h1>
            <p className="text-white/60 text-sm mt-1">{event?.venue} · {event?.date ? new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</p>
          </div>
          {/* Progress */}
          <div className="mt-5 bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-cyan-brand transition-all duration-500"
              style={{ width: totalSessions ? `${(ratedCount / totalSessions) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-white/50 text-xs mt-1.5">{ratedCount} of {totalSessions} sessions rated</p>
        </div>
      </div>

      {/* Sessions */}
      <div className="max-w-lg mx-auto px-4 -mt-4 pb-12 space-y-4">
        {sessions.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400">No sessions found for your registration.</p>
            <p className="text-xs text-gray-300 mt-1">Please contact the registration desk for assistance.</p>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              id={`session-${session.id}`}
              className={highlightSession === session.id ? 'ring-2 ring-cyan-brand ring-offset-2 rounded-2xl' : ''}
            >
              <SessionCard
                session={session}
                existingRating={ratings[session.id]}
                onSubmit={handleSubmitRating}
              />
            </div>
          ))
        )}

        {ratedCount === totalSessions && totalSessions > 0 && (
          <div className="card text-center py-8 border-2 border-green-200 bg-green-50">
            <p className="text-3xl mb-3">🎉</p>
            <p className="font-bold text-green-800 text-lg">All sessions rated!</p>
            <p className="text-green-600 text-sm mt-1">Thank you for your valuable feedback.</p>
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-xs text-gray-300">Powered by</p>
          <FundHubLogo className="h-5 w-auto mx-auto mt-1 opacity-40" />
        </div>
      </div>
    </div>
  )
}
