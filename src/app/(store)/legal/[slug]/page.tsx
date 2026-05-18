import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Home, Scale } from 'lucide-react'

const FALLBACK_PAGES: Record<string, { title: string; meta_description: string; content: string; last_updated: string }> = {
  terms: {
    title: 'Terms and Conditions',
    meta_description: 'Terms and Conditions for Selfaligned.in — Astrology e-commerce and services platform.',
    last_updated: '2026-01-01',
    content: `**Effective Date:** January 1, 2026
**Business Name:** Selfaligned
**Registered Address:** Pimpri-Chinchwad, Maharashtra, India
**Contact:** self.aligned1111@gmail.com | +91 84688 83571

---

## 1. Definitions
- **"Platform"** refers to Selfaligned.in and all associated services.
- **"User"** means any person accessing or using the Platform.
- **"Services"** refers to astrology consultations, energy healing sessions, and spiritual guidance.
- **"Products"** refers to crystals, malas, energized items, and other physical goods sold on the Platform.

## 2. Eligibility
You must be at least 18 years of age to use this Platform. If you are under 18, you may use the Platform only with the involvement and consent of a parent or legal guardian.

## 3. Nature of Astrology Services
All astrology consultations, readings, and spiritual guidance provided through Selfaligned are for **entertainment, spiritual insight, and self-reflection purposes only**. They do **not** constitute professional medical, legal, financial, or psychological advice. Accuracy of readings depends entirely on the birth data and other information provided by you.

## 4. E-Commerce Terms
- Product descriptions, images, and prices are accurate to the best of our knowledge.
- All prices are in Indian Rupees (INR) and inclusive of applicable GST.
- Orders are subject to acceptance and availability.
- We reserve the right to refuse or cancel any order for reasons including stock unavailability, pricing errors, or suspected fraudulent activity.

## 5. Service Terms (Consultations)
- Bookings must be made at least 24 hours in advance.
- If you are more than 10 minutes late, the session may be forfeited without refund.
- Recording of sessions is permitted for personal use only; redistribution is prohibited.
- Users must conduct themselves respectfully during consultations.

## 6. Payments
- All online payments are processed securely via **Razorpay**.
- We do **not** store your credit/debit card details. Razorpay is PCI-DSS compliant.
- Cash on Delivery (COD) is available for select orders up to Rs. 5,000.

## 7. Intellectual Property
All content, logos, designs, text, images, and software on this Platform are the exclusive property of Selfaligned and protected under Indian copyright and trademark laws. Unauthorized use, reproduction, or distribution is strictly prohibited.

## 8. Limitation of Liability
To the maximum extent permitted by law, Selfaligned's total liability for any claim arising from your use of the Platform shall not exceed the amount you paid for the specific product or service in question. We are **not liable** for any life decisions, business outcomes, or health choices made based on astrological guidance.

## 9. Governing Law & Jurisdiction
These Terms are governed by the laws of the **Republic of India**. Any dispute shall first be attempted to be resolved through good-faith negotiation. Failing that, disputes shall be settled through binding arbitration in **Pune, Maharashtra**, in accordance with the Arbitration and Conciliation Act, 1996.

## 10. Grievance Officer
In accordance with the Information Technology Act, 2000:
- **Name:** Harshada (Proprietor)
- **Email:** self.aligned1111@gmail.com
- **Address:** Pimpri-Chinchwad, Maharashtra, India
- **Response Time:** 48-72 business hours`,
  },
  privacy: {
    title: 'Privacy Policy',
    meta_description: 'Privacy Policy for Selfaligned.in. Compliant with DPDP Act 2023.',
    last_updated: '2026-01-01',
    content: `**Effective Date:** January 1, 2026
**Business Name:** Selfaligned

---

## 1. Introduction
Selfaligned ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services. We comply with the **Digital Personal Data Protection Act (DPDP Act), 2023** of India.

## 2. Information We Collect
- **Identity Data:** Name, email address, phone number.
- **Birth Data:** Date of birth, time of birth, place of birth (used for generating astrology reports).
- **Address Data:** Billing and shipping addresses for product orders.
- **Payment Data:** Handled entirely by **Razorpay**. We do not store card numbers, CVV, or OTPs.
- **Technical Data:** IP address, browser type, device information, cookies.
- **Communications:** WhatsApp messages, emails, and consultation notes.

## 3. Purpose of Processing
We process your data for the following lawful purposes:
- To generate personalized astrology reports and birth chart analyses.
- To process and fulfill product orders and service bookings.
- To schedule consultations and send appointment reminders.
- To maintain GST and financial records as required by Indian law.
- To prevent fraud and ensure platform security.

## 4. Data Localization
All user data is stored on servers located within **India** (via Supabase). We comply with RBI guidelines regarding data localization for payment-related information.

## 5. Sharing of Information
We do **not** sell your personal data. We share information only with:
- **Razorpay** — for payment processing.
- **Logistics Partners** — for delivery of physical products.
- **Legal Authorities** — when required by court order or applicable law.

## 6. User Rights (DPDP Act 2023)
You have the right to:
- **Access** your personal data.
- **Correct** inaccurate or incomplete data.
- **Delete** your data (subject to legal retention requirements).
- **Withdraw consent** for data processing at any time.

To exercise these rights, email us at self.aligned1111@gmail.com.

## 7. Data Retention
- **Birth data and consultation records:** 12 months from last interaction.
- **Financial and GST records:** 8 years as mandated by Indian tax law.
- **Order and shipping records:** 3 years.

## 8. Security Measures
- All data transmission uses **HTTPS/TLS encryption**.
- Payment data is protected by Razorpay's **PCI-DSS Level 1** compliance.
- We do not store credit card details on our servers.
- Access to user data is restricted to authorized personnel only.

## 9. Cookies
We use only **essential cookies** necessary for website functionality (login sessions, cart persistence). We do **not** use tracking cookies or third-party advertising cookies.

## 10. Grievance Officer
For any privacy-related concerns or complaints:
- **Name:** Harshada (Proprietor)
- **Email:** self.aligned1111@gmail.com
- **Address:** Pimpri-Chinchwad, Maharashtra, India
- **Response Time:** 48-72 business hours`,
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    meta_description: 'Shipping and Delivery Policy for Selfaligned.in.',
    last_updated: '2026-01-01',
    content: `**Business Name:** Selfaligned
**Contact:** self.aligned1111@gmail.com | +91 84688 83571

---

## 1. Delivery Areas
We currently deliver **only within India**. We partner with the following courier services:
- Delhivery
- BlueDart
- DTDC
- India Post

## 2. Processing Time
- **Standard products:** 1-2 business days.
- **Energized or blessed items:** 3-5 business days (additional time for rituals and preparation).
- Orders placed on weekends or public holidays are processed on the next business day.

## 3. Delivery Timelines
- **Metro cities** (Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad): 3-5 business days.
- **Tier 2 & 3 cities:** 5-7 business days.
- **Remote / rural areas:** 7-10 business days.

## 4. Shipping Charges
- **Free shipping** on all orders above Rs. 999.
- **Flat Rs. 79** shipping fee for orders below Rs. 999.
- **COD fee:** Rs. 50 additional for Cash on Delivery orders.

## 5. Order Tracking
A tracking number is shared via **email and WhatsApp** within 24 hours of shipment. You can track your order on the courier partner's website.

## 6. Cash on Delivery (COD) Policy
- COD is available for orders up to Rs. 5,000.
- A COD fee of Rs. 50 applies.
- COD may be disabled for accounts with excessive return history.

## 7. Damaged or Lost Shipments
- If you receive a damaged product, you **must** share an unboxing video within **24 hours** of delivery.
- We will investigate with the courier partner and offer a replacement or refund.
- For lost shipments confirmed by the courier, a full refund or re-shipment will be provided.

## 8. Non-Physical (Digital) Items
Digital astrology reports and readings are delivered via:
- Email to the registered email address.
- Access through your user dashboard on Selfaligned.in.
- No physical shipping applies.

## 9. Failed Delivery Attempts
- The courier will attempt delivery **3 times**.
- After 3 failed attempts, the package will be returned to us.
- You may choose a **partial refund** (minus shipping) or pay a **re-shipping fee** of Rs. 79.

## 10. Contact
For shipping-related queries:
- Email: self.aligned1111@gmail.com
- WhatsApp: +91 84688 83571`,
  },
  refund: {
    title: 'Cancellation & Refund Policy',
    meta_description: 'Cancellation and Refund Policy for Selfaligned.in.',
    last_updated: '2026-01-01',
    content: `**Business Name:** Selfaligned
**Contact:** self.aligned1111@gmail.com | +91 84688 83571

---

## 1. Digital Products (Reports, Readings)
- **No refund** once the digital report or reading has been delivered.
- If you experience a technical failure (e.g., broken download link), we will re-process and re-deliver at no extra cost.

## 2. Physical Products (Return Policy)
You may return physical products within **7 days** of delivery **only** if:
- The product is damaged or defective.
- The wrong product was delivered.

**Non-returnable items:**
- Gemstones and crystals that have been worn or used.
- Energized or blessed items (once opened).
- Perishable goods.
- Items with broken safety seals.

## 3. Consultation Services (Cancellation Table)

| Cancellation Time | Refund Amount |
|-------------------|---------------|
| More than 24 hours before session | **100% refund** |
| 12-24 hours before session | **50% refund** |
| Less than 12 hours before session | **No refund** |
| No-show (without notice) | **No refund** |
| Cancellation by us | **100% refund** |

## 4. Refund Method & Timeline
- Refunds are credited to the **original payment method**.
- **UPI payments:** 2-3 business days.
- **Credit/Debit cards:** 5-10 business days (depends on bank processing).
- **Net Banking:** 5-7 business days.
- **COD orders:** Refund via UPI or bank transfer within 7 business days.

## 5. Disputes & Chargebacks
- Any refund dispute must be raised within **15 days** of the transaction.
- Fraudulent chargeback claims will be denied and may result in account suspension.

## 6. Order Cancellation by Us
We reserve the right to cancel orders due to:
- Stock unavailability.
- Pricing errors.
- Suspected fraud.
- Incomplete or invalid address.
In such cases, a **full refund** will be issued automatically.

## 7. Contact
For refund and cancellation queries:
- Email: self.aligned1111@gmail.com
- WhatsApp: +91 84688 83571
- Response time: 48-72 business hours`,
  },
}

