import { useState, useEffect } from 'react'

export function useTransactions() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lastSync, setLastSync] = useState(null)

  async function fetch_data() {
    setLoading(true)
    try {
      const res  = await fetch('/api/transactions')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.transactions)
      setLastSync(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch_data() }, [])

  return { data, loading, error, lastSync, refetch: fetch_data }
}
