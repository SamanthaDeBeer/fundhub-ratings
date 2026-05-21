import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req, { params }) {
  const { token } = params
  const db = createServiceClient()

  // Find delegate by token
  const { data: delegate, error } = await db
    .from('delegates')
    .select('*, event:events(*)')
    .eq('rating_token', token)
    .single()

  if (error || !delegate) {
    return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 404 })
  }

  // Get sessions this delegate is booked into
  const { data: delegateSessions } = await db
    .from('delegate_sessions')
    .select('session:sessions(*)')
    .eq('delegate_id', delegate.id)
    .order('sessions(start_time)')

  // Get existing ratings
  const { data: ratings } = await db
    .from('ratings')
    .select('*, delegate:delegates(name)')
    .eq('delegate_id', delegate.id)

  const sessions = (delegateSessions || [])
    .map(ds => ds.session)
    .filter(Boolean)
    .sort((a, b) => a.start_time?.localeCompare(b.start_time))

  return NextResponse.json({
    delegate: { id: delegate.id, name: delegate.name },
    event: delegate.event,
    sessions,
    ratings: ratings || [],
  })
}