export async function generateStaticParams() {
  return [
    { slug: 'terms' },
    { slug: 'privacy' },
    { slug: 'shipping' },
    { slug: 'refund' },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const fallback = FALLBACK_PAGES[slug]

  let title = fallback?.title || 'Legal'
  let description = fallback?.meta_description || `${title} for Selfaligned.in`

  try {
    const supabase = await createClient()
    const { data: page } = await supabase
      .from('legal_pages')
      .select('title,meta_description')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    if (page) {
      title = page.title
      description = page.meta_description || description
    }
  } catch {
    // Fallback already set above
  }

  return {
    title: `${title} — Selfaligned.in`,
    description,
  }
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let inList = false
  let key = 0

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`list-${key++}`} className="list-disc pl-5 space-y-1 my-3">{listItems}</ul>)
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '' || trimmed === '---') {
      flushList()
      if (trimmed === '---') {
        elements.push(<hr key={`hr-${key++}`} className="my-6 border-slate-700/50" />)
      } else {
        elements.push(<div key={`sp-${key++}`} className="h-2" />)
      }
      continue
    }

    // Heading ##
    if (trimmed.startsWith('## ')) {
      flushList()
      const headingText = trimmed.replace(/^##\s*/, '')
      elements.push(
        <h2 key={`h2-${key++}`} className="text-lg md:text-xl font-bold text-white mt-8 mb-3">
          {parseInline(headingText)}
        </h2>
      )
      continue
    }

    // Heading ###
    if (trimmed.startsWith('### ')) {
      flushList()
      const headingText = trimmed.replace(/^###\s*/, '')
      elements.push(
        <h3 key={`h3-${key++}`} className="text-base md:text-lg font-semibold text-slate-200 mt-6 mb-2">
          {parseInline(headingText)}
        </h3>
      )
      continue
    }

    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.replace(/^[-*]\s*/, '')
      listItems.push(<li key={`li-${key++}`} className="text-slate-300">{parseInline(itemText)}</li>)
      inList = true
      continue
    }

    // Table row (pipe-separated)
    if (trimmed.includes('|') && trimmed.startsWith('|')) {
      flushList()
      const cells = trimmed.split('|').filter(Boolean).map(c => c.trim())
      // Skip separator rows (contain only dashes)
      if (cells.every(c => /^[-:]+$/.test(c))) continue
      elements.push(
        <div key={`row-${key++}`} className="grid gap-2 py-2 border-b border-white/5" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((cell, ci) => (
            <div key={ci} className={`text-sm ${ci === 0 ? 'text-slate-200 font-medium' : 'text-slate-300'}`}>
              {parseInline(cell)}
            </div>
          ))}
        </div>
      )
      continue
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p key={`p-${key++}`} className="text-slate-300 leading-relaxed mb-3">
        {parseInline(trimmed)}
      </p>
    )
  }

  flushList()
  return elements
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  // Bold **text**
  const boldRegex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t-${key++}`}>{remaining.slice(lastIndex, match.index)}</span>)
    }
    parts.push(<strong key={`b-${key++}`} className="text-white font-semibold">{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t-${key++}`}>{remaining.slice(lastIndex)}</span>)
  }

  return parts.length === 0 ? text : parts
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const fallback = FALLBACK_PAGES[slug]

  let page: { title: string; content: string; last_updated: string } | null = null

  try {
    const supabase = await createClient()
    const { data: dbPage } = await supabase
      .from('legal_pages')
      .select('title,content,last_updated')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    if (dbPage) {
      page = dbPage as { title: string; content: string; last_updated: string }
    }
  } catch {
    // Table doesn't exist yet — use fallback
  }

  // Use fallback if DB returned nothing
  if (!page) {
    if (fallback) {
      page = { ...fallback } // Clone to avoid mutating constant
    } else {
      return notFound()
    }
  }

  try {
    const supabase = await createClient()
    const { data: settings } = await supabase.from('settings').select('*')
    const s: Record<string, unknown> = {}
    settings?.forEach((row) => { s[row.key] = row.value })
    
    const info = s.business_info as Record<string, string> | undefined
    if (info) {
      const name = info.name || 'Selfaligned'
      const email = info.email || 'self.aligned1111@gmail.com'
      const phone = info.phone || '+91 84688 83571'
      const address = info.address || 'Pimpri-Chinchwad, Maharashtra, India'

      page.content = page.content
        .replace(/Selfaligned/g, name)
        .replace(/self\.aligned1111@gmail\.com/g, email)
        .replace(/\+91 84688 83571/g, phone)
        .replace(/Pimpri-Chinchwad, Maharashtra, India/g, address)
    }
  } catch (err) {
    console.error('Failed to parse settings for legal page', err)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-[#f59e0b] transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <span>/</span>
          <Link href="/legal/terms" className="hover:text-[#f59e0b] transition-colors flex items-center gap-1">
            <Scale className="h-3.5 w-3.5" /> Legal
          </Link>
          <span>/</span>
          <span className="text-slate-300">{page.title}</span>
        </nav>

        {/* Header */}
        <div className="border-b border-white/10 pb-6 mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{page.title}</h1>
          <p className="text-sm text-slate-500">
            Last updated: {new Date(page.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-1">
          {renderMarkdown(page.content)}
        </div>

        {/* Back to home */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-400 hover:text-[#f59e0b] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
