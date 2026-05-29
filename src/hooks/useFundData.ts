import { useState, useEffect } from 'react'
import { parseCSV } from '@/lib/parseCSV'
import type { FundRow } from '@/lib/types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: FundRow[] }

export function useFundData(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    fetch('/funds.csv')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => setState({ status: 'ok', data: parseCSV(text) }))
      .catch((e) => setState({ status: 'error', message: String(e) }))
  }, [])

  return state
}
