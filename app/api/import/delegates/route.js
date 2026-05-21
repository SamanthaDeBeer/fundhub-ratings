import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateToken, formatPhoneNumber } from '@/lib/utils'

export async function POST(req) {
  const { eventId, rows, mapping } = await req.json()

  if (!eventId || !rows?.length || !mapping?.barcode || !mapping?.name || !mapping?.phone) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const db = createServiceClient()

  // Fetch existing sessions for this event (to map delegate session selections)
  const { data: sessions } = await db
    .from('sessions')
    .select('id, room, speaker_name, start_time')
    .eq('event_id', eventId)

  const sessionMap = {} // "room:HH:MM" → session id
  if (sessions) {
    sessions.forEach(s => {
      const key = `${s.room.toLowerCase().trim()}:${s.start_time?.substring(0, 5)}`
      sessionMap[key] = s.id
      // Also index by speaker name
      const spKey = s.speaker_name.toLowerCase().trim()
      if (!sessionMap[spKey]) sessionMap[spKey] = []
      if (Array.isArray(sessionMap[spKey])) sessionMap[spKey].push(s.id)
    })
  }

  const imported = []
  const delegateSessions = []
  const skipped = []

  for (const row of rows) {
    const barcode = String(row[mapping.barcode] || '').trim()
    const name = String(row[mapping.name] || '').trim()
    const rawPhone = String(row[mapping.phone] || '').trim()
    const email = mapping.email ? String(row[mapping.email] || '').trim() : null

    if (!barcode || !name || !rawPhone) { skipped.push(row); continue }

    const phone = formatPhoneNumber(rawPhone)
    if (!phone) { skipped.push({ ...row, _reason: 'Invalid phone number' }); continue }

    const token = generateToken()

    imported.push({
      event_id: eventId,
      barcode,
      name,
      phone,
      email: email || null,
      rating_token: token,
    })

    // Parse session selections if column is mapped
    // Gel typically exports session selections as comma-separated room names or speaker names
    if (mapping.sessions && row[mapping.sessions]) {
      const sessionRaw = String(row[mapping.sessions])
      const parts = sessionRaw.split(/[,;|]/).map(s => s.trim().toLowerCase())
      parts.forEach(part => {
        if (sessionMap[part]) {
          const ids = Array.isArray(sessionMap[part]) ? sessionMap[part] : [sessionMap[part]]
          ids.forEach(sid => delegateSessions.push({ barcode, session_id: sid }))
        }
      })
    }
  }

  if (imported.length === 0) {
    return NextResponse.json({ error: 'No valid delegates found. Check column mapping and phone number format.' }, { status: 400 })
  }

  // Upsert delegates (safe to re-import)
  const { data: insertedDelegates, error: delegateError } = await db
    .from('delegates')
    .upsert(imported, { onConflict: 'event_id,barcode', ignoreDuplicates: false })
    .select('id, barcode')

  if (delegateError) return NextResponse.json({ error: delegateError.message }, { status: 500 })

  // Build delegate_sessions rows using actual delegate IDs
  if (insertedDelegates && delegateSessions.length > 0) {
    const barcodeToId = {}
    insertedDelegates.forEach(d => { barcodeToId[d.barcode] = d.id })

    const dsRows = delegateSessions
      .filter(ds => barcodeToId[ds.barcode])
      .map(ds => ({ delegate_id: barcodeToId[ds.barcode], session_id: ds.session_id }))

    if (dsRows.length > 0) {
      await db.from('delegate_sessions').upsert(dsRows, { onConflict: 'delegate_id,session_id', ignoreDuplicates: true })
    }
  }

  return NextResponse.json({
    imported: imported.length,
    skipped: skipped.length,
    sessionLinksCreated: delegateSessions.length,
  })
}
