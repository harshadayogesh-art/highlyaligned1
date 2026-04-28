const CITY_LIST = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata',
  'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli',
  'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar',
  'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
  'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati',
  'Chandigarh', 'Solapur', 'Hubli-Dharwad',
]

export function searchCities(query: string): string[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return CITY_LIST.filter((c) => c.toLowerCase().includes(q)).slice(0, 8)
}

function getNextMonth(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleString('default', { month: 'long' })
}

const areaTemplates: Record<string, string[]> = {
  'Career & Job': [
    `Dear {name}, based on your birth chart, Saturn's transit through your 10th house indicates a challenging but transformative period professionally. The delay you are experiencing is temporary.`,
    `Your Moon sign suggests that networking and mentorship will open doors between {month1} and {month2}. Focus on upskilling in areas aligned with your natural talents.`,
    `A simple remedy: Offer water to the Sun every Sunday morning for 21 days. This strengthens your 10th house energies and removes professional obstacles.`,
  ],
  'Wealth & Finance': [
    `Dear {name}, Jupiter's position in your chart indicates that financial growth is on the horizon, but patience is required until {month1}.`,
    `Avoid major investments during Mercury retrograde periods. Instead, focus on clearing old debts and building an emergency fund.`,
    `Remedy: Place a small Kuber Yantra in your northeast corner and light a ghee lamp there every Friday for prosperity.`,
  ],
  'Marriage & Love': [
    `Dear {name}, Venus is currently influencing your 7th house, which governs partnerships. This is a favorable time for deepening existing bonds.`,
    `If seeking a new relationship, the period from {month1} to {month2} is highly auspicious. Wearing white or pastel shades on Fridays enhances Venus energy.`,
    `Remedy: Offer white flowers to Goddess Lakshmi and chant "Om Shukraya Namah" 108 times on Fridays.`,
  ],
  'Health & Wellness': [
    `Dear {name}, your chart indicates that stress-related ailments may surface if rest is neglected. Prioritize sleep and hydration in the coming months.`,
    `The transit of Mars suggests increased energy levels after {month1} — ideal for starting a new fitness or yoga routine.`,
    `Remedy: Drink warm turmeric water every morning. Also, practice Pranayama for 10 minutes daily to balance your vital energies.`,
  ],
  'Family & Relations': [
    `Dear {name}, Rahu's influence on your 4th house may cause some domestic turbulence. Open communication with elders will resolve misunderstandings.`,
    `A family gathering or pilgrimage around {month1} will strengthen bonds and bring collective blessings.`,
    `Remedy: Feed Brahmin priests or donate food on Saturdays to pacify Saturn and bring family harmony.`,
  ],
  'Property & Home': [
    `Dear {name}, the stars favor property acquisition after {month1}. If selling, expect a good deal closer to {month2}.`,
    `Vastu corrections in the southwest corner of your home will accelerate positive results. Keep this area clutter-free.`,
    `Remedy: Bury a small copper plate with Navagraha symbols in the foundation if constructing a new home.`,
  ],
  'Legal & Disputes': [
    `Dear {name}, Saturn's Sade Sati influence may prolong legal matters. However, Jupiter's aspect after {month1} brings favorable judgments.`,
    `Avoid aggressive posturing. Meditation and calm deliberation will serve you better than confrontation.`,
    `Remedy: Recite Hanuman Chalisa daily and visit a Hanuman temple every Tuesday for strength and protection.`,
  ],
  'Travel & Abroad': [
    `Dear {name}, your 9th and 12th houses are active, indicating strong possibilities for foreign travel or settlement around {month1}.`,
    `Short-distance travel for spiritual purposes will bring unexpected opportunities and clarity.`,
    `Remedy: Keep a peacock feather in your travel bag and chant "Om Namo Bhagavate Vasudevaya" before journeys.`,
  ],
  'Education & Exam': [
    `Dear {name}, Mercury's transit blesses your 5th house of learning. Focus and discipline now will yield excellent results in exams.`,
    `Group study or seeking a mentor's guidance between {month1} and {month2} will be especially beneficial.`,
    `Remedy: worship Goddess Saraswati every Wednesday. Offer green moong dal as prasad for academic success.`,
  ],
  'Spiritual Growth': [
    `Dear {name}, your chart shows a strong inclination toward spiritual pursuits. The upcoming months are ideal for deepening your practice.`,
    `A spiritual retreat or pilgrimage around {month1} will bring profound insights and inner peace.`,
    `Remedy: Wake up during Brahma Muhurta (4-6 AM) and meditate for 20 minutes. This accelerates spiritual progress manifold.`,
  ],
}

export function generateMockAnswer(
  name: string,
  question: string,
  area: string,
  dob: string
): { answer: string; insights: { label: string; value: string }[] } {
  void question; void dob;
  const templates = areaTemplates[area] || areaTemplates['Career & Job']
  const month1 = getNextMonth(1)
  const month2 = getNextMonth(3)

  const answer = templates
    .join('\n\n')
    .replace(/{name}/g, name)
    .replace(/{month1}/g, month1)
    .replace(/{month2}/g, month2)

  const insights = [
    { label: 'Best Period', value: `${month1} – ${month2}` },
    { label: 'Focus Area', value: area.split('&')[0].trim() },
    { label: 'Lucky Day', value: ['Tuesday', 'Thursday', 'Friday', 'Sunday'][Math.floor(Math.random() * 4)] },
    { label: 'Simple Remedy', value: answer.split('Remedy:')[1]?.split('.')[0]?.trim() + '.' || 'Light a mustard oil lamp daily.' },
  ]

  return { answer, insights }
}
