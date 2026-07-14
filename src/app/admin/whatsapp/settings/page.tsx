'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Ban, MessageSquare, Webhook, Copy, Check, RefreshCw, Trash2, X } from 'lucide-react'

export default function WhatsAppSettingsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'webhook' | 'templates' | 'optouts'>('webhook')
  const [optOuts, setOptOuts] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const fetchOptOuts = async () => {
    const { data } = await supabase
      .from('whatsapp_opt_outs')
      .select('*, contact:whatsapp_contacts(name)')
      .order('opted_out_at', { ascending: false })
    if (data) setOptOuts(data)
  }

  const fetchTemplates = async () => {
    const { data } = await supabase.from('whatsapp_templates').select('*').order('created_at')
    if (data) setTemplates(data)
  }

  useEffect(() => {
    if (tab === 'optouts') fetchOptOuts()
    if (tab === 'templates') fetchTemplates()
  }, [tab])

  const removeOptOut = async (id: string, phone: string) => {
    if (!confirm(`Re-enable messaging for ${phone}?`)) return
    await supabase.from('whatsapp_opt_outs').delete().eq('id', id)
    await supabase.from('whatsapp_contacts').update({ opted_out: false, opted_out_at: null }).eq('phone', phone)
    fetchOptOuts()
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : 'https://selfaligned.in/api/whatsapp/webhook'

  const tabs = [
    { key: 'webhook', label: 'Webhook Setup', icon: Webhook },
    { key: 'templates', label: 'Message Templates', icon: MessageSquare },
    { key: 'optouts', label: 'Opt-out List', icon: Ban },
  ] as const

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your WhatsApp CRM system</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* WEBHOOK SETUP */}
      {tab === 'webhook' && (
        <div className="space-y-5">
          <div className="bg-background border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Meta Developer Portal Setup</h2>

            {[
              {
                label: 'Callback URL (paste in Meta Portal)',
                value: webhookUrl,
                key: 'url',
              },
              {
                label: 'Verify Token (paste in Meta Portal)',
                value: 'selfaligned_webhook_2024',
                key: 'token',
              },
            ].map(({ label, value, key }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted px-3 py-2.5 rounded-lg font-mono text-foreground border border-border break-all">
                    {value}
                  </code>
                  <button onClick={() => copy(value, key)}
                    className="p-2.5 rounded-lg border border-border hover:bg-muted transition-colors shrink-0">
                    {copied === key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              <p className="font-semibold mb-1">⚠️ Incoming messages not working?</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <strong>developers.facebook.com</strong> → Your App → WhatsApp → Configuration</li>
                <li>Paste the Callback URL above</li>
                <li>Paste the Verify Token above</li>
                <li>Click <strong>Verify and Save</strong></li>
                <li>Under Webhook Fields, enable ✅ <strong>messages</strong></li>
                <li>Switch app from <strong>Development → Live mode</strong></li>
              </ol>
            </div>
          </div>

          {/* Env vars status */}
          <div className="bg-background border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Environment Variables</h2>
            <div className="space-y-2">
              {[
                { name: 'WHATSAPP_PHONE_NUMBER_ID', val: '1266527879870921', ok: true },
                { name: 'WHATSAPP_ACCESS_TOKEN', val: 'EAAMqp4j...ZD (set)', ok: true },
                { name: 'WHATSAPP_BUSINESS_ACCOUNT_ID', val: '2081361856111954', ok: true },
                { name: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', val: 'selfaligned_webhook_2024', ok: true },
                { name: 'CRON_SECRET', val: 'Set in .env.local', ok: true },
              ].map(v => (
                <div key={v.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${v.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <code className="text-xs font-mono text-muted-foreground flex-1">{v.name}</code>
                  <span className="text-xs text-foreground">{v.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cron setup */}
          <div className="bg-background border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-3">Auto Follow-up Cron Job</h2>
            <p className="text-sm text-muted-foreground mb-3">Add this to your <code className="text-xs bg-muted px-1 py-0.5 rounded">vercel.json</code> for hourly follow-up processing:</p>
            <div className="relative">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto text-foreground font-mono">
{`{
  "crons": [
    {
      "path": "/api/whatsapp/followup",
      "schedule": "0 * * * *"
    }
  ]
}`}
              </pre>
              <button onClick={() => copy(`{\n  "crons": [\n    {\n      "path": "/api/whatsapp/followup",\n      "schedule": "0 * * * *"\n    }\n  ]\n}`, 'cron')}
                className="absolute top-3 right-3 p-1.5 rounded bg-background border border-border hover:bg-muted">
                {copied === 'cron' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-mono text-sm font-medium text-foreground">{t.name}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    t.category === 'MARKETING' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>{t.category}</span>
                  {t.is_approved && <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Approved</span>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg whitespace-pre-wrap">{t.body}</p>
              {t.variables?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">Variables: {t.variables.join(', ')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* OPT-OUTS */}
      {tab === 'optouts' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold">🚫 STOP / Opt-out Compliance</p>
            <p className="mt-1 text-xs">These numbers sent STOP or UNSUBSCRIBE. No messages will be sent to them (TRAI/GDPR compliant). You can manually re-enable if a customer asks to opt back in.</p>
          </div>

          {optOuts.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Ban className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No opt-outs yet</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Trigger Word</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {optOuts.map(o => (
                    <tr key={o.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-sm">{o.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.contact?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{o.trigger_word || 'STOP'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(o.opted_out_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeOptOut(o.id, o.phone)}
                          className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium">
                          Re-enable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
