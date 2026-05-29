import { useState, useMemo } from 'react'
import { useFundData } from './hooks/useFundData'
import { FundTable } from './components/FundTable'
import { FilterBar } from './components/FilterBar'
import { DEFAULT_VISIBLE_COLUMNS, ALL_COLUMNS } from './lib/columns'
import type { SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table'

function buildInitialVisibility(): VisibilityState {
  return Object.fromEntries(
    ALL_COLUMNS
      .filter(col => col.id !== 'fund_code' && col.id !== 'fund_name_clean')
      .map(col => [col.id!, DEFAULT_VISIBLE_COLUMNS.has(col.id!)])
  )
}

export default function App() {
  const state = useFundData()

  const [search, setSearch] = useState('')
  const [riskLevels, setRiskLevels] = useState<number[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [domiciles, setDomiciles] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(buildInitialVisibility)

  const filteredData = useMemo(() => {
    if (state.status !== 'ok') return []
    return state.data.filter(row => {
      if (riskLevels.length && !riskLevels.includes(row.risk_level)) return false
      if (statuses.length && !statuses.some(s => row.fund_status.includes(s))) return false
      if (domiciles.length && !domiciles.includes(row.fund_domicile)) return false
      return true
    })
  }, [state, riskLevels, statuses, domiciles])

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        加载中…
      </div>
    )
  }
  if (state.status === 'error') {
    return <div className="p-4 text-red-500">数据加载失败：{state.message}</div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">HSBC</span>
          <h1 className="text-base font-semibold text-gray-800">基金快车</h1>
        </div>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          riskLevels={riskLevels}
          onRiskLevelsChange={setRiskLevels}
          statuses={statuses}
          onStatusesChange={setStatuses}
          domiciles={domiciles}
          onDomicilesChange={setDomiciles}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </header>
      <main className="flex-1 overflow-hidden px-4 py-3">
        <FundTable
          data={filteredData}
          globalFilter={search}
          columnFilters={[] as ColumnFiltersState}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </main>
    </div>
  )
}
