'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CourierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    courier_name: string
    tracking_id: string
    shipping_label_url: string
  }) => void
}

const couriers = ['Delhivery', 'BlueDart', 'DTDC', 'India Post', 'Other']

const courierWebsites: Record<string, string> = {
  Delhivery: 'https://www.delhivery.com/tracking',
  BlueDart: 'https://www.bluedart.com/tracking',
  DTDC: 'https://www.dtdc.in/tracking.asp',
  'India Post': 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
  Other: '',
}

export function CourierModal({ open, onOpenChange, onSubmit }: CourierModalProps) {
  const [courier, setCourier] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [website, setWebsite] = useState('')

  const handleCourierChange = (value: string) => {
    setCourier(value)
    setWebsite(courierWebsites[value] || '')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courier || !trackingId) return
    onSubmit({
      courier_name: courier,
      tracking_id: trackingId,
      shipping_label_url: website || '',
    })
    setCourier('')
    setTrackingId('')
    setWebsite('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ship Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Courier Name</Label>
            <Select value={courier} onValueChange={handleCourierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select courier" />
              </SelectTrigger>
              <SelectContent>
                {couriers.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tracking ID</Label>
            <Input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>

          <div className="space-y-2">
            <Label>Tracking Website URL</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://courier.com/track"
            />
            <p className="text-xs text-slate-500">
              Customer will click this link to track their package.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!courier || !trackingId}
          >
            Mark as Shipped
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
