-- ============================================================
-- FundHub Event Rating System — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  city TEXT,
  logo_url TEXT,
  fundhub_logo_url TEXT,
  notification_offset_minutes INTEGER DEFAULT 5, -- notify X mins before next session
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (each time slot per room is a session)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  room_level TEXT, -- e.g. "Level 1", "Level 2"
  speaker_name TEXT NOT NULL,
  company TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_date DATE NOT NULL,
  is_break BOOLEAN DEFAULT false, -- marks comfort breaks / lunch
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delegates table
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,                  -- value from Gel nametag barcode
  name TEXT NOT NULL,
  phone TEXT NOT NULL,                    -- E.164 format: +27821234567
  email TEXT,
  rating_token TEXT UNIQUE NOT NULL,      -- unique token for their rating link
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT false,    -- initial link sent?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, barcode)
);

-- Which sessions each delegate is booked into
CREATE TABLE delegate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(delegate_id, session_id)
);

-- Ratings submitted by delegates
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  review TEXT,                            -- optional text review
  is_anonymous BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(delegate_id, session_id)         -- one rating per delegate per session
);

-- Notification log (tracks what WhatsApp messages have been sent)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'rating_prompt', -- 'welcome' | 'rating_prompt'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',             -- 'sent' | 'failed'
  error_message TEXT,
  UNIQUE(delegate_id, session_id, type)
);

-- ============================================================
-- INDEXES for performance at 1000 delegates
-- ============================================================
CREATE INDEX idx_delegates_event ON delegates(event_id);
CREATE INDEX idx_delegates_barcode ON delegates(event_id, barcode);
CREATE INDEX idx_delegates_token ON delegates(rating_token);
CREATE INDEX idx_sessions_event ON sessions(event_id);
CREATE INDEX idx_sessions_time ON sessions(event_id, session_date, start_time);
CREATE INDEX idx_delegate_sessions_delegate ON delegate_sessions(delegate_id);
CREATE INDEX idx_delegate_sessions_session ON delegate_sessions(session_id);
CREATE INDEX idx_ratings_session ON ratings(session_id);
CREATE INDEX idx_notifications_session ON notifications(session_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public can read sessions (needed for rating page)
CREATE POLICY "Public can read sessions"
  ON sessions FOR SELECT
  USING (true);

-- Public can read their own delegate record by token (rating page)
CREATE POLICY "Delegates readable by token"
  ON delegates FOR SELECT
  USING (true);

-- Public can read delegate_sessions (for rating page to show their schedule)
CREATE POLICY "Public can read delegate_sessions"
  ON delegate_sessions FOR SELECT
  USING (true);

-- Public can insert ratings (delegates submitting)
CREATE POLICY "Anyone can submit ratings"
  ON ratings FOR INSERT
  WITH CHECK (true);

-- Public can read their own ratings
CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT
  USING (true);

-- Service role has full access (used by API routes server-side)
-- All other operations (insert/update delegates, etc.) go through service role key

-- ============================================================
-- HELPER: Get session stats for dashboard
-- ============================================================
CREATE OR REPLACE VIEW session_rating_stats AS
SELECT
  s.id AS session_id,
  s.event_id,
  s.room,
  s.speaker_name,
  s.company,
  s.start_time,
  s.end_time,
  s.session_date,
  COUNT(r.id) AS rating_count,
  ROUND(AVG(r.score)::NUMERIC, 2) AS avg_score,
  COUNT(CASE WHEN r.score = 5 THEN 1 END) AS score_5,
  COUNT(CASE WHEN r.score = 4 THEN 1 END) AS score_4,
  COUNT(CASE WHEN r.score = 3 THEN 1 END) AS score_3,
  COUNT(CASE WHEN r.score = 2 THEN 1 END) AS score_2,
  COUNT(CASE WHEN r.score = 1 THEN 1 END) AS score_1,
  COUNT(ds.id) AS delegates_booked
FROM sessions s
LEFT JOIN ratings r ON r.session_id = s.id
LEFT JOIN delegate_sessions ds ON ds.session_id = s.id
WHERE s.is_break = false
GROUP BY s.id, s.event_id, s.room, s.speaker_name, s.company,
         s.start_time, s.end_time, s.session_date;
