-- ============================================================
-- PAGE BLOCKS TABLE — Structured CMS for all store page content
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS page_blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL,
  block_key text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Unique constraint per page + block
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_blocks_key ON page_blocks (page_key, block_key);
CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks (page_key);

-- 3. Enable RLS
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Page blocks public read" ON page_blocks;
DROP POLICY IF EXISTS "Page blocks admin write" ON page_blocks;
DROP POLICY IF EXISTS "Page blocks admin update" ON page_blocks;
DROP POLICY IF EXISTS "Page blocks admin delete" ON page_blocks;

CREATE POLICY "Page blocks public read"
  ON page_blocks FOR SELECT USING (true);

CREATE POLICY "Page blocks admin write"
  ON page_blocks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Page blocks admin update"
  ON page_blocks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Page blocks admin delete"
  ON page_blocks FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- ============================================================
-- SEED DATA — Matches current hardcoded content
-- ============================================================

-- HOME PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('home', 'hero_tagline', '{"text": "Welcome to your spiritual journey"}', '{}', 1),
('home', 'hero_title', '{"text": "Align Your Energy,\\nTransform Your Life"}', '{}', 2),
('home', 'hero_description', '{"text": "Discover ancient wisdom through personalized astrology, energy healing, and sacred products curated to elevate your spiritual practice."}', '{}', 3),
('home', 'hero_cta_primary', '{"text": "Free Kundali", "link": "/kundali"}', '{}', 4),
('home', 'hero_cta_secondary', '{"text": "Book Session", "link": "/services"}', '{}', 5),

('home', 'services_title', '{"text": "✨ Our Services"}', '{}', 10),
('home', 'services_subtitle', '{"text": "Personalized guidance across career, relationships, health and spiritual growth — delivered by expert practitioners."}', '{}', 11),
('home', 'services_cta', '{"text": "See All", "link": "/services"}', '{}', 12),

('home', 'products_title', '{"text": "🔥 Sacred Products"}', '{}', 20),
('home', 'products_subtitle', '{"text": "Handpicked crystals, malas, and spiritual tools energized for your practice."}', '{}', 21),
('home', 'products_cta', '{"text": "View All", "link": "/shop"}', '{}', 22),

('home', 'trust_title', '{"text": "Why Thousands Trust HighlyAligned"}', '{}', 30),
('home', 'trust_subtitle', '{"text": "A blend of ancient Vedic wisdom and modern spiritual guidance, delivered with authenticity and care."}', '{}', 31),
('home', 'trust_badge_1', '{"title": "Authentic Practices", "description": "Rooted in traditional Vedic astrology and energy healing techniques passed down through generations."}', '{}', 32),
('home', 'trust_badge_2', '{"title": "Personalized Guidance", "description": "Every reading and session is tailored to your unique birth chart, energy, and life circumstances."}', '{}', 33),
('home', 'trust_badge_3', '{"title": "Trusted & Confidential", "description": "Your personal details and consultations are kept strictly private. Over 5,000+ satisfied clients."}', '{}', 34),

('home', 'testimonials_title', '{"text": "💫 Client Stories"}', '{}', 40),
('home', 'testimonials_subtitle', '{"text": "Real experiences from our spiritual community."}', '{}', 41),
('home', 'testimonial_1', '{"text": "Harshada''s chakra healing completely shifted my energy. I felt lighter and more focused within days.", "author": "Meera Joshi", "service": "Chakra Healing", "img": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"}', '{}', 42),
('home', 'testimonial_2', '{"text": "The oracle card reading gave me clarity about my career. Her intuition is remarkable and accurate.", "author": "Rohit Verma", "service": "Oracle Reading", "img": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"}', '{}', 43),
('home', 'testimonial_3', '{"text": "The manifestation coaching helped me align my desires. I manifested a new job within 2 months!", "author": "Priya Sharma", "service": "Manifestation Coaching", "img": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"}', '{}', 44),

('home', 'cta_title', '{"text": "Begin Your Transformation Today"}', '{}', 50),
('home', 'cta_subtitle', '{"text": "Whether you seek clarity through astrology, healing through energy work, or tools to deepen your practice — we are here to guide you."}', '{}', 51),
('home', 'cta_button_1', '{"text": "Book a Session", "link": "/services"}', '{}', 52),
('home', 'cta_button_2', '{"text": "Explore Shop", "link": "/shop"}', '{}', 53)

ON CONFLICT (page_key, block_key) DO NOTHING;

