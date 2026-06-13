import { storageGet, storageSet } from '../lib/storage'
import { useState, useEffect } from 'react'

const KEY = 'alias_rules'

async function fetchRules() {
  const res = await fetch('/api/rules')
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.rules
}

async function persistRules(rules) {
  const res = await fetch('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
}

export function useAliasRules(toast) {
  const [rules, setRules] = useState(() => storageGet(KEY, []))

  // Background sync from Sheets on mount
  useEffect(() => {
    fetchRules()
      .then(remote => {
        setRules(remote)
        storageSet(KEY, remote)
      })
      .catch(() => {}) // silently fall back to localStorage
  }, [])

  async function addRule(vendor, category) {
    const next = [...rules, { id: Date.now(), vendor: vendor.trim(), category }]
    setRules(next)
    storageSet(KEY, next)
    try {
      await persistRules(next)
    } catch {
      toast?.('Rule saved locally — sync to sheet failed', 'error')
    }
  }

  async function removeRule(id) {
    const next = rules.filter(r => r.id !== id)
    setRules(next)
    storageSet(KEY, next)
    try {
      await persistRules(next)
    } catch {
      toast?.('Rule removed locally — sync to sheet failed', 'error')
    }
  }

  return { rules, addRule, removeRule }
}
