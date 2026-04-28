'use client'

import { Suspense, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/account'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginValues) => {
    const supabase = createClient()
    setLoading(true)
    if (mode === 'login') {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Logged in successfully')
        // Role-based redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signInData.user.id)
          .single()
        if (profile && ['admin', 'editor', 'support'].includes(profile.role)) {
          router.push('/admin/dashboard')
        } else {
          router.push(redirectTo)
        }
      }
    } else {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: values.email.split('@')[0] },
        },
      })
      if (error) {
        toast.error(error.message)
      } else {
        if (signUpData?.user) {
          const baseName = values.email.split('@')[0].replace(/[^a-zA-Z]/g, '') || 'USER'
          const genCode = 'HA' + baseName.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 100).toString().padStart(2, '0')
          // Upsert profile so the row exists for FK references and account page
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            name: values.email.split('@')[0],
            email: values.email,
            referral_code: genCode,
            role: 'customer',
          })
        }
        toast.success('Account created. Please check your email.')
        // Auto-login after signup if session is available (email confirm may be required depending on Supabase settings)
        if (signUpData.session) {
          router.push(redirectTo)
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <span className="text-[#f59e0b]">Highly</span>Aligned
          </CardTitle>
          <p className="text-center text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#f59e0b] hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-[#f59e0b] hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b] mx-auto" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
