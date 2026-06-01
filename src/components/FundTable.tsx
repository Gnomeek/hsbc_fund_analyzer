import { useRef, CSSProperties } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, ExternalLink } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnSizingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { FundRow } from '@/lib/types'
import { ALL_COLUMNS } from '@/lib/columns'
import { PerfCell } from '@/components/PerfCell'
import { StatusBadge } from '@/components/StatusBadge'
import { RiskBadge } from '@/components/RiskBadge'

const DOMICILE_LABEL: Record<string, string> = {
  'Mainland Securities Fund': '内地基金',
  'HK Mutual Recognition Fund': '香港互认基金',
}

const PERF_COLS = new Set([
  'perf_1d_pct',
  'perf_1m_pct',
  'perf_3m_pct',
  'perf_6m_pct',
  'perf_1y_pct',
  'perf_ytd_pct',
  'annual_return_2021_pct',
  'annual_return_2022_pct',
  'annual_return_2023_pct',
  'annual_return_2024_pct',
  'annual_return_2025_pct',
])

type Props = {
  data: FundRow[]
  globalFilter: string
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  sorting: SortingState
  onSortingChange: (s: SortingState) => void
  columnOrder: string[]
  columnSizing: ColumnSizingState
  onColumnSizingChange: (s: ColumnSizingState) => void
}

export function FundTable({
  data,
  globalFilter,
  columnFilters,
  columnVisibility,
  onColumnVisibilityChange,
  sorting,
  onSortingChange,
  columnOrder,
  columnSizing,
  onColumnSizingChange,
}: Props) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data,
    columns: ALL_COLUMNS,
    columnResizeMode: 'onChange',
    state: {
      globalFilter,
      columnFilters,
      columnVisibility,
      sorting,
      columnOrder,
      columnSizing,
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnVisibility) : updater
      onColumnVisibilityChange(next)
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSortingChange(next)
    },
    onColumnSizingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnSizing) : updater
      onColumnSizingChange(next)
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
    if (colId === 'fund_domicile') return DOMICILE_LABEL[value as string] ?? String(value ?? '')
    if (PERF_COLS.has(colId)) return <PerfCell value={value as number | null} />
    if (colId === 'fund_status') return <StatusBadge value={value as string} />
    if (colId === 'risk_level') return <RiskBadge value={value as number} />
    if (colId === 'nav') return value != null ? String(value) : '—'
    if (colId.startsWith('doc_')) {
      const url = value as string
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center text-blue-500 hover:text-blue-700 transition-colors"
          title="打开文件"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-gray-300 flex justify-center">—</span>
      )
    }
    return String(value ?? '')
  }

  return (
    <div className="flex flex-col h-full">
      <div data-tour="result-count" className="text-sm text-gray-500 px-4 py-2">
        共 {rows.length} / {data.length} 只基金
      </div>
      <div
        ref={tableContainerRef}
        className="overflow-auto flex-1 border border-gray-200 rounded-lg"
        style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain' }}
      >
        <table
          className="text-sm border-collapse"
          style={{
            tableLayout: 'fixed',
            width: table.getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0),
            minWidth: '100%',
            ...(Object.fromEntries(
              table.getVisibleLeafColumns().map((col) => [`--col-${col.id}-size`, `${col.getSize()}`])
            ) as CSSProperties),
          }}
        >
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header, idx) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      data-tour={idx === 0 ? 'table-header' : undefined}
                      style={{
                        width: `calc(var(--col-${header.column.id}-size) * 1px)`,
                        minWidth: header.column.columnDef.minSize,
                        position: 'relative',
                      }}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 select-none overflow-hidden whitespace-nowrap"
                    >
                      {canSort ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 w-full min-w-0 hover:text-gray-800 transition-colors"
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="text-gray-400 shrink-0">
                            {sorted === 'asc' ? (
                              <ArrowUp size={12} />
                            ) : sorted === 'desc' ? (
                              <ArrowDown size={12} />
                            ) : (
                              <ArrowUpDown size={12} className="text-gray-300" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span className="truncate block">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                      {/* 列宽拖拽 handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none transition-colors ${
                          header.column.getIsResizing()
                            ? 'bg-blue-500'
                            : 'bg-transparent hover:bg-blue-300'
                        }`}
                      />
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualItems.length > 0 && virtualItems[0].start > 0 && (
              <tr>
                <td
                  style={{ height: virtualItems[0].start }}
                  colSpan={table.getVisibleLeafColumns().length}
                />
              </tr>
            )}
            {virtualItems.map((vItem) => {
              const row = rows[vItem.index]
              return (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  style={{ height: vItem.size }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colId = cell.column.id
                    const value = cell.getValue()
                    return (
                      <td
                        key={cell.id}
                        style={{ width: `calc(var(--col-${cell.column.id}-size) * 1px)` }}
                        className={`px-3 py-2 overflow-hidden ${
                          colId === 'fund_status'
                            ? 'align-middle'
                            : 'text-ellipsis whitespace-nowrap'
                        }`}
                      >
                        {colId === 'fund_code' ? (
                          row.original.xueqiu_link ? (
                            <a
                              href={row.original.xueqiu_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-blue-600 underline underline-offset-2 decoration-blue-300 hover:text-blue-800 hover:decoration-blue-600 transition-colors"
                              title="在雪球查看"
                            >
                              {String(value)}
                              <ExternalLink size={11} className="shrink-0 opacity-60" />
                            </a>
                          ) : (
                            <span className="font-mono text-gray-700">{String(value)}</span>
                          )
                        ) : (
                          renderCell(colId, value)
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {virtualItems.length > 0 && (
              <tr>
                <td
                  style={{
                    height: totalHeight - (virtualItems[virtualItems.length - 1].end ?? 0),
                  }}
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
