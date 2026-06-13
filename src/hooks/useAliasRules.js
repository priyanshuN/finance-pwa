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
  const [allRules, setAllRules] = useState(() => storageGet(KEY, []))

  const rules = allRules.filter(r => r.source !== 'llm')
  const llmRules = allRules.filter(r => r.source === 'llm')

  function setAndCache(next) {
    setAllRules(next)
    storageSet(KEY, next)
  }

  // Background sync from Sheets on mount
  useEffect(() => {
    fetchRules()
      .then(remote => setAndCache(remote))
      .catch(() => {})
  }, [])

  async function refreshRules() {
    try {
      const remote = await fetchRules()
      setAndCache(remote)
    } catch {
      // silently fall back to cached state
    }
  }

  async function addRule(vendor, category) {
    const next = [...allRules, { id: Date.now(), vendor: vendor.trim(), category, source: 'user' }]
    setAndCache(next)
    try {
      await persistRules(next)
    } catch {
      toast?.('Rule saved locally — sync to sheet failed', 'error')
    }
  }

  async function removeRule(id) {
    const next = allRules.filter(r => r.id !== id)
    setAndCache(next)
    try {
      await persistRules(next)
    } catch {
      toast?.('Rule removed locally — sync to sheet failed', 'error')
    }
  }

  async function removeLlmRule(id) {
    const next = allRules.filter(r => r.id !== id)
    setAndCache(next)
    try {
      await persistRules(next)
    } catch {
      toast?.('Rule dismissed locally — sync to sheet failed', 'error')
    }
  }

  // Promote an LLM suggestion to a permanent user rule (atomic)
  async function acceptLlmRule(rule) {
    const next = allRules
      .filter(r => r.id !== rule.id)
      .concat({ id: Date.now(), vendor: rule.vendor, category: rule.category, source: 'user' })
    setAndCache(next)
    try {
      await persistRules(next)
    } catch {
      toast?.('Rule saved locally — sync to sheet failed', 'error')
    }
  }

  async function runRecategorize(transactions) {
    try {
      const res = await fetch('/api/recategorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      // Re-read from sheet so local IDs match the sheet-assigned order
      await refreshRules()
      return json.llmRules?.length || 0
    } catch {
      return 0
    }
  }

  return { rules, llmRules, addRule, removeRule, removeLlmRule, acceptLlmRule, runRecategorize }
}
