import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { calculateBasicChart, getNakshatraLord } from '@/lib/astrology'
import { supabaseService } from '@/lib/supabase/service'
import { z } from 'zod'

const requestSchema = z.object({
  leadId: z.string().uuid(),
  areaOfLifeId: z.string().uuid().optional(),
  name: z.string().min(2),
  dob: z.string(),
  birthTime: z.string(),
  birthLocation: z.string(),
  areaOfLife: z.string(),
  question: z.string().min(20).max(300),
  language: z.enum(['hindi', 'english']).default('english'),
})

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

const rateLimitStore: Record<string, { count: number; resetTime: number }> = {}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  if (!rateLimitStore[ip] || now > rateLimitStore[ip].resetTime) {
    rateLimitStore[ip] = { count: 1, resetTime: now + WINDOW_MS }
    return true
  }
  if (rateLimitStore[ip].count >= RATE_LIMIT) return false
  rateLimitStore[ip].count++
  return true
}

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  return new GoogleGenerativeAI(key)
}

function parseInsights(answer: string, language: string) {
  const bestPeriodMatch = answer.match(/(?:Best Period|भविष्य|Outlook|अगले)[^\n]*/i)
  const remedyMatch = answer.match(/(?:Remedy|उपाय|Remedies)[^\n]*/i)
  const luckyMatch = answer.match(/(?:Lucky|शुभ| Lucky)[^\n]*/i)

  return {
    bestPeriod: bestPeriodMatch?.[0]?.trim() || (language === 'hindi' ? 'अगले 3 महीने' : 'Next 3 months'),
    remedy: remedyMatch?.[0]?.trim() || (language === 'hindi' ? 'हनुमान चालीसा का पाठ' : 'Hanuman Chalisa recitation'),
    luckyDay: luckyMatch?.[0]?.trim() || (language === 'hindi' ? 'मंगलवार' : 'Tuesday'),
    fieldAdvice: language === 'hindi' ? 'धैर्य रखें, समय अनुकूल है' : 'Stay patient, favorable times ahead',
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { leadId, areaOfLifeId, name, dob, birthTime, birthLocation, areaOfLife, question, language } =
      parsed.data

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in 1 hour.' },
        { status: 429 }
      )
    }

    // 1. Update lead with area & question using service role (bypasses RLS)
    const leadUpdatePayload: Record<string, unknown> = {
      customer_question: question,
      status: 'contacted',
    }
    if (areaOfLifeId) leadUpdatePayload.area_of_life_id = areaOfLifeId

    const { error: updateError } = await supabaseService
      .from('leads')
      .update(leadUpdatePayload)
      .eq('id', leadId)

    if (updateError) {
      console.error('Lead update error (step 1):', updateError)
    }

    // 2. Check if we already have an AI answer cached
    const { data: existing } = await supabaseService
      .from('leads')
      .select('ai_answer')
      .eq('id', leadId)
      .maybeSingle()

    if (existing?.ai_answer) {
      return NextResponse.json({ answer: existing.ai_answer, cached: true })
    }

    // 3. Calculate birth chart
    const chart = calculateBasicChart(dob, birthTime)
    const nakshatraLord = getNakshatraLord(chart.nakshatra)

    const birthDetails = `
Name: ${name}
Date of Birth: ${dob}
Birth Time: ${birthTime}
Birth Location: ${birthLocation}
Sun Sign (Rashi): ${chart.sunSign}
Moon Sign (Chandra Rashi): ${chart.moonSign}
Nakshatra: ${chart.nakshatra} (Lord: ${nakshatraLord})
Ascendant (Lagna): ${chart.ascendant}
Current Mahadasha: ${chart.mahadasha}
Current Antardasha: ${chart.antardasha}
Current Major Transit: ${chart.currentTransit}
    `.trim()

    const systemPrompt =
      language === 'hindi'
        ? `आप एक अनुभवी वेदिक ज्योतिषी हैं। नीचे दिए गए जन्म विवरण और क्षेत्र के आधार पर, उपयोगकर्ता के प्रश्न का एक गर्मजोशी, व्यक्तिगत और कार्यात्मक उत्तर दें।

निर्देश:
1. उत्तर 3-4 पैराग्राफ में हो।
2. वेदिक ज्योतिष के सिद्धांतों का उपयोग करें।
3. वर्तमान ग्रह दशा और गोचर का विश्लेषण करें।
4. एक सरल उपाय (remedy) सुझाएं।
5. हिंदी में जवाब दें।`
        : `You are a compassionate and experienced Vedic Astrologer. Based on the birth details and area of life provided, answer the user's question with warmth, personalization, and actionable guidance.

Instructions:
1. Answer in 3-4 paragraphs.
2. Use Vedic astrology principles (houses, dashas, transits).
3. Reference the current planetary positions and their effects.
4. Suggest one simple, practical remedy (mantra, fasting, donation, or gemstone).
5. Be culturally sensitive to Indian middle-class spiritual seekers.
6. Do NOT make absolute negative predictions. Frame challenges as "periods of growth" or "testing times".
7. Include a "Best Period" prediction (next 3-6 months).
8. Include a "Lucky Day/Number" based on Moon sign.`

    const userPrompt =
      language === 'hindi'
        ? `जन्म विवरण:\n${birthDetails}\n\nक्षेत्र: ${areaOfLife}\n\nप्रश्न: ${question}\n\nकृपया उत्तर इस प्रारूप में दें:\n1. व्यक्तिगत विश्लेषण\n2. वर्तमान ग्रह प्रभाव\n3. भविष्य की भविष्यवाणी (अगले 3-6 महीने)\n4. सरल उपाय\n5. शुभ दिन/संख्या`
        : `Birth Details:\n${birthDetails}\n\nArea of Life: ${areaOfLife}\n\nQuestion: ${question}\n\nPlease answer in this format:\n1. PERSONAL ANALYSIS (based on Moon sign and current dasha)\n2. CURRENT PLANETARY EFFECTS (transits impacting this area)\n3. FUTURE OUTLOOK (next 3-6 months)\n4. SIMPLE REMEDY (one practical, affordable remedy)\n5. LUCKY DAY/NUMBER`

    // 4. Call Gemini API
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    })

    const result = await model.generateContent([systemPrompt, userPrompt])
    const response = await result.response
    const answer = response.text()

    const insights = parseInsights(answer, language)

    // 5. Save result to lead
    const { error: saveError } = await supabaseService
      .from('leads')
      .update({
        ai_answer: answer,
        ai_prompt_used: systemPrompt,
        report_data_json: {
          chart,
          insights,
          question,
          areaOfLife,
          generatedAt: new Date().toISOString(),
        },
        status: 'interested',
      })
      .eq('id', leadId)

    if (saveError) {
      console.error('Lead save error (step 5):', saveError)
      throw new Error('Failed to save report to database')
    }

    // 6. Try to send WhatsApp notification (non-blocking)
    try {
      const { data: leadData } = await supabaseService.from('leads').select('mobile').eq('id', leadId).single()
      if (leadData?.mobile) {
        const { sendWhatsApp } = await import('@/lib/notifications')
        const { data: settings } = await supabaseService.from('settings').select('value').eq('key', 'notifications_config').single()
        const config = settings?.value as Record<string, boolean> | null

        if (!config || config.lead_reports !== false) {
          await sendWhatsApp(leadData.mobile, 'lead_report', {
            1: name,
            2: `https://highlyaligned.in/kundali`,
          }).catch(console.error)
        }
      }
    } catch {
      // Notification failures should not break the response
    }

    return NextResponse.json({
      answer,
      insights,
      chart,
      cached: false,
    })
  } catch (error: unknown) {
    console.error('Kundali API Error:', error)

    const errMessage = error instanceof Error ? error.message : ''
    const isKeyMissing = errMessage.includes('not configured') || errMessage.includes('API key')

    const fallback =
      body.language === 'hindi'
        ? `प्रिय ${body.name || 'साधक'}, आपका प्रश्न बहुत महत्वपूर्ण है। वर्तमान में हमारी AI सेवा में थोड़ी दिक्कत है। हर्षदा जी व्यक्तिगत रूप से आपकी कुंडली देखकर 24 घंटे के भीतर जवाब देंगी। कृपया WhatsApp पर संपर्क करें: +91 84688 83571`
        : `Dear ${body.name || 'Seeker'}, your question is very important. Our AI service is experiencing a brief issue. Harshada will personally review your birth chart and respond within 24 hours. Please reach out on WhatsApp: +91 84688 83571`

    // Save fallback to database so admin can see it
    try {
      const leadId = body.leadId as string
      if (leadId) {
        const chart = body.dob ? calculateBasicChart(String(body.dob), String(body.birthTime || '12:00')) : null
        await supabaseService
          .from('leads')
          .update({
            ai_answer: fallback,
            report_data_json: {
              chart,
              insights: null,
              question: body.question,
              areaOfLife: body.areaOfLife,
              generatedAt: new Date().toISOString(),
              fallback: true,
            },
            status: 'interested',
          })
          .eq('id', leadId)
      }
    } catch (dbErr) {
      console.error('Failed to save fallback to DB:', dbErr)
    }

    return NextResponse.json(
      {
        answer: fallback,
        insights: null,
        chart: null,
        fallback: true,
        keyMissing: isKeyMissing,
      },
      { status: 200 }
    )
  }
}
