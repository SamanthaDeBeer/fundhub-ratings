import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_WHATSAPP_FROM // e.g. whatsapp:+14155238886

/**
 * Send the welcome WhatsApp message with the delegate's unique rating link.
 * Fires once when delegate checks in at the registration desk.
 */
export async function sendWelcomeMessage({ to, delegateName, eventName, ratingUrl }) {
  const message = [
    `Welcome to *${eventName}*, ${delegateName}! 👋`,
    '',
    'After each session, you\'ll receive a message here to rate your experience.',
    '',
    `You can always access your ratings page here:\n${ratingUrl}`,
    '',
    '_Powered by FundHub_',
  ].join('\n')

  return client.messages.create({
    from: FROM,
    to: `whatsapp:${to}`,
    body: message,
  })
}

/**
 * Send a session rating prompt 5 minutes before the next session starts.
 * Links directly to the delegate's rating page (pre-filtered to the session).
 */
export async function sendRatingPrompt({ to, delegateName, speakerName, company, ratingUrl, sessionId }) {
  const message = [
    `Hi ${delegateName} 👋`,
    '',
    `How was your session with *${speakerName}* (${company})?`,
    '',
    'Please rate this session from 1–5, where 1 is poor and 5 is excellent.',
    '',
    `👉 ${ratingUrl}?session=${sessionId}`,
    '',
    '_Your feedback helps us improve future events._',
    '_Powered by FundHub_',
  ].join('\n')

  return client.messages.create({
    from: FROM,
    to: `whatsapp:${to}`,
    body: message,
  })
}
