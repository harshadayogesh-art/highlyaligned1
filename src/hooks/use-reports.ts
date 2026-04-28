'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface SalesReportRecord {
  id: string
  order_number: string
  created_at: string
  customer_name: string
  customer_phone: string | null
  payment_mode: string
  payment_status: string
  status: string
  subtotal: number
  gst_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  discount_amount: number
  shipping_amount: number
  final_total: number
  place_of_supply: string | null
  cod_collected: boolean
}

export interface GstReportRecord {
  id: string
  order_number: string
  created_at: string
  customer_name: string
  place_of_supply: string | null
  subtotal: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  gst_amount: number
  final_total: number
}

export function useSalesReport(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['sales-report', dateFrom, dateTo],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('orders')
        .select('id, order_number, created_at, status, payment_mode, payment_status, subtotal, gst_amount, cgst_amount, sgst_amount, igst_amount, discount_amount, shipping_amount, final_total, place_of_supply, cod_collected, profiles(name, phone)')
        .order('created_at', { ascending: false })

      if (dateFrom) query = query.gte('created_at', dateFrom + 'T00:00:00')
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        created_at: o.created_at,
        customer_name: o.profiles?.name || '-',
        customer_phone: o.profiles?.phone || null,
        payment_mode: o.payment_mode,
        payment_status: o.payment_status,
        status: o.status,
        subtotal: o.subtotal || 0,
        gst_amount: o.gst_amount || 0,
        cgst_amount: o.cgst_amount || 0,
        sgst_amount: o.sgst_amount || 0,
        igst_amount: o.igst_amount || 0,
        discount_amount: o.discount_amount || 0,
        shipping_amount: o.shipping_amount || 0,
        final_total: o.final_total || 0,
        place_of_supply: o.place_of_supply,
        cod_collected: o.cod_collected || false,
      })) as SalesReportRecord[]
    },
  })
}

export function useGstReport(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['gst-report', dateFrom, dateTo],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('orders')
        .select('id, order_number, created_at, subtotal, gst_amount, cgst_amount, sgst_amount, igst_amount, final_total, place_of_supply, profiles(name)')
        .gt('gst_amount', 0)
        .order('created_at', { ascending: false })

      if (dateFrom) query = query.gte('created_at', dateFrom + 'T00:00:00')
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        created_at: o.created_at,
        customer_name: o.profiles?.name || '-',
        place_of_supply: o.place_of_supply,
        subtotal: o.subtotal || 0,
        cgst_amount: o.cgst_amount || 0,
        sgst_amount: o.sgst_amount || 0,
        igst_amount: o.igst_amount || 0,
        gst_amount: o.gst_amount || 0,
        final_total: o.final_total || 0,
      })) as GstReportRecord[]
    },
  })
}
