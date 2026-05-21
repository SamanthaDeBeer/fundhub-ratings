import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data: events, error } = await db
    .from('events')
    .select(`
      *,
      session_count:sessions(count),
      delegate_count:delegates(count),
      rating_count:ratings(count)
    `)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten count objects from Supabase aggregate syntax
  const formatted = (events || []).map(ev => ({
    ...ev,
    session_count: ev.session_count?.[0]?.count ?? 0,
    delegate_count: ev.delegate_count?.[0]?.count ?? 0,
    rating_count: ev.rating_count?.[0]?.count ?? 0,
  }))

  return NextResponse.json({ events: formatted })
}

export async function POST(req) {
  const body = await req.json()
  const { name, date, venue, city, notification_offset_minutes } = body

  if (!name || !date || !venue) {
    return NextResponse.json({ error: 'name, date, and venue are required.' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: event, error } = await db
    .from('events')
    .insert({ name, date, venue, city, notification_offset_minutes: notification_offset_minutes || 5 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event })
}
