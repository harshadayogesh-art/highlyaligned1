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
  // Extract the 4 labeled lines the system prompt now forces the AI to generate
  const bestPeriodMatch = answer.match(/Best Period:\s*([^\n]+)/i)
  const remedyMatch = answer.match(/Remedy:\s*([^\n]+)/i)
  const luckyMatch = answer.match(/Lucky Day:\s*([^\n]+)/i)
  const guidanceMatch = answer.match(/Guidance:\s*([^\n]+)/i)

  // Honest fallbacks — never show fake specifics like "Tuesday" or "Hanuman Chalisa"
  const defaults = {
    bestPeriod: language === 'hindi' ? 'विश्लेषण में देखें' : 'See analysis above',
    remedy: language === 'hindi' ? 'विश्लेषण में देखें' : 'See analysis above',
    luckyDay: language === 'hindi' ? 'विश्लेषण में देखें' : 'See analysis above',
    fieldAdvice: language === 'hindi' ? 'विश्लेषण में देखें' : 'See analysis above',
  }

  return {
    bestPeriod: bestPeriodMatch?.[1]?.trim() || defaults.bestPeriod,
    remedy: remedyMatch?.[1]?.trim() || defaults.remedy,
    luckyDay: luckyMatch?.[1]?.trim() || defaults.luckyDay,
    fieldAdvice: guidanceMatch?.[1]?.trim() || defaults.fieldAdvice,
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

    // Fetch custom AI prompt for this area (if admin has configured one)
    let customPrompt: string | null = null
    if (areaOfLifeId) {
      const { data: areaData } = await supabaseService
        .from('lead_magnet_areas')
        .select('ai_prompt')
        .eq('id', areaOfLifeId)
        .maybeSingle()
      if (areaData?.ai_prompt?.trim()) {
        customPrompt = areaData.ai_prompt.trim()
      }
    }

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

    const defaultSystemPrompt = `You are a senior Vedic astrology (Jyotish) expert with 20+ years of experience reading Janma Kundalis. You combine classical Parashari principles with practical, modern-day guidance. You speak with the warmth of a trusted family astrologer (like a wise elder), not a cold algorithm.

## INPUT DATA
You will receive birth details including: Name, Date, Time, Place, Sun Sign, Moon Sign, Nakshatra (with Lord), Ascendant (Lagna), Current Mahadasha, Current Antardasha, and Current Major Transit.

## ANALYSIS PROCESS
1. Identify the relevant houses for the user's question based on the Ascendant provided.
2. Note the ruling planets (house lords) and any planets occupying those houses.
3. Reference the Current Mahadasha, Antardasha, and Major Transit provided.
4. Explain which planetary energies are active and how they influence the specific area.

## RESPONSE STRUCTURE
Respond in exactly this order:

**1. Chart Insight (The "What")**
- 2-3 sentences on what the chart indicates for the area.
- Mention the relevant house(s) and house lord(s) by name.
- Reference the Moon Sign and Nakshatra provided.

**2. Current Timing (The "When")**
- Describe the effect of the Current Mahadasha and Antardasha on this area.
- Mention the Current Major Transit and how it impacts the relevant houses.

**3. Actionable Guidance (The "How")**
- Give 2-3 practical, culturally relevant remedies or actions.
- Link each remedy to the specific planet or house it supports.
- Frame remedies as supportive spiritual practices, not magical guarantees.

Then add exactly these 4 labeled lines at the very end of your response:
- Best Period: [specific timeframe]
- Remedy: [one specific, affordable remedy linked to the afflicted planet/house]
- Lucky Day: [day based on Moon sign/Nakshatra]
- Guidance: [one warm sentence of encouragement]

## TONE & STYLE
- Warm, respectful, encouraging. Never fear-monger.
- Use phrases like "strong indication," "favorable energy," or "a period of testing."
- Keep the 3 sections between 150-250 words total (the 4 labeled lines are extra).

## SAFETY
- If the question involves serious medical, legal, or mental health issues, provide astrological insight but gently advise consulting a qualified professional in that field.
- End your entire response with this exact sentence:
"This guidance is based on Vedic astrological principles for self-reflection and is not a substitute for professional advice."`

    const systemPrompt = customPrompt
      ? customPrompt
          .replace(/{name}/g, name)
          .replace(/{question}/g, question)
          .replace(/{birth_details}/g, birthDetails)
          .replace(/{area_name}/g, areaOfLife)
      : defaultSystemPrompt

    const userPrompt =
      language === 'hindi'
        ? `जन्म विवरण:\n${birthDetails}\n\nक्षेत्र: ${areaOfLife}\n\nप्रश्न: ${question}`
        : `Birth Details:\n${birthDetails}\n\nArea of Life: ${areaOfLife}\n\nQuestion: ${question}`

    // 4. Call Gemini API with retry
    async function generateKundali(
      sysPrompt: string,
      usrPrompt: string
    ): Promise<{ answer: string; finishReason?: string }> {
      const genAI = getGeminiClient()
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 4096,
        },
      })

      const result = await model.generateContent([sysPrompt, usrPrompt])
      const response = await result.response
      const answer = response.text()
      const finishReason = response.candidates?.[0]?.finishReason

      // Retry once if truncated and too short
      if (finishReason === 'MAX_TOKENS' && answer.split(/\s+/).length < 100) {
        console.warn('[Kundali AI] Response truncated. Retrying with lower temperature...')
        const retryModel = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        })
        const retryResult = await retryModel.generateContent([sysPrompt, usrPrompt])
        const retryResponse = await retryResult.response
        const retryAnswer = retryResponse.text()
        const retryFinishReason = retryResponse.candidates?.[0]?.finishReason

        if (retryFinishReason !== 'MAX_TOKENS' || retryAnswer.split(/\s+/).length >= 100) {
          return { answer: retryAnswer, finishReason: retryFinishReason }
        }
        console.warn('[Kundali AI] Retry also truncated. Returning best effort.')
        return { answer: retryAnswer, finishReason: retryFinishReason }
      }

      return { answer, finishReason }
    }

    const { answer, finishReason } = await generateKundali(systemPrompt, userPrompt)
    if (finishReason === 'MAX_TOKENS') {
      console.warn('[Kundali AI] Final response may be truncated. Word count:', answer.split(/\s+/).length)
    }

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
