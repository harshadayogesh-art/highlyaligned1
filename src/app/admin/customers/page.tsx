'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CustomerDetailDrawer } from '@/components/admin/customer-detail-drawer'
import { Search, User, Calendar } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  referral_code: string | null
  created_at: string
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Customer[]
    },
  })

  const openDetail = (customer: Customer) => {
    setDetailCustomer(customer)
    setDetailOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-900'>Customers</h1>
        <Badge variant='outline' className='text-xs'>
          {customers?.length || 0} total
        </Badge>
      </div>

      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search by name, email, phone...'
          className='pl-9'
        />
      </div>

      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Customer</th>
                <th className='text-left px-4 py-3 font-medium'>Contact</th>
                <th className='text-left px-4 py-3 font-medium'>Referral</th>
                <th className='text-left px-4 py-3 font-medium'>Joined</th>
                <th className='text-right px-4 py-3 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className='px-4 py-8 text-center text-slate-400'>
                    Loading customers...
                  </td>
                </tr>
              ) : customers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className='px-4 py-8 text-center text-slate-400'>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers?.map((c) => (
                  <tr
                    key={c.id}
                    className='hover:bg-slate-50 cursor-pointer transition-colors'
                    onClick={() => openDetail(c)}
                  >
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs'>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='font-medium text-slate-900'>{c.name}</p>
                          <p className='text-xs text-slate-500'>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <p className='text-slate-700'>{c.phone || '—'}</p>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='font-mono text-xs text-slate-600'>
                        {c.referral_code || '—'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-xs text-slate-500 flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-[#f59e0b] hover:text-[#d97706] hover:bg-amber-50'
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetail(c)
                        }}
                      >
                        <User className='h-4 w-4 mr-1' />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerDetailDrawer
        customer={detailCustomer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
