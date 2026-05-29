import { useState } from 'react'
import { useFundData } from './hooks/useFundData'
import { FundTable } from './components/FundTable'
import { DEFAULT_VISIBLE_COLUMNS } from './lib/columns'
import type { SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table'

export default function App() {
  const state = useFundData()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(
      ['fund_status','fund_domicile','risk_level','nav','perf_1d_pct','perf_1m_pct',
       'perf_3m_pct','perf_6m_pct','perf_1y_pct','perf_ytd_pct',
       'annual_return_2021_pct','annual_return_2022_pct','annual_return_2023_pct',
       'annual_return_2024_pct','annual_return_2025_pct',
      ].map(id => [id, DEFAULT_VISIBLE_COLUMNS.has(id)])
    )
  )

  if (state.status === 'loading') return <div className="flex items-center justify-center h-screen text-gray-500">加载中…</div>
  if (state.status === 'error') return <div className="p-4 text-red-500">{state.message}</div>

  return (
    <div className="flex flex-col h-screen p-4 gap-3">
      <h1 className="text-xl font-semibold text-gray-800">汇丰基金快车</h1>
      <FundTable
        data={state.data}
        globalFilter=""
        columnFilters={columnFilters}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  )
}
