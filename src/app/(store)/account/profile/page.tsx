'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useUpdateProfile, useChangePassword } from '@/hooks/use-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  User,
  Mail,
  Phone,
  Lock,
  LogOut,
  Pencil,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'

export default function MyProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading, signOut } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/profile')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    await updateProfile.mutateAsync({
      userId: user.id,
      updates: { name, phone },
    })
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      return
    }
    await changePassword.mutateAsync({ currentPassword, newPassword })
    setShowPasswordDialog(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const passwordMismatch = confirmPassword && newPassword !== confirmPassword

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">My Profile</h1>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              Personal Information
            </CardTitle>
            {!isEditing ? (
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-slate-500">
              <User className="h-3.5 w-3.5" /> Full Name
            </Label>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <p className="text-sm font-medium text-slate-900">{profile?.name || '—'}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-slate-500">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <p className="text-sm font-medium text-slate-900">{profile?.email || '—'}</p>
            <p className="text-xs text-slate-400">Email cannot be changed</p>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-slate-500">
              <Phone className="h-3.5 w-3.5" /> Phone
            </Label>
            {isEditing ? (
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            ) : (
              <p className="text-sm font-medium text-slate-900">{profile?.phone || '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordDialog(true)}
          >
            <Lock className="h-4 w-4 mr-1" /> Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LogOut className="h-4 w-4 text-slate-400" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
              />
              {passwordMismatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
                onClick={handlePasswordChange}
                disabled={
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  passwordMismatch ||
                  changePassword.isPending
                }
              >
                {changePassword.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
