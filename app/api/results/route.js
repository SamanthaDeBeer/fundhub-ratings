import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event')

  if (!eventId) return NextResponse.json({ error: 'event param required' }, { status: 400 })

  const db = createServiceClient()

  // Session stats from the view
  const { data: sessions, error } = await db
    .from('session_rating_stats')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reviews with text
  const { data: reviews } = await db
    .from('ratings')
    .select(`
      id, score, review, is_anonymous, submitted_at,
      delegate:delegates(name),
      session:sessions(speaker_name, company, room, start_time)
    `)
    .eq('sessions.event_id', eventId)
    .not('review', 'is', null)
    .not('review', 'eq', '')
    .order('submitted_at', { ascending: false })

  // Summary stats
  const { data: delegateStats } = await db
    .from('delegates')
    .select('checked_in')
    .eq('event_id', eventId)

  const totalDelegates = delegateStats?.length || 0
  const checkedIn = delegateStats?.filter(d => d.checked_in).length || 0
  const totalRatings = (sessions || []).reduce((sum, s) => sum + (s.rating_count || 0), 0)
  const ratedSessions = (sessions || []).filter(s => s.rating_count > 0).length
  const allAvgs = (sessions || []).filter(s => s.avg_score).map(s => parseFloat(s.avg_score))
  const overallAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2) : null

  return NextResponse.json({
    sessions: sessions || [],
    reviews: (reviews || []).filter(r => r.session), // filter out null joins
    summary: {
      total_delegates: totalDelegates,
      delegates_checked_in: checkedIn,
      session_count: (sessions || []).length,
      sessions_with_ratings: ratedSessions,
      total_ratings: totalRatings,
      overall_avg: overallAvg,
    },
  })
}
