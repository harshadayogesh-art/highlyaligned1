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
        name: 'HighlyAligned',
        owner: 'Harshada Yogesh',
        phone: '+91 84688 83571',
        email: 'harshada@highlyaligned.in',
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
    { name: 'Chakra Tools', slug: 'chakra-tools', type: 'product' },
    { name: 'Jewelry', slug: 'jewelry', type: 'product' },
    { name: 'Spiritual Kits', slug: 'spiritual-kits', type: 'product' },
    { name: 'NLP Coaching', slug: 'nlp-coaching', type: 'service' },
    { name: 'Oracle Readings', slug: 'oracle-readings', type: 'service' },
    { name: 'Chakra Healing', slug: 'chakra-healing', type: 'service' },
    { name: 'Crystal Healing', slug: 'crystal-healing', type: 'service' },
    { name: 'Energy Healing', slug: 'energy-healing', type: 'service' },
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
      name: 'Oracle Card Readings',
      duration_minutes: 45,
      price: 1500,
      mode: ['video', 'chat'],
      color_code: '#6366f1',
    },
    {
      name: 'Chakra Healing',
      duration_minutes: 45,
      price: 1800,
      mode: ['in_person'],
      color_code: '#10b981',
    },
    {
      name: 'Crystal Healing',
      duration_minutes: 60,
      price: 2000,
      mode: ['video', 'phone'],
      color_code: '#3b82f6',
    },
    {
      name: 'Energy Healing',
      duration_minutes: 30,
      price: 1500,
      mode: ['video'],
      color_code: '#f59e0b',
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
