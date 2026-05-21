import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWelcomeMessage } from '@/lib/twilio'

export async function POST(req) {
  const { barcode, eventId } = await req.json()

  if (!barcode || !eventId) {
    return NextResponse.json({ error: 'barcode and eventId are required.' }, { status: 400 })
  }

  const db = createServiceClient()

  // Look up delegate by barcode
  const { data: delegate, error } = await db
    .from('delegates')
    .select(`
      *,
      session_count:delegate_sessions(count)
    `)
    .eq('event_id', eventId)
    .eq('barcode', barcode.trim())
    .single()

  if (error || !delegate) {
    return NextResponse.json({
      error: 'Delegate not found. Check that the delegate is registered for this event.',
    }, { status: 404 })
  }

  const alreadyCheckedIn = delegate.checked_in

  // Mark as checked in
  await db
    .from('delegates')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', delegate.id)

  // Flatten count
  delegate.session_count = delegate.session_count?.[0]?.count ?? 0

  // Send welcome WhatsApp if not already sent
  let whatsappSent = false
  if (!delegate.whatsapp_sent) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      const ratingUrl = `${appUrl}/rate/${delegate.rating_token}`

      // Fetch event name
      const { data: event } = await db.from('events').select('name').eq('id', eventId).single()

      await sendWelcomeMessage({
        to: delegate.phone,
        delegateName: delegate.name.split(' ')[0],
        eventName: event?.name || 'the event',
        ratingUrl,
      })

      await db.from('delegates').update({ whatsapp_sent: true }).eq('id', delegate.id)
      whatsappSent = true
    } catch (e) {
      console.error('WhatsApp send failed:', e.message)
      // Don't fail the check-in — just log
    }
  }

  return NextResponse.json({
    delegate: {
      id: delegate.id,
      name: delegate.name,
      phone: delegate.phone,
      session_count: delegate.session_count,
    },
    alreadyCheckedIn,
    whatsappSent,
  })
}
