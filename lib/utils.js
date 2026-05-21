import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a short, URL-safe rating token for a delegate.
 * Uses first 16 chars of a UUID — low collision risk at event scale.
 */
export function generateToken() {
  return uuidv4().replace(/-/g, '').substring(0, 16)
}

/**
 * Format a South African phone number to E.164 (+27...)
 * Accepts: 0821234567, +27821234567, 27821234567
 */
export function formatPhoneNumber(raw) {
  if (!raw) return null
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('27') && digits.length === 11) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 10) return `+27${digits.slice(1)}`
  if (digits.length === 9) return `+27${digits}`
  return null
}

/**
 * Parse a time string like "09h00" or "09:00" into a comparable HH:MM string.
 */
export function parseAgendaTime(raw) {
  if (!raw) return null
  const clean = String(raw).replace('h', ':').replace(/\s/g, '')
  const match = clean.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

/**
 * Format a time string "HH:MM" for display as "09h00"
 */
export function formatTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':')
  return `${h}h${m}`
}

/**
 * Check if we're within X minutes before a given time (HH:MM).
 * Used by the notification scheduler.
 */
export function isWithinMinutesBefore(targetTime, minutesBefore, now = new Date()) {
  const [h, m] = targetTime.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  const triggerAt = new Date(target.getTime() - minutesBefore * 60 * 1000)
  const windowEnd = new Date(triggerAt.getTime() + 60 * 1000) // 1-min window
  return now >= triggerAt && now < windowEnd
}

/**
 * Star label helper for display
 */
export function scoreLabel(score) {
  const labels = { 1: 'Poor', 2: 'Below average', 3: 'Average', 4: 'Good', 5: 'Excellent' }
  return labels[score] || ''
}