-- ABOUT PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('about', 'hero_title', '{"text": "About Harshada"}', '{}', 1),
('about', 'hero_highlight', '{"text": "Harshada"}', '{}', 2),
('about', 'bio_image', '{"text": ""}', '{}', 5),
('about', 'bio_name', '{"text": "Harshada Yogesh"}', '{}', 10),
('about', 'bio_role', '{"text": "NLP Coach | Oracle Card Reader | Chakra Healer"}', '{}', 11),
('about', 'bio_paragraph_1', '{"text": "With over a decade of experience in Vedic astrology, energy healing, and spiritual counseling, Harshada has guided more than 5,000 seekers toward clarity, peace, and purpose."}', '{}', 12),
('about', 'bio_paragraph_2', '{"text": "Her unique approach blends ancient Vedic wisdom with modern NLP techniques, making spiritual guidance accessible, practical, and deeply transformative for today''s seekers."}', '{}', 13),
('about', 'bio_paragraph_3', '{"text": "Whether you are navigating career crossroads, relationship challenges, health concerns, or simply seeking deeper self-understanding, Harshada''s compassionate readings provide actionable insights rooted in your unique birth chart."}', '{}', 14),
('about', 'cert_1', '{"text": "Certified NLP Practitioner"}', '{}', 20),
('about', 'cert_2', '{"text": "10+ Years Astrology Experience"}', '{}', 21),
('about', 'cert_3', '{"text": "5000+ Consultations Delivered"}', '{}', 22),
('about', 'cert_4', '{"text": "Energy Healing Expert"}', '{}', 23),
('about', 'mission_quote', '{"text": "My mission is to make ancient spiritual wisdom accessible to every modern seeker. You don''t need to be a scholar to benefit from Vedic astrology — you just need an open heart and the right guide."}', '{}', 30),
('about', 'mission_author', '{"text": "— Harshada Yogesh"}', '{}', 31),
('about', 'services_title', '{"text": "Our Services"}', '{}', 40),
('about', 'trust_1_title', '{"text": "Authentic Products"}', '{}', 50),
('about', 'trust_1_desc', '{"text": "Handpicked and energetically cleansed"}', '{}', 51),
('about', 'trust_2_title', '{"text": "Personalized Guidance"}', '{}', 52),
('about', 'trust_2_desc', '{"text": "Every reading is unique to you"}', '{}', 53),
('about', 'trust_3_title', '{"text": "Secure Payments"}', '{}', 54),
('about', 'trust_3_desc', '{"text": "Protected by Razorpay encryption"}', '{}', 55)

ON CONFLICT (page_key, block_key) DO NOTHING;

-- SERVICES PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('services', 'hero_title', '{"text": "Our Services"}', '{}', 1),
('services', 'hero_subtitle', '{"text": "Book a personalized session to align your energy and find clarity on your path."}', '{}', 2)

ON CONFLICT (page_key, block_key) DO NOTHING;

-- CONTACT PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('contact', 'hero_title', '{"text": "Get in Touch"}', '{}', 1),
('contact', 'hero_subtitle', '{"text": "We''d love to hear from you. Reach out for consultations, product inquiries, or just to say hello."}', '{}', 2),
('contact', 'label_address', '{"text": "Address"}', '{}', 10),
('contact', 'label_phone', '{"text": "Phone"}', '{}', 11),
('contact', 'label_email', '{"text": "Email"}', '{}', 12),
('contact', 'label_hours', '{"text": "Business Hours"}', '{}', 13),
('contact', 'whatsapp_cta', '{"text": "Chat on WhatsApp"}', '{}', 20),
('contact', 'form_name', '{"text": "Name"}', '{}', 30),
('contact', 'form_email', '{"text": "Email"}', '{}', 31),
('contact', 'form_phone', '{"text": "Phone"}', '{}', 32),
('contact', 'form_subject', '{"text": "Subject"}', '{}', 33),
('contact', 'form_message', '{"text": "Message"}', '{}', 34),
('contact', 'form_submit', '{"text": "Send Message"}', '{}', 35),
('contact', 'success_title', '{"text": "Thank You!"}', '{}', 40),
('contact', 'success_message', '{"text": "We will get back to you within 24 hours."}', '{}', 41)

ON CONFLICT (page_key, block_key) DO NOTHING;

-- SHOP PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('shop', 'hero_title', '{"text": "Shop"}', '{}', 1)

ON CONFLICT (page_key, block_key) DO NOTHING;

