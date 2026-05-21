import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req) {
  const { token, sessionId, score, review, isAnonymous } = await req.json()

  if (!token || !sessionId || !score) {
    return NextResponse.json({ error: 'token, sessionId, and score are required.' }, { status: 400 })
  }

  if (score < 1 || score > 5) {
    return NextResponse.json({ error: 'Score must be between 1 and 5.' }, { status: 400 })
  }

  const db = createServiceClient()

  // Verify delegate token
  const { data: delegate, error: delegateError } = await db
    .from('delegates')
    .select('id')
    .eq('rating_token', token)
    .single()

  if (delegateError || !delegate) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 })
  }

  // Verify delegate is booked into this session
  const { data: booking } = await db
    .from('delegate_sessions')
    .select('id')
    .eq('delegate_id', delegate.id)
    .eq('session_id', sessionId)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'You are not registered for this session.' }, { status: 403 })
  }

  // Upsert rating (allow updating if they re-submit)
  const { data: rating, error: ratingError } = await db
    .from('ratings')
    .upsert({
      delegate_id: delegate.id,
      session_id: sessionId,
      score: parseInt(score),
      review: review?.trim() || null,
      is_anonymous: isAnonymous || false,
    }, { onConflict: 'delegate_id,session_id' })
    .select()
    .single()

  if (ratingError) return NextResponse.json({ error: ratingError.message }, { status: 500 })

  return NextResponse.json({ rating })
}
