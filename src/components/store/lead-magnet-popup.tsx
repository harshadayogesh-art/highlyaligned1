'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads'
import { useLeadAreas } from '@/hooks/use-lead-areas'
import { searchCities } from '@/lib/lead-magnet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Sparkles,
  X,
  Loader2,
  MessageCircle,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Send,
  Star,
  ArrowRight,
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

interface LeadSettings {
  enabled: boolean
  delay_seconds: number
  headline_en: string
  headline_hi: string
  qna_mode: boolean
}

function useLeadSettings() {
  return useQuery({
    queryKey: ['lead-settings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'lead_magnet')
        .single()
      if (error) {
        return {
          enabled: true,
          delay_seconds: 15,
          headline_en: 'Know Your Future — Free Astrology Report',
          headline_hi: 'अपना भविष्य जानें — मुफ़्त ज्योतिष रिपोर्ट',
          qna_mode: true,
        } as LeadSettings
      }
      return (data?.value as LeadSettings) || {
        enabled: true,
        delay_seconds: 15,
        headline_en: 'Know Your Future — Free Astrology Report',
        headline_hi: 'अपना भविष्य जानें — मुफ़्त ज्योतिष रिपोर्ट',
        qna_mode: true,
      }
    },
  })
}

export default function LeadMagnetPopup() {
  const router = useRouter()
  const { data: settings } = useLeadSettings()
  const { data: areas } = useLeadAreas()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [lang] = useState<'en' | 'hi'>('en')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{
    answer: string
    insights: { label: string; value: string }[]
  } | null>(null)

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

  // Trigger popup after delay
  useEffect(() => {
    if (!settings?.enabled) return
    const delay = (settings.delay_seconds || 15) * 1000
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('lead-magnet-dismissed')
      if (!dismissed) setOpen(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [settings])

  // Scroll trigger
  useEffect(() => {
    if (!settings?.enabled || settings.delay_seconds !== 0) return
    const handler = () => {
      if (window.scrollY > window.innerHeight * 0.5) {
        const dismissed = sessionStorage.getItem('lead-magnet-dismissed')
        if (!dismissed) setOpen(true)
      }
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [settings])

  const handleCityInput = useCallback((val: string) => {
    setForm((f) => ({ ...f, birth_location: val }))
    setCitySuggestions(searchCities(val))
  }, [])

  const handleDismiss = () => {
    setOpen(false)
    sessionStorage.setItem('lead-magnet-dismissed', '1')
  }

  const handleStep1 = async () => {
    if (!form.name || !form.mobile || !form.dob || !form.birth_location) {
      toast.error('Please fill all required fields')
      return
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      toast.error('Valid 10-digit Indian mobile required')
      return
    }

    const lead = await createLead.mutateAsync({
      name: form.name,
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
  }

  const handleStep2 = async () => {
    if (!selectedArea) {
      toast.error('Please select an area of life')
      return
    }
    if (question.length < 20) {
      toast.error('Please be specific. Minimum 20 characters.')
      return
    }

    await updateLead.mutateAsync({
      leadId: leadId!,
      updates: {
        area_of_life_id: selectedArea,
        customer_question: question,
        status: 'contacted',
      },
    })

    setGenerating(true)
    setStep(3)

    // Call real AI API
    try {
      const areaName =
        areas?.find((a) => a.id === selectedArea)?.name || 'Career & Job'

      const res = await fetch('/api/ai/generate-kundali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId!,
          name: form.name,
          dob: form.dob,
          birthTime: form.birth_time || '12:00',
          birthLocation: form.birth_location,
          areaOfLife: areaName,
          question,
          language: 'english',
        }),
      })

      if (!res.ok) throw new Error('AI failed')
      const data = await res.json()
      setResult({ answer: data.answer, insights: data.insights })
      setGenerating(false)
    } catch {
      // Fallback to mock if AI fails
      const fallbackMsg =
        lang === 'hi'
          ? `प्रिय ${form.name}, आपका प्रश्न बहुत महत्वपूर्ण है। हमारी AI सेवा में थोड़ी दिक्कत है। हर्षदा जी व्यक्तिगत रूप से आपकी कुंडली देखकर 24 घंटे के भीतर जवाब देंगी। कृपया WhatsApp पर संपर्क करें: +91 84688 83571`
          : `Dear ${form.name}, our AI service is experiencing a brief issue. Harshada will personally review your birth chart and respond within 24 hours. Please reach out on WhatsApp: +91 84688 83571`

      setResult({ answer: fallbackMsg, insights: [] })
      setGenerating(false)

      await updateLead.mutateAsync({
        leadId: leadId!,
        updates: {
          ai_answer: fallbackMsg,
          status: 'interested',
        },
      })
    }
  }

  const headline =
    lang === 'hi' ? settings?.headline_hi : settings?.headline_en

  /* ── Shared form content ── */
  const formContent = (
    <div className="space-y-5 md:space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-violet-100 px-3 py-1.5 rounded-full border border-violet-200">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-violet-800">
            {lang === 'hi' ? 'हिंदी' : 'English'}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="text-center space-y-1 md:space-y-2">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-800 to-violet-600 bg-clip-text text-transparent">
          {headline}
        </h2>
        <p className="text-sm text-slate-500 px-2">
          {lang === 'hi'
            ? 'अपनी जन्म विवरण दर्ज करें। अपना प्रश्न पूछें। व्यक्तिगत मार्गदर्शन प्राप्त करें।'
            : 'Enter your birth details. Ask your question. Get personalized guidance.'}
        </p>
      </div>

      {/* Step 1: Birth Details */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">
                {lang === 'hi' ? 'नाम' : 'Name'} *
              </Label>
              <Input
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400/20 transition-all h-11"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">
                {lang === 'hi' ? 'मोबाइल' : 'Mobile'} *
              </Label>
              <Input
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400/20 transition-all h-11"
                value={form.mobile}
                onChange={(e) =>
                  setForm({ ...form, mobile: e.target.value })
                }
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">
                {lang === 'hi' ? 'ईमेल' : 'Email'}
              </Label>
              <Input
                type="email"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400/20 transition-all h-11"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                <Calendar className="h-3.5 w-3.5 text-violet-600" />
                {lang === 'hi' ? 'जन्म तिथि' : 'Date of Birth'} *
              </Label>
              <Input
                type="date"
                className="bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-400 focus:ring-violet-400/20 transition-all h-11"
                value={form.dob}
                onChange={(e) =>
                  setForm({ ...form, dob: e.target.value })
                }
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                <Clock className="h-3.5 w-3.5 text-violet-600" />
                {lang === 'hi' ? 'जन्म समय' : 'Birth Time'}
              </Label>
              <Input
                type="time"
                className="bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-400 focus:ring-violet-400/20 transition-all h-11"
                value={form.birth_time}
                onChange={(e) =>
                  setForm({ ...form, birth_time: e.target.value })
                }
                disabled={form.birth_time_approx}
              />
              <label className="flex items-center gap-2 text-xs text-slate-500 mt-1 cursor-pointer hover:text-violet-600 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 bg-slate-50 text-violet-600 focus:ring-violet-500/30 focus:ring-offset-0"
                  checked={form.birth_time_approx}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      birth_time_approx: e.target.checked,
                      birth_time: '',
                    })
                  }
                />
                {lang === 'hi'
                  ? 'अज्ञात / लगभग'
                  : 'Approximate / Unknown'}
              </label>
            </div>
            <div className="space-y-1.5 relative">
              <Label className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                <MapPin className="h-3.5 w-3.5 text-violet-600" />
                {lang === 'hi' ? 'जन्म स्थान' : 'Birth Location'} *
              </Label>
              <Input
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400/20 transition-all h-11"
                value={form.birth_location}
                onChange={(e) => handleCityInput(e.target.value)}
                placeholder={lang === 'hi' ? 'शहर का नाम' : 'City name'}
              />
              {citySuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                  {citySuggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setForm((f) => ({ ...f, birth_location: city }))
                        setCitySuggestions([])
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            className="w-full bg-amber-400 hover:bg-amber-500 text-violet-950 font-bold shadow-lg shadow-amber-500/25 border-0 mt-2 h-12 text-base transition-all duration-300 hover:scale-[1.02]"
            onClick={handleStep1}
            disabled={createLead.isPending}
          >
            {createLead.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin text-violet-950" />
            ) : (
              <>
                {lang === 'hi' ? 'जारी रखें' : 'Continue'}{' '}
                <ChevronRight className="h-5 w-5 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: Area + Question */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
          <p className="text-sm text-slate-500 text-center font-medium">
            {lang === 'hi'
              ? 'जीवन का क्षेत्र चुनें और अपना प्रश्न लिखें'
              : 'Select area of life and ask your question'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {areas?.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`p-3 rounded-xl border text-center text-sm transition-all duration-300 hover:scale-105 ${
                  selectedArea === area.id
                    ? 'border-violet-400 bg-violet-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl block mb-1 drop-shadow-sm">
                  {AREA_ICONS[area.name] || '✨'}
                </span>
                <p
                  className={`text-xs font-semibold ${
                    selectedArea === area.id
                      ? 'text-violet-700'
                      : 'text-slate-600'
                  }`}
                >
                  {area.name}
                </p>
              </button>
            ))}
          </div>
          <div className="space-y-2 mt-4">
            <Label className="text-slate-700 font-semibold text-sm">
              {lang === 'hi'
                ? 'आपका विशिष्ट प्रश्न'
                : 'Your Specific Question'}
            </Label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? 'मैंने 3 महीने पहले अपनी आईटी नौकरी खो दी। मुझे नई नौकरी कब मिलेगी?'
                  : 'I lost my IT job 3 months ago. When will I get a new job?'
              }
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-4 py-3 text-sm min-h-[100px] md:min-h-[120px] transition-all resize-none"
            />
            <p
              className={`text-xs font-medium ${
                question.length < 20 ? 'text-rose-500' : 'text-emerald-600'
              }`}
            >
              {question.length}/300 {lang === 'hi' ? 'अक्षर' : 'chars'}{' '}
              {question.length > 0 &&
                question.length < 20 &&
                `(min 20)`}
            </p>
          </div>
          <Button
            className="w-full bg-amber-400 hover:bg-amber-500 text-violet-950 font-bold shadow-lg shadow-amber-500/25 border-0 h-12 text-base transition-all duration-300 hover:scale-[1.02]"
            onClick={handleStep2}
            disabled={!selectedArea || question.length < 20}
          >
            <Send className="h-4 w-4 mr-2" />
            {lang === 'hi' ? 'मार्गदर्शन प्राप्त करें' : 'Get Guidance'}
          </Button>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-700">
          {generating ? (
            <div className="text-center py-12 space-y-6">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[6px] border-slate-100 shadow-inner" />
                <div className="absolute inset-0 rounded-full border-[6px] border-amber-400 border-t-transparent animate-[spin_1.5s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full border-[4px] border-violet-400 border-b-transparent animate-[spin_2s_linear_infinite_reverse] opacity-70" />
                <Sparkles className="h-10 w-10 text-amber-500 animate-pulse" />
              </div>
              <p className="text-sm text-violet-700 animate-pulse font-bold tracking-wide">
                {lang === 'hi'
                  ? 'दिव्य ऊर्जाओं का संरेखण हो रहा है...'
                  : 'Aligning cosmic energies and decoding your chart...'}
              </p>
            </div>
          ) : result ? (
            <div className="space-y-5">
              <div className="relative bg-violet-50 border border-violet-100 rounded-2xl p-5 shadow-sm">
                <div className="absolute -top-3 -right-3 bg-amber-400 text-violet-950 p-1.5 rounded-full shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-violet-900 mb-3 text-lg">
                  {lang === 'hi'
                    ? `प्रिय ${form.name}, ${
                        areas?.find((a) => a.id === selectedArea)?.name || ''
                      } के लिए आपका मार्गदर्शन`
                    : `Dear ${form.name}, here is your guidance for ${
                        areas?.find((a) => a.id === selectedArea)?.name || ''
                      }`}
                </h3>
                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {result.answer}
                </div>
              </div>

              {result.insights && result.insights.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {result.insights.map((insight) => (
                    <div
                      key={insight.label}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm"
                    >
                      <p className="text-xs text-violet-600 font-bold uppercase tracking-wider mb-1">
                        {insight.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {insight.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500 text-center px-4 font-medium">
                {lang === 'hi'
                  ? 'यह वैदिक ज्योतिष पर आधारित एक मुफ़्त सारांश है। विस्तृत दशा विश्लेषण के लिए परामर्श बुक करें।'
                  : 'This is a free summary based on Vedic astrology. For detailed Dasha analysis, book a consultation.'}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full bg-amber-400 hover:bg-amber-500 text-violet-950 font-bold shadow-md border-0 h-12 text-base transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => router.push('/booking?service=oracle')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {lang === 'hi'
                    ? 'विस्तृत परामर्श बुक करें'
                    : 'Book Detailed Consultation'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all"
                  onClick={() =>
                    window.open(
                      `https://wa.me/919999999999?text=Hi%20Harshada%2C%20I%20just%20got%20my%20free%20report`,
                      '_blank'
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
                  {lang === 'hi' ? 'WhatsApp पर पूछें' : 'Ask on WhatsApp'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )

  /* ── Desktop decorative sidebar ── */
  const desktopSidebar = (
    <div className="hidden md:flex flex-col justify-between w-[260px] bg-violet-900 text-white p-8 rounded-l-2xl relative overflow-hidden shrink-0">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Star className="h-5 w-5 text-amber-400" />
          </div>
          <span className="font-bold text-lg">HighlyAligned</span>
        </div>
        <h3 className="text-2xl font-serif font-bold leading-snug mb-4">
          Unlock Your
          <br />
          Cosmic Blueprint
        </h3>
        <p className="text-sm text-violet-200 leading-relaxed">
          Get a personalized Vedic astrology insight based on your birth chart.
          Trusted by 5,000+ seekers.
        </p>
      </div>
      <div className="relative z-10 space-y-3">
        {[
          'Personalized birth chart analysis',
          'Guidance on career, love & health',
          'Delivered in under 60 seconds',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2.5 text-sm text-violet-200">
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-3 w-3 text-amber-400" />
            </div>
            {item}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* ═══════ DESKTOP: Dialog with split layout ═══════ */}
      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl !rounded-2xl">
            <DialogHeader className="hidden">
              <DialogTitle className="sr-only">Lead Magnet</DialogTitle>
            </DialogHeader>
            <div className="flex">
              {desktopSidebar}
              <div className="flex-1 p-8 max-h-[85vh] overflow-y-auto">
                {formContent}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ═══════ MOBILE: Bottom Sheet ═══════ */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="h-[92vh] overflow-y-auto bg-white border-t border-slate-200 p-0 !rounded-t-3xl"
          >
            {/* Sticky header with close + grabber */}
            <div className="sticky top-0 z-10 bg-white px-6 pt-3 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" /> Close
                  </button>
                </div>
                {/* Grabber handle */}
                <div className="absolute left-1/2 -translate-x-1/2 top-2">
                  <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                <div className="w-16" />
              </div>
            </div>
            <SheetHeader className="text-left hidden">
              <SheetTitle className="sr-only">Lead Magnet</SheetTitle>
            </SheetHeader>
            <div className="px-6 pb-8 pt-4">
              {formContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
