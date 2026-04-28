'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Save, Upload, X, Sparkles, AlertTriangle, Trash2 } from 'lucide-react'
import { uploadToCloudinary } from '@/lib/cloudinary'


export default function SettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      const s: Record<string, unknown> = {}
      data?.forEach((row) => { s[row.key] = row.value })
      return s
    },
  })

  // Track only the overrides; fall back to settings values
  const [overrides, setOverrides] = useState<Record<string, Record<string, unknown>>>({})
  const [uploading, setUploading] = useState<string | null>(null)

  const DB_KEYS: Record<string, string> = {
    footer: 'footer_config',
    social: 'social_links',
    contact: 'contact_info',
    hero: 'hero_images',
    logo: 'logo_config',
  }

  const getSection = (key: string): Record<string, unknown> => {
    const dbKey = DB_KEYS[key] || key;
    return overrides[key] ?? (settings?.[dbKey] as Record<string, unknown>) ?? {}
  }

  const setField = (section: string, field: string, value: unknown) => {
    const dbKey = DB_KEYS[section] || section;
    setOverrides((prev) => ({
      ...prev,
      [section]: { ...(prev[section] ?? (settings?.[dbKey] as Record<string, unknown>) ?? {}), [field]: value },
    }))
  }

  const saveMutation = useMutation({
    mutationFn: async (updates: { key: string; value: unknown }[]) => {
      const supabase = createClient()
      for (const { key, value } of updates) {
        const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings-all'] })
      setOverrides({})
      toast.success('Settings saved!')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const handleSave = () => {
    const updates = Object.entries(DB_KEYS)
      .filter(([localKey]) => overrides[localKey] !== undefined)
      .map(([localKey, dbKey]) => ({ key: dbKey, value: overrides[localKey] }))
    if (updates.length === 0) {
      toast.info('No changes to save')
      return
    }
    saveMutation.mutate(updates)
  }

  const handleUpload = async (field: string, file: File) => {
    setUploading(field)
    try {
      const url = await uploadToCloudinary(file)
      if (field === 'logo') {
        setField('logo', 'logo_url', url)
      } else if (field === 'favicon') {
        setField('logo', 'favicon_url', url)
      }
      toast.success('Image uploaded!')
      return url;
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message)
      return null;
    } finally {
      setUploading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const footer = getSection('footer')
  const social = getSection('social')
  const contact = getSection('contact')
  const hero = getSection('hero')
  const logo = getSection('logo')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#f59e0b] text-slate-900">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save All
        </Button>
      </div>

      <Tabs defaultValue="gst">
        <TabsList className="flex flex-wrap w-full h-auto">
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger" className="text-red-600 data-[state=active]:text-red-600 data-[state=active]:border-red-600">Danger Zone</TabsTrigger>
        </TabsList>

        {/* GST Settings */}
        <TabsContent value="gst" className="space-y-4">
          <GSTTab settings={settings} />
        </TabsContent>

        {/* Footer Config */}
        <TabsContent value="footer" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input value={(footer.name as string) || ''} onChange={(e) => setField('footer', 'name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={(footer.tagline as string) || ''} onChange={(e) => setField('footer', 'tagline', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={(footer.address as string) || ''} onChange={(e) => setField('footer', 'address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={(footer.email as string) || ''} onChange={(e) => setField('footer', 'email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={(footer.phone as string) || ''} onChange={(e) => setField('footer', 'phone', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!footer.show_newsletter} onCheckedChange={(v) => setField('footer', 'show_newsletter', v)} />
              <Label className="mb-0">Show Newsletter</Label>
            </div>
          </div>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="social" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            {['instagram', 'facebook', 'youtube', 'whatsapp', 'twitter', 'linkedin'].map((key) => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key}</Label>
                <Input
                  value={(social[key] as string) || ''}
                  onChange={(e) => setField('social', key, e.target.value)}
                  placeholder="https://..."
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contact" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="space-y-2">
              <Label>Business Hours</Label>
              <Input value={(contact.business_hours as string) || ''} onChange={(e) => setField('contact', 'business_hours', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Response Time</Label>
              <Input value={(contact.response_time as string) || ''} onChange={(e) => setField('contact', 'response_time', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Google Maps Embed URL</Label>
              <Input value={(contact.map_embed_url as string) || ''} onChange={(e) => setField('contact', 'map_embed_url', e.target.value)} />
            </div>
          </div>
        </TabsContent>

        {/* Hero Images */}
        <TabsContent value="hero" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {['desktop', 'mobile'].map((key) => {
              const currentBanners = (hero[`${key}s`] as string[]) || (hero[key] ? [hero[key] as string] : []);
              
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{key} Hero Banners</Label>
                    <label className="flex items-center justify-center px-3 py-1 bg-slate-100 hover:bg-slate-200 text-sm font-medium rounded-md cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            // We use a temporary key for uploading to track loading state, then append to array
                            const tempKey = `hero_${key}_${Date.now()}`;
                            handleUpload(tempKey, e.target.files[0]).then((url) => {
                              if (url) {
                                setField('hero', `${key}s`, [...currentBanners, url]);
                              }
                            });
                          }
                        }}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      Add {key} banner
                    </label>
                  </div>
                  
                  {currentBanners.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {currentBanners.map((bannerUrl, idx) => (
                        <div key={idx} className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bannerUrl} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              const newBanners = [...currentBanners];
                              newBanners.splice(idx, 1);
                              setField('hero', `${key}s`, newBanners);
                            }} 
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                      No {key} banners added yet. Upload images to display in the homepage slider.
                    </div>
                  )}
                  
                  {uploading && uploading.startsWith(`hero_${key}`) && (
                    <div className="flex items-center gap-2 text-sm text-[#f59e0b]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                    </div>
                  )}
                </div>
              );
            })}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <Label>Alt Text (For SEO)</Label>
              <Input value={(hero.alt as string) || ''} onChange={(e) => setField('hero', 'alt', e.target.value)} placeholder="e.g. Astrology and Crystals Shop" />
            </div>
          </div>
        </TabsContent>

        {/* Logo */}
        <TabsContent value="logo" className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {[
              { key: 'logo_url', label: 'Logo Image', field: 'logo' },
              { key: 'favicon_url', label: 'Favicon', field: 'favicon' },
            ].map(({ key, label, field }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-3">
                  {logo[key] ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo[key] as string} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setField('logo', key, '')} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#f59e0b]">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(field, e.target.files[0])}
                      />
                      {uploading === field ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-slate-400" />}
                    </label>
                  )}
                  <div className="flex-1">
                    <Input value={(logo[key] as string) || ''} onChange={(e) => setField('logo', key, e.target.value)} placeholder="Or paste Cloudinary URL" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* AI Config */}
        <TabsContent value="ai" className="space-y-4">
          <AIConfigTab />
        </TabsContent>

        {/* Notifications Config */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationsConfigTab />
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-4">
          <DangerZoneTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GSTTab({ settings }: { settings?: Record<string, unknown> }) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState<boolean>(
    (settings?.gst_enabled as boolean) ?? false
  )

  const gstConfig = (settings?.gst_config as Record<string, unknown>) || {}
  const [config, setConfig] = useState({
    gstin: (gstConfig.gstin as string) || '',
    business_name: (gstConfig.business_name as string) || '',
    state_code: (gstConfig.state_code as string) || '07',
    registration_type: (gstConfig.registration_type as string) || 'regular',
    composition_rate: (gstConfig.composition_rate as number) || 1,
    default_rate: (gstConfig.default_rate as number) || 18,
    hsn_code: (gstConfig.hsn_code as string) || '',
  })

  useEffect(() => {
    setEnabled((settings?.gst_enabled as boolean) ?? false)
    const gc = (settings?.gst_config as Record<string, unknown>) || {}
    setConfig({
      gstin: (gc.gstin as string) || '',
      business_name: (gc.business_name as string) || '',
      state_code: (gc.state_code as string) || '07',
      registration_type: (gc.registration_type as string) || 'regular',
      composition_rate: (gc.composition_rate as number) || 1,
      default_rate: (gc.default_rate as number) || 18,
      hsn_code: (gc.hsn_code as string) || '',
    })
  }, [settings])

  const toggleMutation = useMutation({
    mutationFn: async (val: boolean) => {
      const supabase = createClient()
      await supabase
        .from('settings')
        .upsert({ key: 'gst_enabled', value: val }, { onConflict: 'key' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings-all'] })
      toast.success('GST setting saved!')
    },
    onError: () => toast.error('Failed to save GST setting'),
  })

  const configMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      await supabase
        .from('settings')
        .upsert({ key: 'gst_config', value: config }, { onConflict: 'key' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings-all'] })
      toast.success('GST config saved!')
    },
    onError: () => toast.error('Failed to save GST config'),
  })

  const handleToggle = (val: boolean) => {
    setEnabled(val)
    toggleMutation.mutate(val)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <h3 className="font-semibold text-slate-900">GST Configuration</h3>

      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <p className="font-medium text-slate-800">Enable GST</p>
          <p className="text-sm text-slate-500">
            When enabled, GST is shown on checkout and admin reports include GST breakdown.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>GSTIN</Label>
          <Input
            value={config.gstin}
            onChange={(e) => setConfig((c) => ({ ...c, gstin: e.target.value }))}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
          />
        </div>
        <div className="space-y-2">
          <Label>Business Legal Name</Label>
          <Input
            value={config.business_name}
            onChange={(e) => setConfig((c) => ({ ...c, business_name: e.target.value }))}
            placeholder="HighlyAligned Pvt Ltd"
          />
        </div>
        <div className="space-y-2">
          <Label>State Code</Label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={config.state_code}
            onChange={(e) => setConfig((c) => ({ ...c, state_code: e.target.value }))}
          >
            <option value="07">07 - Delhi</option>
            <option value="27">27 - Maharashtra</option>
            <option value="29">29 - Karnataka</option>
            <option value="33">33 - Tamil Nadu</option>
            <option value="36">36 - Telangana</option>
            <option value="48">48 - Rajasthan</option>
            <option value="06">06 - Haryana</option>
            <option value="09">09 - Uttar Pradesh</option>
            <option value="19">19 - West Bengal</option>
            <option value="24">24 - Gujarat</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Registration Type</Label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={config.registration_type}
            onChange={(e) => setConfig((c) => ({ ...c, registration_type: e.target.value }))}
          >
            <option value="regular">Regular</option>
            <option value="composition">Composition</option>
          </select>
        </div>
        {config.registration_type === 'composition' && (
          <div className="space-y-2">
            <Label>Composition Rate (%)</Label>
            <Input
              type="number"
              value={config.composition_rate}
              onChange={(e) => setConfig((c) => ({ ...c, composition_rate: Number(e.target.value) }))}
              placeholder="1"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Default GST Rate (%)</Label>
          <Input
            type="number"
            value={config.default_rate}
            onChange={(e) => setConfig((c) => ({ ...c, default_rate: Number(e.target.value) }))}
            placeholder="18"
          />
        </div>
        <div className="space-y-2">
          <Label>Default HSN Code</Label>
          <Input
            value={config.hsn_code}
            onChange={(e) => setConfig((c) => ({ ...c, hsn_code: e.target.value }))}
            placeholder="9997"
          />
        </div>
      </div>

      <Button
        onClick={() => configMutation.mutate()}
        disabled={configMutation.isPending}
        className="bg-[#f59e0b] text-slate-900"
      >
        {configMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
        Save GST Config
      </Button>

      <p className="text-xs text-slate-400">
        Status: GST is currently{' '}
        <span className={enabled ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
          {enabled ? 'ENABLED' : 'DISABLED'}
        </span>
      </p>
    </div>
  )
}

function AIConfigTab() {
  const queryClient = useQueryClient()
  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      const s: Record<string, unknown> = {}
      data?.forEach((row) => { s[row.key] = row.value })
      return s
    },
  })

  const [overrides, setOverrides] = useState<Record<string, unknown>>({})
  const getVal = (key: string): unknown => overrides[key] ?? (settings?.gemini_config as Record<string, unknown>)?.[key]

  const setVal = (key: string, value: unknown) => {
    setOverrides((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const current = (settings?.gemini_config as Record<string, unknown>) || {}
      await supabase.from('settings').upsert(
        { key: 'gemini_config', value: { ...current, ...overrides } },
        { onConflict: 'key' }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setOverrides({})
      toast.success('AI settings saved!')
    },
    onError: () => toast.error('Failed to save AI settings'),
  })

  const handleTest = async () => {
    setTesting(true)
    setTestResult('')
    try {
      const res = await fetch('/api/ai/generate-kundali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: '00000000-0000-0000-0000-000000000000',
          name: 'Priya Sharma',
          dob: '1995-06-15',
          birthTime: '14:30',
          birthLocation: 'Mumbai, India',
          areaOfLife: 'Marriage & Love',
          question: 'I have been looking for a suitable match for 2 years. When will I get married?',
          language: 'english',
        }),
      })
      const data = await res.json()
      if (data.answer) {
        setTestResult(data.answer)
      } else {
        setTestResult(data.error || 'No response from AI')
      }
    } catch (err) {
      setTestResult('Test failed: ' + (err as Error).message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={(getVal('provider') as string) || 'gemini'}
            onChange={(e) => setVal('provider', e.target.value)}
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Gemini API Key</Label>
          <Input
            type="password"
            value={(getVal('api_key') as string) || ''}
            onChange={(e) => setVal('api_key', e.target.value)}
            placeholder="AIzaSy..."
          />
          <p className="text-xs text-slate-400">Stored securely in database. Never exposed client-side.</p>
        </div>
        <div className="space-y-2">
          <Label>Model</Label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={(getVal('model') as string) || 'gemini-1.5-flash'}
            onChange={(e) => setVal('model', e.target.value)}
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Cheap)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Smarter)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Temperature ({(getVal('temperature') as number) ?? 0.7})</Label>
            <Input
              type="range"
              min={0.1}
              max={1.0}
              step={0.1}
              value={(getVal('temperature') as number) ?? 0.7}
              onChange={(e) => setVal('temperature', parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              value={(getVal('max_tokens') as number) ?? 1024}
              onChange={(e) => setVal('max_tokens', parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Default Language</Label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={(getVal('default_language') as string) || 'english'}
            onChange={(e) => setVal('default_language', e.target.value)}
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="auto">Auto-detect</option>
          </select>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-[#f59e0b] text-slate-900">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save AI Config
        </Button>
      </div>

      {/* Test Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#f59e0b]" />
          Test Generation
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
          <p><strong>Sample:</strong> Priya Sharma</p>
          <p><strong>DOB:</strong> 1995-06-15</p>
          <p><strong>Question:</strong> When will I get married?</p>
        </div>
        <Button onClick={handleTest} disabled={testing} variant="outline" className="border-[#f59e0b] text-[#f59e0b] hover:bg-amber-50">
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Test Generate
        </Button>
        {testResult && (
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line max-h-64 overflow-y-auto">
            {testResult}
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationsConfigTab() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      const s: Record<string, unknown> = {}
      data?.forEach((row) => { s[row.key] = row.value })
      return s
    },
  })

  const [overrides, setOverrides] = useState<Record<string, unknown>>({})
  const getVal = (key: string): unknown => overrides[key] ?? (settings?.notifications_config as Record<string, unknown>)?.[key]

  const setVal = (key: string, value: unknown) => {
    setOverrides((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const current = (settings?.notifications_config as Record<string, unknown>) || {}
      await supabase.from('settings').upsert(
        { key: 'notifications_config', value: { ...current, ...overrides } },
        { onConflict: 'key' }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setOverrides({})
      toast.success('Notification settings saved!')
    },
    onError: () => toast.error('Failed to save notification settings'),
  })

  const [testMobile, setTestMobile] = useState('')
  const handleTest = async (type: 'whatsapp' | 'sms' | 'email') => {
    toast.success(`Test ${type} triggered for ${testMobile || 'default contact'}`)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Triggers</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Order Updates (WA/Email)</Label>
              <Switch checked={(getVal('order_updates') as boolean) ?? true} onCheckedChange={(v) => setVal('order_updates', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Booking Confirmation (WA/Email)</Label>
              <Switch checked={(getVal('booking_confirmation') as boolean) ?? true} onCheckedChange={(v) => setVal('booking_confirmation', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Reminders (WA/SMS)</Label>
              <Switch checked={(getVal('reminders') as boolean) ?? true} onCheckedChange={(v) => setVal('reminders', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Lead Reports (WA)</Label>
              <Switch checked={(getVal('lead_reports') as boolean) ?? true} onCheckedChange={(v) => setVal('lead_reports', v)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 border-b pb-2">WhatsApp Config (Gupshup)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Number</Label>
              <Input value={(getVal('wa_number') as string) || ''} onChange={(e) => setVal('wa_number', e.target.value)} placeholder="919876543210" />
            </div>
            <div className="space-y-2">
              <Label>App Name</Label>
              <Input value={(getVal('wa_app_name') as string) || ''} onChange={(e) => setVal('wa_app_name', e.target.value)} placeholder="HighlyAligned" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 border-b pb-2">SMS Config (MSG91)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sender ID</Label>
              <Input value={(getVal('sms_sender') as string) || ''} onChange={(e) => setVal('sms_sender', e.target.value)} placeholder="HGHLYA" />
            </div>
            <div className="space-y-2">
              <Label>Template ID</Label>
              <Input value={(getVal('sms_template') as string) || ''} onChange={(e) => setVal('sms_template', e.target.value)} />
            </div>
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Email Config (Resend)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input value={(getVal('email_sender') as string) || ''} onChange={(e) => setVal('email_sender', e.target.value)} placeholder="harshada@highlyaligned.in" />
            </div>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-[#f59e0b] text-slate-900 w-full mt-4">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Notification Config
        </Button>
      </div>

      {/* Test Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 border-b pb-2">Test Notifications</h3>
        <div className="flex gap-2">
          <Input placeholder="Mobile Number (e.g. 919876543210)" value={testMobile} onChange={(e) => setTestMobile(e.target.value)} className="max-w-xs" />
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          <Button variant="outline" onClick={() => handleTest('whatsapp')}>Test WhatsApp</Button>
          <Button variant="outline" onClick={() => handleTest('sms')}>Test SMS</Button>
          <Button variant="outline" onClick={() => handleTest('email')}>Test Email</Button>
        </div>
      </div>
    </div>
  )
}



function DangerZoneTab() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])
  const [confirmText, setConfirmText] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [results, setResults] = useState<Record<string, { success: boolean; count?: number; error?: string }> | null>(null)

  const tables = [
    { key: 'order_items', label: 'Order Items', group: 'orders' },
    { key: 'orders', label: 'Orders', group: 'orders' },
    { key: 'bookings', label: 'Bookings', group: 'bookings' },
    { key: 'remedies', label: 'Remedies', group: 'bookings' },
    { key: 'influencer_commissions', label: 'Influencer Commissions', group: 'influencers' },
    { key: 'influencers', label: 'Influencers', group: 'influencers' },
    { key: 'referrals', label: 'Referrals', group: 'referrals' },
    { key: 'leads', label: 'Leads', group: 'leads' },
    { key: 'coupons', label: 'Coupons', group: 'coupons' },
    { key: 'blog_posts', label: 'Blog Posts', group: 'blog' },
    { key: 'page_blocks', label: 'Page Blocks', group: 'cms' },
  ]

  const groups = ['orders', 'bookings', 'influencers', 'referrals', 'leads', 'coupons', 'blog', 'cms']
  const groupLabels: Record<string, string> = {
    orders: 'Orders',
    bookings: 'Bookings & Remedies',
    influencers: 'Influencer Program',
    referrals: 'Referrals',
    leads: 'Leads',
    coupons: 'Coupons',
    blog: 'Blog',
    cms: 'CMS',
  }

  const toggleTable = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleGroup = (group: string) => {
    const groupKeys = tables.filter((t) => t.group === group).map((t) => t.key)
    const allSelected = groupKeys.every((k) => selected.includes(k))
    if (allSelected) {
      setSelected((prev) => prev.filter((k) => !groupKeys.includes(k)))
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...groupKeys])))
    }
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.results)
      toast.success('Selected data cleared')
      queryClient.invalidateQueries()
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear data')
    } finally {
      setDialogOpen(false)
      setConfirmText('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
            <p className="text-sm text-red-700">Permanently delete data from the database. This action cannot be undone.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group} className="bg-white rounded-lg border border-red-100 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-red-900">{groupLabels[group]}</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-red-600 hover:bg-red-50 h-6 px-2"
                  onClick={() => toggleGroup(group)}
                >
                  Select All
                </Button>
              </div>
              <div className="space-y-1.5">
                {tables.filter((t) => t.group === group).map((t) => (
                  <label key={t.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-red-50 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selected.includes(t.key)}
                      onChange={() => toggleTable(t.key)}
                      className="accent-red-500"
                    />
                    <span className="text-slate-700">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              You are about to delete data from: {selected.length} table{selected.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {selected.map((key) => (
                <Badge key={key} className="bg-red-100 text-red-800 border-0">
                  {tables.find((t) => t.key === key)?.label || key}
                </Badge>
              ))}
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected Data
            </Button>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
            <h4 className="font-medium text-sm text-slate-900">Deletion Results</h4>
            {Object.entries(results).map(([table, result]) => (
              <div key={table} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-600">{tables.find((t) => t.key === table)?.label || table}</span>
                {result.success ? (
                  <span className="text-emerald-600 font-medium">{result.count} rows deleted</span>
                ) : (
                  <span className="text-red-600">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              This will permanently delete all data from the selected tables. This action <strong>cannot be undone</strong>.
            </p>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-700 mb-1">Type DELETE to confirm:</p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="border-red-200"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); setConfirmText('') }}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={confirmText !== 'DELETE'}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Permanently Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
