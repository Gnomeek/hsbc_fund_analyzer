import { useRef } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { FundRow } from '../lib/types'
import { ALL_COLUMNS } from '../lib/columns'
import { PerfCell } from './PerfCell'
import { StatusBadge } from './StatusBadge'
import { RiskBadge } from './RiskBadge'

const PERF_COLS = new Set([
  'perf_1d_pct','perf_1m_pct','perf_3m_pct','perf_6m_pct',
  'perf_1y_pct','perf_ytd_pct',
  'annual_return_2021_pct','annual_return_2022_pct','annual_return_2023_pct',
  'annual_return_2024_pct','annual_return_2025_pct',
])

type Props = {
  data: FundRow[]
  globalFilter: string
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  sorting: SortingState
  onSortingChange: (s: SortingState) => void
}

export function FundTable({
  data,
  globalFilter,
  columnFilters,
  columnVisibility,
  onColumnVisibilityChange,
  sorting,
  onSortingChange,
}: Props) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data,
    columns: ALL_COLUMNS,
    state: { globalFilter, columnFilters, columnVisibility, sorting },
    onColumnVisibilityChange: updater => {
      const next = typeof updater === 'function' ? updater(columnVisibility) : updater
      onColumnVisibilityChange(next)
    },
    onSortingChange: updater => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSortingChange(next)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _colId, filterValue: string) => {
      const q = filterValue.toLowerCase()
      return (
        row.original.fund_code.toLowerCase().includes(q) ||
        row.original.fund_name_clean.toLowerCase().includes(q)
      )
    },
  })

  const rows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  function renderCell(colId: string, value: unknown) {
    if (PERF_COLS.has(colId)) return <PerfCell value={value as number | null} />
    if (colId === 'fund_status') return <StatusBadge value={value as string} />
    if (colId === 'risk_level') return <RiskBadge value={value as number} />
    if (colId === 'nav') return value != null ? String(value) : '—'
    return String(value ?? '')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-sm text-gray-500 px-4 py-2">
        共 {rows.length} / {data.length} 只基金
      </div>
      <div
        ref={tableContainerRef}
        className="overflow-auto flex-1 border border-gray-200 rounded-lg"
      >
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 select-none"
                    >
                      {canSort ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-gray-400">
                            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualItems.length > 0 && virtualItems[0].start > 0 && (
              <tr><td style={{ height: virtualItems[0].start }} colSpan={table.getVisibleLeafColumns().length} /></tr>
            )}
            {virtualItems.map(vItem => {
              const row = rows[vItem.index]
              return (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  style={{ height: vItem.size }}
                >
                  {row.getVisibleCells().map(cell => {
                    const colId = cell.column.id
                    const value = cell.getValue()
                    return (
                      <td key={cell.id} className="px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        {colId === 'fund_code' ? (
                          row.original.xueqiu_link ? (
                            <a
                              href={row.original.xueqiu_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono"
                            >
                              {String(value)}
                            </a>
                          ) : (
                            <span className="font-mono text-gray-700">{String(value)}</span>
                          )
                        ) : renderCell(colId, value)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {virtualItems.length > 0 && (
              <tr>
                <td
                  style={{ height: totalHeight - (virtualItems[virtualItems.length - 1].end ?? 0) }}
                  colSpan={table.getVisibleLeafColumns().length}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
