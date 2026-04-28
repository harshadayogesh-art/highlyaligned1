import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const requestSchema = z.object({
  topic: z.string().min(3),
  keywords: z.string().optional(),
  category: z.string().optional(),
  tone: z.enum(['friendly', 'professional', 'spiritual', 'casual']).default('spiritual'),
})

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  return new GoogleGenerativeAI(key)
}

function extractJSON(text: string): Record<string, unknown> {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenceMatch ? fenceMatch[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return JSON.parse(raw.slice(start, end + 1))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
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

    const { topic, keywords, category, tone } = parsed.data

    const toneInstructions: Record<string, string> = {
      friendly: 'Warm, conversational, and approachable. Use "you" and "we".',
      professional: 'Authoritative, well-researched, and polished.',
      spiritual: 'Heart-centered, devotional, and deeply rooted in Vedic wisdom. Use Sanskrit terms naturally.',
      casual: 'Light, easy-to-read, blog-style with short paragraphs.',
    }

    const systemText =
      'You are an expert content writer for HighlyAligned, a spiritual wellness brand based in India. ' +
      'You write SEO-optimized blog posts about astrology, crystals, chakras, tarot, rituals, and spiritual growth. ' +
      'Always respond with a single valid JSON object containing the blog post.'

    const userText =
      `Write a complete blog post about: "${topic}"` +
      (category ? ` in the category "${category}".` : '.') +
      (keywords ? `\nTarget SEO keywords: ${keywords}` : '') +
      `\nTone: ${toneInstructions[tone]}\n\n` +
      'Return ONLY a JSON object with these exact keys:\n' +
      '- title: catchy, SEO-friendly blog title (max 60 chars)\n' +
      '- excerpt: 1-2 sentence hook for the blog card (max 160 chars)\n' +
      '- content: full blog post content (800-1200 words), formatted with paragraphs and subheadings using markdown ## and ###\n' +
      '- meta_title: SEO meta title (max 60 chars)\n' +
      '- meta_description: SEO meta description (max 160 chars)\n' +
      '- tags: array of 3-5 relevant tag strings\n\n' +
      'Output only the JSON, no explanation.'

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 4096,
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

    const title = String(data.title ?? topic)

    return NextResponse.json({
      success: true,
      data: {
        title,
        slug: slugify(title),
        excerpt: String(data.excerpt ?? ''),
        content: String(data.content ?? ''),
        meta_title: String(data.meta_title ?? title),
        meta_description: String(data.meta_description ?? ''),
        tags: Array.isArray(data.tags) ? data.tags : [],
      },
    })
  } catch (error: unknown) {
    console.error('AI blog generation error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `AI generation failed: ${msg}` },
      { status: 500 }
    )
  }
}
