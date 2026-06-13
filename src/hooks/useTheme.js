import { useState, useEffect, useCallback } from 'react'

export const THEMES = [
  { id: 'indigo',  label: 'Slate / Indigo',   accent: '#6366f1', bg: '#0b1020' },
  { id: 'classic', label: 'Classic',          accent: '#e4ff3d', bg: '#0e0e10' },
  { id: 'amber',   label: 'Warm Amber',       accent: '#f59e0b', bg: '#181310' },
  { id: 'emerald', label: 'Midnight Emerald', accent: '#34d399', bg: '#06120d' },
  { id: 'black',   label: 'Pure Black',       accent: '#ffffff', bg: '#000000' },
]

const KEY = 'finance_theme'
const DEFAULT = 'indigo'
const VALID = new Set(THEMES.map(t => t.id))

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY)
      return saved && VALID.has(saved) ? saved : DEFAULT
    } catch { return DEFAULT }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(KEY, theme) } catch {}
  }, [theme])

  const setTheme = useCallback((id) => {
    if (VALID.has(id)) setThemeState(id)
  }, [])

  return { theme, setTheme, themes: THEMES }
}
