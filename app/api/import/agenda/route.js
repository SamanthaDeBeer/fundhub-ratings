import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { parseAgendaTime } from '@/lib/utils'

// Session duration in minutes — MTM sessions are 35 mins
const SESSION_DURATION = 35

export async function POST(req) {
  const { eventId, rows, mapping } = await req.json()

  if (!eventId || !rows?.length || !mapping?.time || !mapping?.room || !mapping?.speaker) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const db = createServiceClient()

  // Fetch event to get date
  const { data: event } = await db.from('events').select('date').eq('id', eventId).single()
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })

  const sessions = []
  const skipped = []

  for (const row of rows) {
    const rawTime = String(row[mapping.time] || '').trim()
    const room = String(row[mapping.room] || '').trim()
    const speaker = String(row[mapping.speaker] || '').trim()
    const company = mapping.company ? String(row[mapping.company] || '').trim() : ''
    const level = mapping.level ? String(row[mapping.level] || '').trim() : ''

    // Skip header rows, breaks, empty rows
    if (!rawTime || !room || !speaker) { skipped.push(row); continue }
    if (/break|lunch|registration|network|comfort/i.test(speaker)) { skipped.push(row); continue }

    const startTime = parseAgendaTime(rawTime)
    if (!startTime) { skipped.push(row); continue }

    // Calculate end time
    const [h, m] = startTime.split(':').map(Number)
    const endMins = h * 60 + m + SESSION_DURATION
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`

    sessions.push({
      event_id: eventId,
      room: room,
      room_level: level || null,
      speaker_name: speaker,
      company: company || speaker,
      start_time: startTime,
      end_time: endTime,
      session_date: event.date,
      is_break: false,
    })
  }

  if (sessions.length === 0) {
    return NextResponse.json({ error: 'No valid session rows found. Check your column mapping.' }, { status: 400 })
  }

  // Upsert — safe to re-import
  const { error, count } = await db
    .from('sessions')
    .upsert(sessions, { onConflict: 'event_id,room,start_time,session_date', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ imported: sessions.length, skipped: skipped.length })
}
