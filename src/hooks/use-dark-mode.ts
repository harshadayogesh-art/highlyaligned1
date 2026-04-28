'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'ha-dark-mode'

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const isDark = stored === 'true'
      setDarkMode(isDark)
      document.documentElement.classList.toggle('dark', isDark)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return { darkMode, toggleDarkMode, mounted }
}
