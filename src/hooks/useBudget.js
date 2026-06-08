import { useState, useCallback } from 'react'
import { storageGet, storageSet } from '../lib/storage'

export function useBudget() {
  const [budgets, setBudgets] = useState(() => storageGet('budgets', {}))

  const setBudget = useCallback((category, amount) => {
    setBudgets(prev => {
      const next = { ...prev, [category]: amount }
      storageSet('budgets', next)
      return next
    })
  }, [])

  const removeBudget = useCallback((category) => {
    setBudgets(prev => {
      const next = { ...prev }
      delete next[category]
      storageSet('budgets', next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setBudgets({})
    storageSet('budgets', {})
  }, [])

  return { budgets, setBudget, removeBudget, clearAll }
}
