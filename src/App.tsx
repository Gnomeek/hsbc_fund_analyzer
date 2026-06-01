import { useState, useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { useFundData } from '@/hooks/useFundData'
import { LoadingPage } from '@/components/LoadingPage'
import { FundTable } from '@/components/FundTable'
import { FilterBar, countActiveFilters } from '@/components/FilterBar'
import { DEFAULT_VISIBLE_COLUMNS, ALL_COLUMNS, TOGGLEABLE_COLUMN_IDS } from '@/lib/columns'
import type { SortingState, ColumnFiltersState, VisibilityState, ColumnSizingState } from '@tanstack/react-table'

const STORAGE_KEY = 'hsbc_fund_column_prefs'

function buildInitialVisibility(): VisibilityState {
  return Object.fromEntries(
    ALL_COLUMNS.filter((col) => col.id !== 'fund_code' && col.id !== 'fund_name_clean').map(
      (col) => [col.id!, DEFAULT_VISIBLE_COLUMNS.has(col.id!)],
    ),
  )
}

function loadPrefs(): { visibility?: VisibilityState; order?: string[]; sizing?: ColumnSizingState } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePrefs(visibility: VisibilityState, order: string[], sizing: ColumnSizingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ visibility, order, sizing }))
  } catch {}
}

function mergeOrder(saved: string[], current: string[]): string[] {
  const currentSet = new Set(current)
  const result = saved.filter((id) => currentSet.has(id))
  const resultSet = new Set(result)
  current.forEach((id) => {
    if (!resultSet.has(id)) result.push(id)
  })
  return result
}

export default function App() {
  const state = useFundData()

  const [search, setSearch] = useState('')
  const [riskLevels, setRiskLevels] = useState<number[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [domiciles, setDomiciles] = useState<string[]>([])
  const [riskMode, setRiskMode] = useState<'include' | 'exclude'>('include')
  const [statusMode, setStatusMode] = useState<'include' | 'exclude'>('include')
  const [domicileMode, setDomicileMode] = useState<'include' | 'exclude'>('include')
  const [sorting, setSorting] = useState<SortingState>([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const prefs = loadPrefs()
    return { ...buildInitialVisibility(), ...prefs.visibility }
  })

  const [toggleableColOrder, setToggleableColOrder] = useState<string[]>(() => {
    const prefs = loadPrefs()
    return prefs.order ? mergeOrder(prefs.order, TOGGLEABLE_COLUMN_IDS) : TOGGLEABLE_COLUMN_IDS
  })

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    const prefs = loadPrefs()
    return prefs.sizing ?? {}
  })

  const columnOrder = ['fund_code', 'fund_name_clean', ...toggleableColOrder]

  function handleVisibilityChange(v: VisibilityState) {
    setColumnVisibility(v)
    savePrefs(v, toggleableColOrder, columnSizing)
  }

  function handleOrderChange(ids: string[]) {
    setToggleableColOrder(ids)
    savePrefs(columnVisibility, ids, columnSizing)
  }

  function handleSizingChange(s: ColumnSizingState) {
    setColumnSizing(s)
    savePrefs(columnVisibility, toggleableColOrder, s)
  }

  function handleRiskLevelsChange(v: number[]) {
    setRiskLevels(v)
    if (v.length === 0) setRiskMode('include')
  }

  function handleStatusesChange(v: string[]) {
    setStatuses(v)
    if (v.length === 0) setStatusMode('include')
  }

  function handleDomicilesChange(v: string[]) {
    setDomiciles(v)
    if (v.length === 0) setDomicileMode('include')
  }

  const isStreaming = state.status === 'streaming'
  const streamLoaded = isStreaming ? state.loaded : null
  const streamTotal = isStreaming ? state.total : null

  const activeFilterCount = countActiveFilters(search, riskLevels, statuses, domiciles)

  const filteredData = useMemo(() => {
    if (state.status !== 'ok' && state.status !== 'streaming') return []
    return state.data.filter((row) => {
      if (riskLevels.length) {
        const matches = riskLevels.includes(row.risk_level)
        if (riskMode === 'include' ? !matches : matches) return false
      }
      if (statuses.length) {
        const matches = statuses.some((s) => row.fund_status.includes(s))
        if (statusMode === 'include' ? !matches : matches) return false
      }
      if (domiciles.length) {
        const matches = domiciles.includes(row.fund_domicile)
        if (domicileMode === 'include' ? !matches : matches) return false
      }
      return true
    })
  }, [state, riskLevels, riskMode, statuses, statusMode, domiciles, domicileMode])

  if (state.status === 'loading') return <LoadingPage />
  if (state.status === 'streaming' && state.data.length === 0)
    return <LoadingPage loaded={0} total={state.total} />
  if (state.status === 'error') {
    return <div className="p-4 text-red-500">数据加载失败：{state.message}</div>
  }

  const filterBarProps = {
    search,
    onSearchChange: setSearch,
    riskLevels,
    onRiskLevelsChange: handleRiskLevelsChange,
    riskMode,
    onRiskModeChange: setRiskMode,
    statuses,
    onStatusesChange: handleStatusesChange,
    statusMode,
    onStatusModeChange: setStatusMode,
    domiciles,
    onDomicilesChange: handleDomicilesChange,
    domicileMode,
    onDomicileModeChange: setDomicileMode,
    columnVisibility,
    onColumnVisibilityChange: handleVisibilityChange,
    columnOrder: toggleableColOrder,
    onColumnOrderChange: handleOrderChange,
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">HSBC</span>
          <h1 className="text-base font-semibold text-gray-800">基金快车</h1>
        </div>

        {/* Desktop: inline FilterBar */}
        <div className="hidden md:flex flex-1 min-w-0">
          <FilterBar {...filterBarProps} />
        </div>

        {/* Mobile: 筛选切换按钮 */}
        <button
          onClick={() => setMobileFilterOpen((v) => !v)}
          className="md:hidden ml-auto relative p-2 rounded-md text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="筛选"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* GitHub */}
        <a
          href="https://github.com/Gnomeek/hsbc_fund_analyzer"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors md:ml-auto"
          aria-label="GitHub 仓库"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.185 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.481C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
          </svg>
        </a>
      </header>

      {/* Mobile: 可折叠筛选面板 */}
      <div
        className={`md:hidden bg-white border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${
          mobileFilterOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3">
          <FilterBar {...filterBarProps} />
        </div>
      </div>

      {/* Streaming 进度条 */}
      {isStreaming && (
        <div className="h-0.5 bg-gray-100 overflow-hidden shrink-0">
          {streamLoaded != null && streamTotal ? (
            <div
              className="h-full bg-red-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min((streamLoaded / streamTotal) * 100, 99)}%` }}
            />
          ) : (
            <div className="h-full w-full relative">
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-[shimmer_1.4s_ease-in-out_infinite]" />
            </div>
          )}
        </div>
      )}

      <main className="flex-1 overflow-hidden px-2 py-2 md:px-4 md:py-3">
        <FundTable
          data={filteredData}
          globalFilter={search}
          columnFilters={[] as ColumnFiltersState}
          columnOrder={columnOrder}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleVisibilityChange}
          sorting={sorting}
          onSortingChange={setSorting}
          columnSizing={columnSizing}
          onColumnSizingChange={handleSizingChange}
        />
      </main>
    </div>
  )
}
