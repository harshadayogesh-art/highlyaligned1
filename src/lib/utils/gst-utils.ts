// GST Utilities for Indian GST compliance

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
];

export function getStateName(code: string): string {
  const state = INDIAN_STATES.find(s => s.code === code)
  return state?.name || code
}

export function getStateCode(name: string): string {
  const state = INDIAN_STATES.find(s => s.name.toLowerCase() === name.toLowerCase())
  return state?.code || ''
}

export interface GstBreakdown {
  cgst: number
  sgst: number
  igst: number
}

export function calculateGstSplit(
  totalGst: number,
  sellerStateCode: string,
  buyerStateCode: string
): GstBreakdown {
  if (!sellerStateCode || !buyerStateCode || sellerStateCode === buyerStateCode) {
    return { cgst: Math.round((totalGst / 2) * 100) / 100, sgst: Math.round((totalGst / 2) * 100) / 100, igst: 0 }
  }
  return { cgst: 0, sgst: 0, igst: totalGst }
}

export function validateGstin(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) return false
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return regex.test(gstin.toUpperCase())
}