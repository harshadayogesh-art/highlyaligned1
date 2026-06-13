export async function seedDatabase(supabase: { from: (table: string) => { upsert: (data: unknown[]) => Promise<{ error: Error | null }> } }) {
  // Seed settings
  await supabase.from('settings').upsert([
    { key: 'gst_enabled', value: { enabled: false } },
    {
      key: 'gst_config',
      value: { default_rate: 18, gstin: '', hsn_code: '' },
    },
    {
      key: 'business_info',
      value: {
        name: 'Selfaligned',
        owner: 'Harshada Yogesh',
        phone: '+91 84688 83571',
        email: 'harshada@Selfaligned.in',
        address: 'Navrangpura, Ahmedabad, Gujarat',
        hours: '10:00 AM - 7:00 PM',
      },
    },
  ])

  // Seed categories
  await supabase.from('categories').upsert([
    { name: 'Crystals', slug: 'crystals', type: 'product' },
    { name: 'Sage & Smudge', slug: 'sage-smudge', type: 'product' },
    { name: 'Oracle Decks', slug: 'oracle-decks', type: 'product' },
    { name: 'Jewelry', slug: 'jewelry', type: 'product' },
    { name: 'Spiritual Kits', slug: 'spiritual-kits', type: 'product' },
    { name: 'NLP Coaching', slug: 'nlp-coaching', type: 'service' },
    { name: 'Oracle Readings', slug: 'oracle-readings', type: 'service' },
    { name: 'Natal Chart Reading', slug: 'natal-chart', type: 'service' },
    { name: 'Tarot Consultation', slug: 'tarot', type: 'service' },
    { name: 'Career Astrology', slug: 'career-astrology', type: 'service' },
    { name: 'Manifestation', slug: 'manifestation', type: 'service' },
  ])

  // Seed lead magnet areas
  await supabase.from('lead_magnet_areas').upsert([
    { name: 'Career & Job', icon: '💼', slug: 'career-job', sort_order: 1 },
    { name: 'Wealth & Finance', icon: '💰', slug: 'wealth-finance', sort_order: 2 },
    { name: 'Marriage & Love', icon: '💕', slug: 'marriage-love', sort_order: 3 },
    { name: 'Health & Wellness', icon: '🏥', slug: 'health-wellness', sort_order: 4 },
    { name: 'Family & Relations', icon: '👨‍👩‍👧', slug: 'family-relations', sort_order: 5 },
    { name: 'Property & Home', icon: '🏠', slug: 'property-home', sort_order: 6 },
    { name: 'Legal & Disputes', icon: '⚖️', slug: 'legal-disputes', sort_order: 7 },
    { name: 'Travel & Abroad', icon: '✈️', slug: 'travel-abroad', sort_order: 8 },
    { name: 'Education & Exam', icon: '📚', slug: 'education-exam', sort_order: 9 },
    { name: 'Spiritual Growth', icon: '🧘', slug: 'spiritual-growth', sort_order: 10 },
  ])

  // Seed services
  await supabase.from('services').upsert([
    {
      name: 'NLP Coaching',
      duration_minutes: 60,
      price: 2500,
      mode: ['video', 'phone'],
      color_code: '#8b5cf6',
    },
    {
      name: 'Tarot Consultation',
      slug: 'tarot',
      description: 'Find answers to specific life questions through intuitive tarot reading.',
      price: 1500,
      duration_minutes: 45,
      sort_order: 3,
      is_active: true,
    },
    {
      name: 'Career Astrology',
      slug: 'career-astrology',
      description: 'Discover your professional calling and best career paths.',
      price: 2500,
      duration_minutes: 60,
      sort_order: 5,
      is_active: true,
    },
    {
      name: 'Manifestation Coaching',
      duration_minutes: 90,
      price: 3000,
      mode: ['phone'],
      color_code: '#ec4899',
    },
  ])
}
