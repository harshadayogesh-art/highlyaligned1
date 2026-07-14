-- ============================================================
-- WhatsApp CRM Schema
-- Adds: contacts, conversations, messages, flows,
--       whatsapp_appointments, followup_queue, opt_outs
-- ============================================================

-- 1. WhatsApp Contacts
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT NOT NULL UNIQUE,
  name          TEXT,
  wa_id         TEXT UNIQUE,
  status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'engaged', 'qualified', 'booked', 'churned')),
  lead_score    INT NOT NULL DEFAULT 0,
  opted_out     BOOLEAN NOT NULL DEFAULT FALSE,
  opted_out_at  TIMESTAMPTZ,
  source        TEXT DEFAULT 'meta_ad',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Conversation Flows (admin-designed Q&A)
CREATE TABLE IF NOT EXISTS whatsapp_flows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  steps       JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  trigger_keywords TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Conversations
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  flow_id          UUID REFERENCES whatsapp_flows(id),
  current_step_id  TEXT,
  mode             TEXT NOT NULL DEFAULT 'bot'
                     CHECK (mode IN ('bot', 'human', 'closed')),
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'qualified', 'unqualified', 'booked', 'closed')),
  answers          JSONB NOT NULL DEFAULT '{}',
  lead_score       INT NOT NULL DEFAULT 0,
  assigned_to      UUID REFERENCES auth.users(id),
  last_message_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id   TEXT UNIQUE,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type            TEXT NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text', 'template', 'button', 'image', 'audio', 'document', 'interactive')),
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'sent'
                    CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WhatsApp Appointments
CREATE TABLE IF NOT EXISTS whatsapp_appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_conversations(id),
  booking_id      UUID REFERENCES bookings(id),
  service_name    TEXT,
  preferred_date  DATE,
  preferred_time  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show')),
  confirmed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Follow-up Queue
CREATE TABLE IF NOT EXISTS whatsapp_followup_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_conversations(id),
  appointment_id  UUID REFERENCES whatsapp_appointments(id),
  template_name   TEXT NOT NULL,
  message_body    TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'cancelled', 'skipped')),
  sent_at         TIMESTAMPTZ,
  attempt         INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Opt-outs
CREATE TABLE IF NOT EXISTS whatsapp_opt_outs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL UNIQUE,
  contact_id   UUID REFERENCES whatsapp_contacts(id),
  trigger_word TEXT,
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opted_in_at  TIMESTAMPTZ
);

