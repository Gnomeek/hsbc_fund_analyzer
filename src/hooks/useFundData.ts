import { useState, useEffect } from 'react'
import { splitCSVLine, parseCSVRow } from '@/lib/parseCSV'
import type { FundRow } from '@/lib/types'

export type FundDataState =
  | { status: 'loading' }
  | { status: 'streaming'; data: FundRow[]; loaded: number; total: number | null }
  | { status: 'ok'; data: FundRow[] }
  | { status: 'error'; message: string }

const THROTTLE_MS = 120 // 最多每 120ms 触发一次 UI 更新

export function useFundData(): FundDataState {
  const [state, setState] = useState<FundDataState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/funds.csv')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (!response.body) throw new Error('No response body')

        const contentLength = response.headers.get('Content-Length')
        const totalBytes = contentLength ? parseInt(contentLength) : null

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let buffer = ''
        let headers: string[] | null = null
        const rows: FundRow[] = []
        let bytesRead = 0
        let lastFlush = 0

        const flush = (done = false) => {
          if (cancelled) return
          const now = Date.now()
          if (!done && now - lastFlush < THROTTLE_MS) return
          lastFlush = now

          const progress = totalBytes ? bytesRead / totalBytes : null
          const total = progress != null ? Math.round(rows.length / Math.max(progress, 0.01)) : null

          setState(
            done
              ? { status: 'ok', data: [...rows] }
              : { status: 'streaming', data: [...rows], loaded: rows.length, total },
          )
        }

        while (true) {
          const { done, value } = await reader.read()
          if (cancelled) {
            reader.cancel()
            return
          }
          if (done) break

          bytesRead += value.byteLength
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            if (!headers) {
              headers = splitCSVLine(line.replace(/^\uFEFF/, ''))
            } else {
              rows.push(parseCSVRow(line, headers))
            }
          }

          flush()
        }

        // 处理末尾未换行的最后一行
        if (buffer.trim() && headers) {
          rows.push(parseCSVRow(buffer, headers))
        }

        flush(true)
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: String(e) })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
