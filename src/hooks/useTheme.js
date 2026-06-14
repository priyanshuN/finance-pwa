import { useState, useEffect, useCallback } from 'react'

export const THEMES = [
  { id: 'indigo',  label: 'Slate / Indigo',   accent: '#6366f1', bg: '#0b1020' },
  { id: 'classic', label: 'Classic',          accent: '#e4ff3d', bg: '#0e0e10' },
  { id: 'amber',   label: 'Warm Amber',       accent: '#f59e0b', bg: '#181310' },
  { id: 'emerald', label: 'Midnight Emerald', accent: '#34d399', bg: '#06120d' },
  { id: 'black',   label: 'Pure Black',       accent: '#ffffff', bg: '#000000' },
]

const THEME_KEY = 'finance_theme'
const MODE_KEY  = 'finance_mode'
const DEFAULT_THEME = 'indigo'
const VALID_THEMES = new Set(THEMES.map(t => t.id))
const VALID_MODES  = new Set(['auto', 'dark', 'light'])

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      return saved && VALID_THEMES.has(saved) ? saved : DEFAULT_THEME
    } catch { return DEFAULT_THEME }
  })

  const [mode, setModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY)
      return saved && VALID_MODES.has(saved) ? saved : 'auto'
    } catch { return 'auto' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
    try { localStorage.setItem(MODE_KEY, mode) } catch {}
  }, [mode])

  const setTheme = useCallback((id) => {
    if (VALID_THEMES.has(id)) setThemeState(id)
  }, [])

  const setMode = useCallback((m) => {
    if (VALID_MODES.has(m)) setModeState(m)
  }, [])

  return { theme, setTheme, themes: THEMES, mode, setMode }
}
