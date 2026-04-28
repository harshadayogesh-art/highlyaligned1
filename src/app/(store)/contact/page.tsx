'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { usePageBlockMap } from '@/components/store/page-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const blocks = usePageBlockMap('contact')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const { data: settings } = useQuery({
    queryKey: ['settings-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.from('settings').select('*')
      const s: Record<string, unknown> = {}
      data?.forEach((row) => { s[row.key] = row.value })
      return s
    },
  })

  const footerConfig = (settings?.footer_config as Record<string, string>) || {}
  const contactInfo = (settings?.contact_info as Record<string, string>) || {}
  const socialLinks = (settings?.social_links as Record<string, string>) || {}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.from('leads').insert({
      name: form.name,
      mobile: form.phone || 'N/A',
      email: form.email,
      source: 'manual',
      status: 'new',
      customer_question: `[${form.subject}] ${form.message}`,
    })
    if (error) {
      toast.error('Failed to send message')
      return
    }
    setSubmitted(true)
    toast.success('Thank you! We will get back to you within 24 hours.')
  }

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{(blocks['hero_title']?.content?.text as string) || 'Get in Touch'}</h1>
        <p className="text-slate-500">
          {(blocks['hero_subtitle']?.content?.text as string) || "We'd love to hear from you. Reach out for consultations, product inquiries, or just to say hello."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Contact Info */}
        <div className="space-y-6">
          <div className="space-y-4">
            {footerConfig.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#f59e0b] mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Address</p>
                  <p className="text-sm text-slate-500">{footerConfig.address}</p>
                </div>
              </div>
            )}
            {footerConfig.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#f59e0b] mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Phone</p>
                  <a href={`tel:${footerConfig.phone}`} className="text-sm text-slate-500 hover:text-[#f59e0b]">
                    {footerConfig.phone}
                  </a>
                </div>
              </div>
            )}
            {footerConfig.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#f59e0b] mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Email</p>
                  <a href={`mailto:${footerConfig.email}`} className="text-sm text-slate-500 hover:text-[#f59e0b]">
                    {footerConfig.email}
                  </a>
                </div>
              </div>
            )}
            {contactInfo.business_hours && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#f59e0b] mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Business Hours</p>
                  <p className="text-sm text-slate-500">{contactInfo.business_hours}</p>
                </div>
              </div>
            )}
          </div>

          <a
            href={`https://wa.me/${(socialLinks.whatsapp || '').replace('+', '')}?text=Hi%20HighlyAligned!%20I%20need%20guidance.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Chat on WhatsApp
          </a>

          <div className="flex gap-3 pt-2">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b]">IG</a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b]">FB</a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b]">YT</a>
            )}
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-emerald-800">Thank You!</h3>
              <p className="text-sm text-emerald-600 mt-1">We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })} required>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Product Inquiry">Product Inquiry</SelectItem>
                    <SelectItem value="Booking Question">Booking Question</SelectItem>
                    <SelectItem value="Feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} required />
              </div>
              <Button type="submit" className="w-full bg-[#f59e0b] text-slate-900">
                <Send className="h-4 w-4 mr-1" />
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Map */}
      {contactInfo.map_embed_url && (
        <div className="mt-10">
          <iframe
            src={contactInfo.map_embed_url}
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '12px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location"
          />
        </div>
      )}
    </div>
  )
}
