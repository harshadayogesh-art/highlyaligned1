export interface BirthChart {
  sunSign: string
  moonSign: string
  nakshatra: string
  mahadasha: string
  antardasha: string
  ascendant: string
  currentTransit: string
}

export function calculateBasicChart(dob: string, birthTime: string): BirthChart {
  const date = new Date(dob)
  const month = date.getMonth() + 1
  const day = date.getDate()

  const sunSigns = [
    'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
    'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius',
  ]
  const sunSign = sunSigns[month - 1] || 'Unknown'

  const moonSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ]
  const moonSign = moonSigns[(month + day) % 12] || 'Unknown'

  const nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ]
  const nakshatra = nakshatras[(day + date.getFullYear()) % 27] || 'Unknown'

  const dashaLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
  const mahadasha = dashaLords[date.getFullYear() % 9] || 'Saturn'
  const antardasha = dashaLords[(date.getFullYear() + 2) % 9] || 'Jupiter'

  const hours = parseInt(birthTime.split(':')[0] || '12')
  const ascendants = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ]
  const ascendant = ascendants[hours % 12] || 'Leo'

  const currentYear = new Date().getFullYear()
  const transits = [
    'Saturn in Aquarius', 'Jupiter in Taurus', 'Rahu in Pisces', 'Ketu in Virgo',
  ]
  const currentTransit = transits[currentYear % 4] || 'Jupiter in Taurus'

  return { sunSign, moonSign, nakshatra, mahadasha, antardasha, ascendant, currentTransit }
}

export function getNakshatraLord(nakshatra: string): string {
  const lords: Record<string, string> = {
    'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
    'Rohini': 'Moon', 'Mrigashira': 'Mars', 'Ardra': 'Rahu',
    'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
    'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
    'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
    'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury',
    'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
    'Shravana': 'Moon', 'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu',
    'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury',
  }
  return lords[nakshatra] || 'Saturn'
}

export function getSunSignFromDate(dob: string): string {
  const date = new Date(dob)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const signs = [
    { name: 'Capricorn', start: [1, 1], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] },
    { name: 'Capricorn', start: [12, 22], end: [12, 31] },
  ]
  for (const s of signs) {
    if (month === s.start[0] && day >= s.start[1]) return s.name
    if (month === s.end[0] && day <= s.end[1]) return s.name
  }
  return 'Unknown'
}
