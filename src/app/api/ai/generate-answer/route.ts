import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { leadId, name, question, birthDetails, areaName, areaPrompt } = await req.json()

    if (!leadId || !name || !question) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const systemPrompt =
      areaPrompt ||
      `You are a compassionate Vedic astrology expert. Based on birth details, answer this question about ${areaName}: ${question}. Provide: 1) A warm personalized answer (3-4 paragraphs), 2) Best Period, 3) Field Advice, 4) Lucky Day, 5) Simple Remedy. Keep it culturally appropriate for Indian middle-class spiritual seekers.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Name: ${name}\nQuestion: ${question}\nBirth Details: ${birthDetails || 'Not provided'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const answer = completion.choices[0].message.content || ''

    // Parse insights from answer
    const lines = answer.split('\n')
    const bestPeriod = lines.find((l) => l.toLowerCase().includes('best period') || l.toLowerCase().includes('period'))?.replace(/[*\-]/g, '').trim() || 'Next 3 months'
    const fieldAdvice = lines.find((l) => l.toLowerCase().includes('focus') || l.toLowerCase().includes('advice'))?.replace(/[*\-]/g, '').trim() || 'Stay consistent'
    const luckyDay = lines.find((l) => l.toLowerCase().includes('lucky day') || l.toLowerCase().includes('day'))?.replace(/[*\-]/g, '').trim() || 'Thursday'
    const remedy = lines.find((l) => l.toLowerCase().includes('remedy') || l.toLowerCase().includes('simple'))?.replace(/[*\-]/g, '').trim() || 'Light a mustard oil lamp daily'

    const insights = [
      { label: 'Best Period', value: bestPeriod },
      { label: 'Field Advice', value: fieldAdvice },
      { label: 'Lucky Day', value: luckyDay },
      { label: 'Simple Remedy', value: remedy },
    ]

    // Save to DB
    const supabase = await createClient()
    await supabase
      .from('leads')
      .update({
        ai_answer: answer,
        ai_prompt_used: systemPrompt,
        status: 'interested',
        report_data_json: { insights },
      })
      .eq('id', leadId)

    return NextResponse.json({ answer, insights })
  } catch (err) {
    console.error('AI generation error:', err)
    return NextResponse.json(
      { error: 'AI generation failed. Harshada will personally respond via WhatsApp within 24 hours.' },
      { status: 500 }
    )
  }
}
