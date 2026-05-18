import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been replaced by generate-kundali. Use /api/ai/generate-kundali instead.' },
    { status: 501 }
  )
}