-- 8. Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL DEFAULT 'UTILITY'
                CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language    TEXT NOT NULL DEFAULT 'en',
  body        TEXT NOT NULL,
  variables   TEXT[] DEFAULT '{}'::TEXT[],
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_wc_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wc_status ON whatsapp_contacts(status);
CREATE INDEX IF NOT EXISTS idx_wc_opted_out ON whatsapp_contacts(opted_out);
CREATE INDEX IF NOT EXISTS idx_wconv_contact ON whatsapp_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_wconv_status ON whatsapp_conversations(status, mode);
CREATE INDEX IF NOT EXISTS idx_wconv_last_msg ON whatsapp_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_wmsg_conv ON whatsapp_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wmsg_wa_id ON whatsapp_messages(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_wfq_scheduled ON whatsapp_followup_queue(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_wfq_contact ON whatsapp_followup_queue(contact_id, status);
CREATE INDEX IF NOT EXISTS idx_woo_phone ON whatsapp_opt_outs(phone);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_contacts_updated_at') THEN
    CREATE TRIGGER update_whatsapp_contacts_updated_at
      BEFORE UPDATE ON whatsapp_contacts
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_conversations_updated_at') THEN
    CREATE TRIGGER update_whatsapp_conversations_updated_at
      BEFORE UPDATE ON whatsapp_conversations
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_appointments_updated_at') THEN
    CREATE TRIGGER update_whatsapp_appointments_updated_at
      BEFORE UPDATE ON whatsapp_appointments
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_followup_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin_or_support()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor', 'support')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE POLICY "admin_contacts_all" ON whatsapp_contacts FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_conversations_all" ON whatsapp_conversations FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_messages_all" ON whatsapp_messages FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_flows_all" ON whatsapp_flows FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_appointments_all" ON whatsapp_appointments FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_followup_all" ON whatsapp_followup_queue FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_optouts_all" ON whatsapp_opt_outs FOR ALL USING (is_admin_or_support());
CREATE POLICY "admin_templates_all" ON whatsapp_templates FOR ALL USING (is_admin_or_support());

-- ============================================================
-- SEED: Templates
-- ============================================================
INSERT INTO whatsapp_templates (name, category, body, variables, is_approved) VALUES
(
  'greeting_new_lead', 'UTILITY',
  'Hi {{1}}! 🙏 Thanks for reaching out to *Selfaligned*. We''re so glad you''re here! I''m going to ask you a few quick questions to find the best solution for you. Ready to begin?',
  ARRAY['{{1}}']::TEXT[], TRUE
),
(
  'followup_1h', 'MARKETING',
  'Hi {{1}} 👋 We noticed you haven''t confirmed your appointment yet. Your slot is still available! Reply *YES* to confirm or *NO* to cancel.',
  ARRAY['{{1}}']::TEXT[], TRUE
),
(
  'followup_24h', 'MARKETING',
  'Hi {{1}}, just a gentle reminder 🌟 Your appointment with Selfaligned is still pending. Slots fill up fast — shall we lock it in? Reply *CONFIRM* or *CANCEL*.',
  ARRAY['{{1}}']::TEXT[], TRUE
),
(
  'followup_48h', 'MARKETING',
  'Hi {{1}}, this is our final reminder. If you''re no longer interested, reply *STOP* to unsubscribe. Otherwise reply *YES* to confirm! 🙏',
  ARRAY['{{1}}']::TEXT[], TRUE
),
(
  'appointment_confirmed', 'UTILITY',
  '✅ Your appointment is confirmed! 🎉\n\n📅 Date: {{1}}\n⏰ Time: {{2}}\n💆 Service: {{3}}\n\nWe look forward to seeing you! To reschedule reply *RESCHEDULE*.',
  ARRAY['{{1}}', '{{2}}', '{{3}}']::TEXT[], TRUE
),
(
  'stop_acknowledged', 'UTILITY',
  'We''ve received your STOP request and removed you from our list. You won''t receive further messages. To opt back in, message us anytime. 🙏',
  ARRAY[]::TEXT[], TRUE
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: Default qualification flow
-- ============================================================
INSERT INTO whatsapp_flows (name, description, steps, is_active, trigger_keywords) VALUES
(
  'Default Lead Qualification',
  'Standard qualification flow for Meta Ad leads',
  '[
    {"id":"step_1","question":"Great! First, what is your name? 😊","type":"text","field":"name","next_step":"step_2"},
    {"id":"step_2","question":"What are you looking for help with?\n\n1️⃣ Healing & Wellness\n2️⃣ Astrology Reading\n3️⃣ Personal Coaching\n4️⃣ Something else","type":"button","field":"interest","options":["Healing & Wellness","Astrology Reading","Personal Coaching","Something else"],"score_map":{"Healing & Wellness":10,"Astrology Reading":10,"Personal Coaching":10,"Something else":5},"next_step":"step_3"},
    {"id":"step_3","question":"On a scale of 1-10, how urgent is this for you? (1 = exploring, 10 = need help now)","type":"number","field":"urgency","score_multiplier":2,"next_step":"step_4"},
    {"id":"step_4","question":"Preferred consultation time?\n\n1️⃣ Morning (9am-12pm)\n2️⃣ Afternoon (12pm-5pm)\n3️⃣ Evening (5pm-8pm)","type":"button","field":"preferred_time","options":["Morning (9am-12pm)","Afternoon (12pm-5pm)","Evening (5pm-8pm)"],"next_step":"step_5"},
    {"id":"step_5","question":"What date works best for you? (e.g. 20 July, next Monday)","type":"text","field":"preferred_date","next_step":"complete"}
  ]'::JSONB,
  TRUE,
  ARRAY['hi','hello','hey','start','namaste','hii','helo']
)
ON CONFLICT DO NOTHING;