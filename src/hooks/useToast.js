import { useState, useCallback } from 'react'

let id = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const key = ++id
    setToasts(prev => [...prev, { key, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.key !== key)), 3000)
  }, [])

  const dismiss = useCallback((key) => {
    setToasts(prev => prev.filter(t => t.key !== key))
  }, [])

  return { toasts, toast, dismiss }
}