-- KUNDALI PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('kundali', 'hero_title', '{"text": "Know Your Future"}', '{}', 1),
('kundali', 'hero_title_hi', '{"text": "अपना भविष्य जानें"}', '{}', 2),
('kundali', 'hero_subtitle', '{"text": "Enter your birth details. Ask your question. Get personalized Vedic guidance powered by AI."}', '{}', 3),
('kundali', 'hero_subtitle_hi', '{"text": "अपनी जन्म विवरण दर्ज करें। अपना प्रश्न पूछें। AI द्वारा संचालित व्यक्तिगत वेदिक मार्गदर्शन प्राप्त करें।"}', '{}', 4),
('kundali', 'step_1_label', '{"text": "Details"}', '{}', 10),
('kundali', 'step_1_label_hi', '{"text": "विवरण"}', '{}', 11),
('kundali', 'step_2_label', '{"text": "Question"}', '{}', 12),
('kundali', 'step_2_label_hi', '{"text": "प्रश्न"}', '{}', 13),
('kundali', 'step_3_label', '{"text": "Answer"}', '{}', 14),
('kundali', 'step_3_label_hi', '{"text": "उत्तर"}', '{}', 15),
('kundali', 'form_section_title', '{"text": "Your Birth Details"}', '{}', 18),
('kundali', 'form_section_title_hi', '{"text": "आपकी जन्म विवरण"}', '{}', 19),
('kundali', 'question_section_title', '{"text": "Select Area & Ask Question"}', '{}', 20),
('kundali', 'question_section_title_hi', '{"text": "क्षेत्र चुनें और प्रश्न पूछें"}', '{}', 21),
('kundali', 'form_name', '{"text": "Full Name"}', '{}', 22),
('kundali', 'form_name_hi', '{"text": "पूरा नाम"}', '{}', 23),
('kundali', 'form_mobile', '{"text": "Mobile"}', '{}', 24),
('kundali', 'form_mobile_hi', '{"text": "मोबाइल"}', '{}', 25),
('kundali', 'form_email', '{"text": "Email"}', '{}', 26),
('kundali', 'form_email_hi', '{"text": "ईमेल"}', '{}', 27),
('kundali', 'form_dob', '{"text": "Date of Birth"}', '{}', 28),
('kundali', 'form_dob_hi', '{"text": "जन्म तिथि"}', '{}', 29),
('kundali', 'form_birth_time', '{"text": "Birth Time"}', '{}', 30),
('kundali', 'form_birth_time_hi', '{"text": "जन्म समय"}', '{}', 31),
('kundali', 'form_approximate', '{"text": "Approximate / Unknown"}', '{}', 32),
('kundali', 'form_approximate_hi', '{"text": "लगभग / अज्ञात"}', '{}', 33),
('kundali', 'form_birth_location', '{"text": "Birth Location"}', '{}', 34),
('kundali', 'form_birth_location_hi', '{"text": "जन्म स्थान"}', '{}', 35),
('kundali', 'cta_continue', '{"text": "Continue"}', '{}', 40),
('kundali', 'cta_continue_hi', '{"text": "जारी रखें"}', '{}', 41),
('kundali', 'cta_get_report', '{"text": "Get My Free Report"}', '{}', 42),
('kundali', 'cta_get_report_hi', '{"text": "मुफ्त रिपोर्ट प्राप्त करें"}', '{}', 43),
('kundali', 'cta_back', '{"text": "Back"}', '{}', 44),
('kundali', 'cta_back_hi', '{"text": "वापस"}', '{}', 45),
('kundali', 'cta_book', '{"text": "Book Detailed Consultation — ₹1,500"}', '{}', 50),
('kundali', 'cta_book_hi', '{"text": "विस्तृत परामर्श बुक करें — ₹1,500"}', '{}', 51),
('kundali', 'cta_whatsapp', '{"text": "Ask on WhatsApp"}', '{}', 52),
('kundali', 'cta_whatsapp_hi', '{"text": "WhatsApp पर पूछें"}', '{}', 53),
('kundali', 'cta_another', '{"text": "Get Another Report"}', '{}', 54),
('kundali', 'cta_another_hi', '{"text": "एक और रिपोर्ट प्राप्त करें"}', '{}', 55),
('kundali', 'disclaimer', '{"text": "This guidance is based on Vedic astrology principles. For detailed Dasha analysis and personalized remedies, book a consultation with Harshada."}', '{}', 60),
('kundali', 'disclaimer_hi', '{"text": "यह मार्गदर्शन वैदिक ज्योतिष सिद्धांतों पर आधारित है। विस्तृत दशा विश्लेषण के लिए हर्षदा से परामर्श बुक करें।"}', '{}', 61),
('kundali', 'generating_text', '{"text": "Analyzing your birth chart..."}', '{}', 70),
('kundali', 'generating_text_hi', '{"text": "आपकी कुंडली का विश्लेषण हो रहा है..."}', '{}', 71),
('kundali', 'generating_sub', '{"text": "Calculating planetary positions for"}', '{}', 72),
('kundali', 'generating_sub_hi', '{"text": "के लिए ग्रह स्थितियों की गणना"}', '{}', 73),
('kundali', 'insights_best_period', '{"text": "Best Period"}', '{}', 80),
('kundali', 'insights_best_period_hi', '{"text": "श्रेष्ठ काल"}', '{}', 81),
('kundali', 'insights_remedy', '{"text": "Simple Remedy"}', '{}', 82),
('kundali', 'insights_remedy_hi', '{"text": "सरल उपाय"}', '{}', 83),
('kundali', 'insights_lucky_day', '{"text": "Lucky Day"}', '{}', 84),
('kundali', 'insights_lucky_day_hi', '{"text": "शुभ दिन"}', '{}', 85),
('kundali', 'insights_guidance', '{"text": "Guidance"}', '{}', 86),
('kundali', 'insights_guidance_hi', '{"text": "मार्गदर्शन"}', '{}', 87)

ON CONFLICT (page_key, block_key) DO NOTHING;

-- BLOG PAGE BLOCKS
INSERT INTO page_blocks (page_key, block_key, content, images, sort_order) VALUES
('blog', 'hero_title', '{"text": "Blog"}', '{}', 1),
('blog', 'hero_subtitle', '{"text": "Insights on astrology, crystals, healing, and spiritual growth."}', '{}', 2)

ON CONFLICT (page_key, block_key) DO NOTHING;
