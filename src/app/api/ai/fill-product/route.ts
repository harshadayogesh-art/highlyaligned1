import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const requestSchema = z.object({
  productName: z.string().min(2),
  categoryName: z.string().optional(),
})

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  return new GoogleGenerativeAI(key)
}

/** Extract a JSON block from the model response, stripping any markdown fences */
function extractJSON(text: string): Record<string, unknown> {
  // Try to find a JSON object inside markdown fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenceMatch ? fenceMatch[1] : text

  // Find the outermost { … }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return JSON.parse(raw.slice(start, end + 1))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productName, categoryName } = parsed.data
    const catContext = categoryName ? ` in the category "${categoryName}"` : ''

    // System context (sent as first content part)
    const systemText =
      'You are a product content writer for HighlyAligned, an Indian spiritual wellness brand. ' +
      'Write warm, authentic, SEO-friendly content for spiritual products like crystals, ' +
      'yantras, rudraksha, and malas. Always respond with a single valid JSON object.'

    // User request (clear, not repetitive)
    const userText =
      `Write product content for: ${productName}${catContext}.\n\n` +
      'Return ONLY a JSON object with these exact keys:\n' +
      '- description: 2 short paragraphs about the product origin, significance and benefits\n' +
      '- how_to_use: numbered steps (1. cleanse 2. activate 3. daily use)\n' +
      '- energization_process: one sentence on how HighlyAligned energizes it before shipping\n' +
      '- sku_suggestion: short SKU like HA-CRY-001\n' +
      '- weight_estimate_grams: integer shipping weight\n\n' +
      'Output only the JSON, no explanation.'

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1200,
        // NOTE: do NOT set responseMimeType here — it triggers loop detection
      },
    })

    const result = await model.generateContent([systemText, userText])
    const text = result.response.text()

    let data: Record<string, unknown>
    try {
      data = extractJSON(text)
    } catch {
      console.error('Raw AI response (parse failure):', text.slice(0, 500))
      return NextResponse.json(
        { error: 'AI returned unreadable content. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        description: String(data.description ?? ''),
        how_to_use: String(data.how_to_use ?? ''),
        energization_process: String(data.energization_process ?? ''),
        sku_suggestion: String(data.sku_suggestion ?? ''),
        weight_estimate_grams: Number(data.weight_estimate_grams) || 0,
      },
    })
  } catch (error: unknown) {
    console.error('AI fill-product error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `AI generation failed: ${msg}` },
      { status: 500 }
    )
  }
}
