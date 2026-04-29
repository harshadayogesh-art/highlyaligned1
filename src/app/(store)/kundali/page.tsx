'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLeadAreas } from '@/hooks/use-lead-areas'
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads'
import { usePageBlockMap } from '@/components/store/page-block'
import { searchCities } from '@/lib/lead-magnet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Send,
  Loader2,
  MessageCircle,
  Star,
  Sun,
  Moon,
  ArrowUp,
  ArrowLeft,
  Globe,
} from 'lucide-react'

const AREA_ICONS: Record<string, string> = {
  'Career & Job': '💼',
  'Wealth & Finance': '💰',
  'Marriage & Love': '💕',
  'Health & Wellness': '🏥',
  'Family & Relations': '👨‍👩‍👧',
  'Property & Home': '🏠',
  'Legal & Disputes': '⚖️',
  'Travel & Abroad': '✈️',
  'Education & Exam': '📚',
  'Spiritual Growth': '🧘',
}

const TRANSLATE_LANGS: { code: 'en' | 'hi' | 'gu' | 'mr'; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
]

async function translateWithMyMemory(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text
  try {
    // MyMemory free API — chunk into ~400 char pieces to stay within limits
    const chunks: string[] = []
    let remaining = text
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, 400)
      const lastPeriod = chunk.lastIndexOf('.')
      const lastNewline = chunk.lastIndexOf('\n')
      const breakAt = Math.max(lastPeriod > 0 ? lastPeriod + 1 : 0, lastNewline > 0 ? lastNewline + 1 : 0)
      if (breakAt > 50 && remaining.length > 400) {
        chunks.push(remaining.slice(0, breakAt).trim())
        remaining = remaining.slice(breakAt).trim()
      } else {
        chunks.push(remaining.slice(0, 400).trim())
        remaining = remaining.slice(400).trim()
      }
    }

    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`
        const res = await fetch(url)
        const data = await res.json()
        return (data.responseData?.translatedText as string) || chunk
      })
    )

    return translatedChunks.join(' ')
  } catch {
    return text
  }
}

export default function KundaliPage() {
  const blocks = usePageBlockMap('kundali')
  const { data: areas, isLoading: areasLoading, isError: areasError } = useLeadAreas()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const [step, setStep] = useState(1)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{
    answer: string
    insights: Record<string, string> | null
    chart: Record<string, string> | null
  } | null>(null)
  const [language, setLanguage] = useState<'english' | 'hindi'>('english')

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    dob: '',
    birth_time: '',
    birth_time_approx: false,
    birth_location: '',
  })

  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])

  // Report translation state
  const [reportLang, setReportLang] = useState<'en' | 'hi' | 'gu' | 'mr'>('en')
  const [translatedAnswer, setTranslatedAnswer] = useState('')
  const [translatedInsights, setTranslatedInsights] = useState<Record<string, string> | null>(null)
  const [translating, setTranslating] = useState(false)

  const handleCityInput = (val: string) => {
    setForm((f) => ({ ...f, birth_location: val }))
    setCitySuggestions(searchCities(val))
  }

  const handleStep1 = async () => {
    if (!form.name || !form.mobile || !form.dob || !form.birth_location) {
      toast.error(language === 'hindi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields')
      return
    }
    if (form.name.trim().length < 2) {
      toast.error(language === 'hindi' ? 'कृपया कम से कम 2 अक्षरों का नाम दर्ज करें' : 'Please enter a name with at least 2 characters')
      return
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      toast.error(language === 'hindi' ? 'वैध 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें' : 'Valid 10-digit Indian mobile required')
      return
    }

    try {
      const lead = await createLead.mutateAsync({
        name: form.name.trim(),
        mobile: form.mobile,
        email: form.email || null,
        dob: form.dob,
        birth_time: form.birth_time_approx ? 'approximate' : form.birth_time,
        birth_location: form.birth_location,
        source: 'free_report',
        status: 'new',
      })

      setLeadId(lead.id)
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Create lead failed:', err)
      toast.error(language === 'hindi' ? 'फ़ॉर्म सबमिट करने में त्रुटि। कृपया पुनः प्रयास करें।' : 'Error submitting form. Please try again.')
    }
  }

  const handleStep2 = async () => {
    if (!selectedArea) {
      toast.error(language === 'hindi' ? 'कृपया जीवन का क्षेत्र चुनें' : 'Please select an area of life')
      return
    }
    if (question.length < 20) {
      toast.error(language === 'hindi' ? 'कृपया विशिष्ट प्रश्न लिखें (न्यूनतम 20 अक्षर)' : 'Please be specific. Minimum 20 characters.')
      return
    }

    setGenerating(true)
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const areaName = areas?.find((a) => a.id === selectedArea)?.name || 'Career & Job'

      const res = await fetch('/api/ai/generate-kundali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId!,
          areaOfLifeId: selectedArea,
          name: form.name,
          dob: form.dob,
          birthTime: form.birth_time || '12:00',
          birthLocation: form.birth_location,
          areaOfLife: areaName,
          question,
          language,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report')
      }

      if (data.answer) {
        setResult({
          answer: data.answer,
          insights: data.insights,
          chart: data.chart,
        })
        // Reset translation when new report arrives
        setReportLang('en')
        setTranslatedAnswer('')
        setTranslatedInsights(null)
      } else {
        throw new Error('No answer received')
      }
    } catch (err) {
      console.error('Generate report failed:', err)
      const fallback =
        language === 'hindi'
          ? `प्रिय ${form.name}, आपका प्रश्न बहुत महत्वपूर्ण है। हर्षदा जी व्यक्तिगत रूप से आपकी कुंडली देखकर 24 घंटे के भीतर जवाब देंगी। कृपया WhatsApp पर संपर्क करें: +91 84688 83571`
          : `Dear ${form.name}, your question is very important. Harshada will personally review your birth chart and respond within 24 hours. Please reach out on WhatsApp: +91 84688 83571`

      setResult({
        answer: fallback,
        insights: null,
        chart: null,
      })

      // Save fallback to lead (best-effort, don't block UI)
      try {
        await updateLead.mutateAsync({
          leadId: leadId!,
          updates: {
            ai_answer: fallback,
            status: 'interested',
          },
        })
      } catch {
        // Silently ignore — the user already sees the fallback answer
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleTranslate = async (targetLang: 'en' | 'hi' | 'gu' | 'mr') => {
    if (!result || targetLang === reportLang) return
    if (targetLang === 'en') {
      setReportLang('en')
      setTranslatedAnswer('')
      setTranslatedInsights(null)
      return
    }
    setTranslating(true)
    try {
      const [ans, ...insightValues] = await Promise.all([
        translateWithMyMemory(result.answer, targetLang),
        result.insights?.bestPeriod ? translateWithMyMemory(result.insights.bestPeriod, targetLang) : Promise.resolve(''),
        result.insights?.remedy ? translateWithMyMemory(result.insights.remedy, targetLang) : Promise.resolve(''),
        result.insights?.luckyDay ? translateWithMyMemory(result.insights.luckyDay, targetLang) : Promise.resolve(''),
        result.insights?.fieldAdvice ? translateWithMyMemory(result.insights.fieldAdvice, targetLang) : Promise.resolve(''),
      ])
      setTranslatedAnswer(ans)
      setTranslatedInsights({
        bestPeriod: insightValues[0],
        remedy: insightValues[1],
        luckyDay: insightValues[2],
        fieldAdvice: insightValues[3],
      })
      setReportLang(targetLang)
    } catch {
      toast.error('Translation failed. Please try again.')
    } finally {
      setTranslating(false)
    }
  }

  const t = (en: string, hi: string) => {
    const enKey = en.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
    const hiKey = enKey + '_hi'
    if (language === 'hindi') {
      const blockText = blocks[hiKey]?.content?.text as string
      if (blockText) return blockText
    }
    const blockText = blocks[enKey]?.content?.text as string
    if (blockText) return blockText
    return language === 'hindi' ? hi : en
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Header */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {t('Back to Home', 'होम पर जाएं')}
          </Link>
          <button
            onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
            className="text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
          >
            {language === 'english' ? 'हिंदी' : 'English'}
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#f59e0b]/10 mb-2">
            <Sparkles className="h-7 w-7 text-[#f59e0b]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {(language === 'hindi'
              ? (blocks['hero_title_hi']?.content?.text as string)
              : (blocks['hero_title']?.content?.text as string))
              || t('Know Your Future', 'अपना भविष्य जानें')}
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {(language === 'hindi'
              ? (blocks['hero_subtitle_hi']?.content?.text as string)
              : (blocks['hero_subtitle']?.content?.text as string))
              || t(
                'Enter your birth details. Ask your question. Get personalized Vedic guidance powered by AI.',
                'अपनी जन्म विवरण दर्ज करें। अपना प्रश्न पूछें। AI द्वारा संचालित व्यक्तिगत वेदिक मार्गदर्शन प्राप्त करें।'
              )}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s <= step ? 'bg-[#f59e0b] text-slate-900' : 'bg-white/10 text-slate-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 rounded-full ${s < step ? 'bg-[#f59e0b]' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{(language === 'hindi' ? (blocks['step_1_label_hi']?.content?.text as string) : (blocks['step_1_label']?.content?.text as string)) || t('Details', 'विवरण')}</span>
          <span>{(language === 'hindi' ? (blocks['step_2_label_hi']?.content?.text as string) : (blocks['step_2_label']?.content?.text as string)) || t('Question', 'प्रश्न')}</span>
          <span>{(language === 'hindi' ? (blocks['step_3_label_hi']?.content?.text as string) : (blocks['step_3_label']?.content?.text as string)) || t('Answer', 'उत्तर')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-16 max-w-2xl mx-auto">
        {/* Step 1: Birth Details */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">{(language === 'hindi' ? (blocks['form_section_title_hi']?.content?.text as string) : (blocks['form_section_title']?.content?.text as string)) || t('Your Birth Details', 'आपकी जन्म विवरण')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-slate-300">{t('Full Name', 'पूरा नाम')} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder={t('Priya Sharma', 'प्रिया शर्मा')}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">{t('Mobile', 'मोबाइल')} *</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder="9876543210"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">{t('Email', 'ईमेल')}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder="priya@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {t('Date of Birth', 'जन्म तिथि')} *
                </Label>
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {t('Birth Time', 'जन्म समय')}
                </Label>
                <Input
                  type="time"
                  value={form.birth_time}
                  onChange={(e) => setForm({ ...form, birth_time: e.target.value })}
                  disabled={form.birth_time_approx}
                  className="bg-white/5 border-white/10 text-white disabled:opacity-50"
                />
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={form.birth_time_approx}
                    onChange={(e) => setForm({ ...form, birth_time_approx: e.target.checked, birth_time: '' })}
                    className="accent-[#f59e0b]"
                  />
                  {t('Approximate / Unknown', 'लगभग / अज्ञात')}
                </label>
              </div>
              <div className="space-y-1 relative">
                <Label className="text-slate-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {t('Birth Location', 'जन्म स्थान')} *
                </Label>
                <Input
                  value={form.birth_location}
                  onChange={(e) => handleCityInput(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder={t('Mumbai, Maharashtra', 'मुंबई, महाराष्ट्र')}
                />
                {citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-slate-800 border border-white/10 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {citySuggestions.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setForm((f) => ({ ...f, birth_location: city }))
                          setCitySuggestions([])
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button
              className="w-full bg-[#f59e0b] text-slate-900 font-semibold"
              onClick={handleStep1}
              disabled={createLead.isPending}
            >
              {createLead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t('Continue', 'जारी रखें')} <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Area + Question */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">{(language === 'hindi' ? (blocks['question_section_title_hi']?.content?.text as string) : (blocks['question_section_title']?.content?.text as string)) || t('Select Area & Ask Question', 'क्षेत्र चुनें और प्रश्न पूछें')}</h2>
            {areasLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5 animate-pulse h-20" />
                ))}
              </div>
            )}
            {areasError && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
                {language === 'hindi'
                  ? 'क्षेत्र लोड करने में त्रुटि। कृपया पृष्ठ रीफ़्रेश करें।'
                  : 'Failed to load areas. Please refresh the page.'}
              </div>
            )}
            {!areasLoading && !areasError && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {areas && areas.length > 0 ? (
                  areas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => setSelectedArea(area.id)}
                      className={`p-3 rounded-xl border text-center text-sm transition-colors ${
                        selectedArea === area.id
                          ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-white'
                          : 'border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <span className="text-xl">{AREA_ICONS[area.name] || '✨'}</span>
                      <p className="text-xs mt-1 font-medium leading-tight">{area.name}</p>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full p-4 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm text-center">
                    {language === 'hindi'
                      ? 'कोई क्षेत्र उपलब्ध नहीं। कृपया बाद में पुनः प्रयास करें।'
                      : 'No areas available. Please try again later.'}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-slate-300">{t('Your Specific Question', 'आपका विशिष्ट प्रश्न')}</Label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  language === 'hindi'
                    ? 'मैंने 3 महीने पहले अपनी आईटी नौकरी खो दी। मुझे नई नौकरी कब मिलेगी?'
                    : 'I lost my IT job 3 months ago. When will I get a new job?'
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 min-h-[100px]"
              />
              <p className={`text-xs ${question.length < 20 ? 'text-red-400' : 'text-slate-500'}`}>
                {question.length}/300 {t('chars', 'अक्षर')} {question.length > 0 && question.length < 20 && `(min 20)`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('Back', 'वापस')}
              </Button>
              <Button
                className="flex-1 bg-[#f59e0b] text-slate-900 font-semibold disabled:opacity-50"
                onClick={handleStep2}
                disabled={!selectedArea || question.length < 20 || areasLoading || areasError || !areas?.length}
              >
                <Send className="h-4 w-4 mr-1" />
                {t('Get My Free Report', 'मुफ्त रिपोर्ट प्राप्त करें')}
              </Button>
            </div>
            {!selectedArea && (
              <p className="text-xs text-amber-400 text-center">
                {language === 'hindi' ? 'कृपया ऊपर से एक क्षेत्र चुनें' : 'Please select an area above'}
              </p>
            )}
            {selectedArea && question.length > 0 && question.length < 20 && (
              <p className="text-xs text-amber-400 text-center">
                {language === 'hindi' ? `कृपया अपना प्रश्न लिखें (${20 - question.length} अक्षर और चाहिए)` : `Please write more details (${20 - question.length} more chars needed)`}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="space-y-6">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-[#f59e0b] border-t-transparent animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-[#f59e0b]" />
                </div>
                <p className="text-slate-300 animate-pulse">
                  {t('Analyzing your birth chart...', 'आपकी कुंडली का विश्लेषण हो रहा है...')}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {t(`Calculating planetary positions for ${form.name}`, `${form.name} के लिए ग्रह स्थितियों की गणना`)}...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Chart Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 p-6 rounded-2xl">
                  <h2 className="text-xl font-bold mb-1">
                    {t(`Dear ${form.name},`, `प्रिय ${form.name},`)}
                  </h2>
                  <p className="text-[#f59e0b]">
                    {t(
                      `Your Personalized Guidance for ${areas?.find((a) => a.id === selectedArea)?.name || ''}`,
                      `${areas?.find((a) => a.id === selectedArea)?.name || ''} के लिए आपका मार्गदर्शन`
                    )}
                  </p>
                  {result.chart && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Sun className="h-3 w-3 text-amber-400" /> {result.chart.sunSign}
                      </span>
                      <span className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Moon className="h-3 w-3 text-slate-300" /> {result.chart.moonSign}
                      </span>
                      <span className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" /> {result.chart.nakshatra}
                      </span>
                      <span className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-emerald-400" /> {result.chart.ascendant}
                      </span>
                    </div>
                  )}
                </div>

                {/* Answer */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#f59e0b]" />
                      <span className="text-xs text-slate-400 font-medium">
                        {reportLang === 'en' ? 'Original' : `Translated to ${TRANSLATE_LANGS.find(l => l.code === reportLang)?.label || ''}`}
                      </span>
                    </div>
                    {translating && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Translating...
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-line text-slate-300 leading-relaxed text-sm">
                    {reportLang === 'en' || !translatedAnswer ? result.answer : translatedAnswer}
                  </div>

                  {/* Language Selector */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                      {t('Read this report in:', 'इस रिपोर्ट को पढ़ें:')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TRANSLATE_LANGS.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleTranslate(lang.code)}
                          disabled={translating}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            reportLang === lang.code
                              ? 'bg-[#f59e0b] text-slate-900'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                          } ${translating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {lang.native}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {(reportLang === 'en' ? result.insights : translatedInsights) && (
                  <div className="grid grid-cols-2 gap-3">
                    {(reportLang === 'en' ? result.insights : translatedInsights)?.bestPeriod && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                        <div className="text-amber-400 text-xs font-semibold mb-1">{t('Best Period', 'श्रेष्ठ काल')}</div>
                        <div className="text-white text-sm">{(reportLang === 'en' ? result.insights : translatedInsights)?.bestPeriod}</div>
                      </div>
                    )}
                    {(reportLang === 'en' ? result.insights : translatedInsights)?.remedy && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                        <div className="text-emerald-400 text-xs font-semibold mb-1">{t('Simple Remedy', 'सरल उपाय')}</div>
                        <div className="text-white text-sm">{(reportLang === 'en' ? result.insights : translatedInsights)?.remedy}</div>
                      </div>
                    )}
                    {(reportLang === 'en' ? result.insights : translatedInsights)?.luckyDay && (
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        <div className="text-blue-400 text-xs font-semibold mb-1">{t('Lucky Day', 'शुभ दिन')}</div>
                        <div className="text-white text-sm">{(reportLang === 'en' ? result.insights : translatedInsights)?.luckyDay}</div>
                      </div>
                    )}
                    {(reportLang === 'en' ? result.insights : translatedInsights)?.fieldAdvice && (
                      <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                        <div className="text-purple-400 text-xs font-semibold mb-1">{t('Guidance', 'मार्गदर्शन')}</div>
                        <div className="text-white text-sm">{(reportLang === 'en' ? result.insights : translatedInsights)?.fieldAdvice}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-slate-500 text-center">
                  {t(
                    'This guidance is based on Vedic astrology principles. For detailed Dasha analysis and personalized remedies, book a consultation with Harshada.',
                    'यह मार्गदर्शन वैदिक ज्योतिष सिद्धांतों पर आधारित है। विस्तृत दशा विश्लेषण के लिए हर्षदा से परामर्श बुक करें।'
                  )}
                </p>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <Link
                    href="/services"
                    className="w-full bg-[#f59e0b] text-slate-900 font-bold py-4 rounded-xl text-center hover:bg-[#d97706] transition"
                  >
                    {t('Book Detailed Consultation — ₹1,500', 'विस्तृत परामर्श बुक करें — ₹1,500')}
                  </Link>
                  <a
                    href={`https://wa.me/918468883571?text=Hi%20Harshada,%20I%20got%20my%20free%20report%20and%20want%20to%20know%20more.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] text-white font-semibold py-3 rounded-xl text-center hover:bg-[#1ebe5b] transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {t('Ask on WhatsApp', 'WhatsApp पर पूछें')}
                  </a>
                  <button
                    onClick={() => {
                      setStep(1)
                      setResult(null)
                      setLeadId(null)
                      setForm({ name: '', mobile: '', email: '', dob: '', birth_time: '', birth_time_approx: false, birth_location: '' })
                      setSelectedArea(null)
                      setQuestion('')
                      setReportLang('en')
                      setTranslatedAnswer('')
                      setTranslatedInsights(null)
                    }}
                    className="w-full border border-white/20 text-slate-300 py-3 rounded-xl text-center hover:bg-white/5 transition"
                  >
                    {t('Get Another Report', 'एक और रिपोर्ट प्राप्त करें')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
