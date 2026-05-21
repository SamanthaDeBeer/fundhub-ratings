import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendRatingPrompt } from '@/lib/twilio'

/**
 * POST /api/notify
 *
 * Called by Vercel Cron every minute (see vercel.json).
 * Checks whether any sessions just ended (or are N minutes before starting)
 * and sends WhatsApp rating prompts to all checked-in delegates for those sessions.
 *
 * Secured by CRON_SECRET header.
 */
export async function POST(req) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date()

  // Today's date in YYYY-MM-DD (event date)
  const todayDate = now.toISOString().split('T')[0]

  // Current time in HH:MM
  const currentHH = String(now.getHours()).padStart(2, '0')
  const currentMM = String(now.getMinutes()).padStart(2, '0')
  const currentTime = `${currentHH}:${currentMM}`

  // Fetch all active events happening today
  const { data: events } = await db
    .from('events')
    .select('id, name, notification_offset_minutes')
    .eq('is_active', true)

  if (!events?.length) return NextResponse.json({ message: 'No active events today', sent: 0 })

  let totalSent = 0
  const errors = []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  for (const event of events) {
    const offsetMins = event.notification_offset_minutes || 5

    // Find all sessions for this event today
    const { data: sessions } = await db
      .from('sessions')
      .select('*')
      .eq('event_id', event.id)
      .eq('session_date', todayDate)
      .eq('is_break', false)
      .order('start_time')

    if (!sessions?.length) continue

    // For each session, check if NOW is at the notification window
    // = offsetMins before this session's start time
    for (const session of sessions) {
      // Calculate when notification should fire:
      // Fire at: session.start_time - offsetMins
      const [sh, sm] = session.start_time.split(':').map(Number)
      const sessionStartMins = sh * 60 + sm
      const notifyAtMins = sessionStartMins - offsetMins

      const notifyHH = String(Math.floor(notifyAtMins / 60)).padStart(2, '0')
      const notifyMM = String(notifyAtMins % 60).padStart(2, '0')
      const notifyTime = `${notifyHH}:${notifyMM}`

      // Only fire if current time matches notification time (within 1-minute window)
      if (currentTime !== notifyTime) continue

      // This session's notification window is NOW.
      // Find which session PRECEDED this one (the one delegates just finished)
      // = the session immediately before this one in the schedule
      const sessionIdx = sessions.findIndex(s => s.id === session.id)
      if (sessionIdx <= 0) continue // No previous session to rate
      const prevSession = sessions[sessionIdx - 1]

      // Get all checked-in delegates who attended the previous session
      const { data: delegateSessionRows } = await db
        .from('delegate_sessions')
        .select('delegate:delegates(id, name, phone, rating_token, checked_in, whatsapp_sent)')
        .eq('session_id', prevSession.id)

      if (!delegateSessionRows?.length) continue

      const delegates = delegateSessionRows
        .map(ds => ds.delegate)
        .filter(d => d && d.checked_in) // Only send to checked-in delegates

      for (const delegate of delegates) {
        // Check if we already sent this notification
        const { data: existingNotif } = await db
          .from('notifications')
          .select('id')
          .eq('delegate_id', delegate.id)
          .eq('session_id', prevSession.id)
          .eq('type', 'rating_prompt')
          .single()

        if (existingNotif) continue // Already sent — skip

        const ratingUrl = `${appUrl}/rate/${delegate.rating_token}`

        try {
          await sendRatingPrompt({
            to: delegate.phone,
            delegateName: delegate.name.split(' ')[0],
            speakerName: prevSession.speaker_name,
            company: prevSession.company,
            ratingUrl,
            sessionId: prevSession.id,
          })

          // Log successful notification
          await db.from('notifications').insert({
            delegate_id: delegate.id,
            session_id: prevSession.id,
            type: 'rating_prompt',
            status: 'sent',
          })

          totalSent++
        } catch (e) {
          // Log failed notification but continue
          await db.from('notifications').insert({
            delegate_id: delegate.id,
            session_id: prevSession.id,
            type: 'rating_prompt',
            status: 'failed',
            error_message: e.message,
          })
          errors.push({ delegate: delegate.name, error: e.message })
        }
      }
    }
  }

  return NextResponse.json({
    message: 'Notification run complete',
    sent: totalSent,
    errors: errors.length,
    errorDetails: errors.length > 0 ? errors : undefined,
    runAt: now.toISOString(),
  })
}
