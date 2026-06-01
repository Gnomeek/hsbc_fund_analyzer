import { useRef, useEffect, useState } from 'react'
import { Field } from '@base-ui/react/field'
import { Popover } from '@base-ui/react/popover'
import type { VisibilityState } from '@tanstack/react-table'
import { Search, ChevronDown, Check, X, FilterX } from 'lucide-react'
import { ColumnToggle } from '@/components/ColumnToggle'

// ----------------------------------------------------------------
// 筛选常量
// ----------------------------------------------------------------
const RISK_OPTIONS = [1, 2, 3, 4, 5]
const STATUS_OPTIONS = [
  { value: 'suspended', label: '暂停申购' },
  { value: 'online_only', label: '仅电子渠道' },
  { value: 'qdii', label: 'QDII' },
]
const DOMICILE_OPTIONS = [
  { value: 'Mainland Securities Fund', label: '内地基金' },
  { value: 'HK Mutual Recognition Fund', label: '香港互认基金' },
]

// ----------------------------------------------------------------
// FilterBar Props
// ----------------------------------------------------------------
type Props = {
  search: string
  onSearchChange: (v: string) => void
  riskLevels: number[]
  onRiskLevelsChange: (v: number[]) => void
  riskMode: 'include' | 'exclude'
  onRiskModeChange: (m: 'include' | 'exclude') => void
  statuses: string[]
  onStatusesChange: (v: string[]) => void
  statusMode: 'include' | 'exclude'
  onStatusModeChange: (m: 'include' | 'exclude') => void
  domiciles: string[]
  onDomicilesChange: (v: string[]) => void
  domicileMode: 'include' | 'exclude'
  onDomicileModeChange: (m: 'include' | 'exclude') => void
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  columnOrder: string[]
  onColumnOrderChange: (ids: string[]) => void
}

// ----------------------------------------------------------------
// MultiSelect — 通用多选下拉（支持包含/排除模式）
// ----------------------------------------------------------------
function MultiSelect<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  mode = 'include',
  onModeChange,
}: {
  label: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (v: T[]) => void
  mode?: 'include' | 'exclude'
  onModeChange?: (m: 'include' | 'exclude') => void
}) {
  function toggle(val: T) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  const displayLabel =
    selected.length === 0
      ? label
      : selected.length === options.length
        ? `${label}：全部`
        : mode === 'exclude'
          ? `排除 ${label} (${selected.length})`
          : `${label} (${selected.length})`

  return (
    <Popover.Root>
      <Popover.Trigger
        className={`flex items-center gap-1.5 px-3 py-2 md:py-1.5 text-sm border rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors min-w-max touch-manipulation ${
          selected.length > 0 && mode === 'exclude'
            ? 'border-orange-300 text-orange-700'
            : 'border-gray-300 text-gray-700'
        }`}
      >
        <span>{displayLabel}</span>
        <ChevronDown size={13} className="text-gray-400 shrink-0" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4} className="z-100">
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-36 max-h-72 overflow-y-auto">
            {options.map((opt) => (
              <div
                key={String(opt.value)}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2 px-3 py-2.5 md:py-1.5 text-sm cursor-pointer hover:bg-gray-50 active:bg-gray-100 select-none touch-manipulation"
              >
                <span
                  className={`w-4 h-4 shrink-0 border rounded flex items-center justify-center ${
                    selected.includes(opt.value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {selected.includes(opt.value) ? <Check size={10} strokeWidth={3} /> : ''}
                </span>
                {opt.label}
              </div>
            ))}
            {selected.length > 0 && onModeChange && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <div
                  onClick={() => onModeChange(mode === 'include' ? 'exclude' : 'include')}
                  className="flex items-center gap-2 px-3 py-2 md:py-1.5 text-xs cursor-pointer hover:bg-gray-50 select-none touch-manipulation"
                >
                  <span
                    className={`w-8 h-4 rounded-full flex items-center transition-colors ${
                      mode === 'exclude' ? 'bg-orange-400' : 'bg-blue-500'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${
                        mode === 'exclude' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <span className={mode === 'exclude' ? 'text-orange-600' : 'text-blue-600'}>
                    {mode === 'exclude' ? '排除模式' : '包含模式'}
                  </span>
                </div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ----------------------------------------------------------------
// FilterBar — 搜索 + 多维度筛选栏
// ----------------------------------------------------------------
export function FilterBar({
  search,
  onSearchChange,
  riskLevels,
  onRiskLevelsChange,
  riskMode,
  onRiskModeChange,
  statuses,
  onStatusesChange,
  statusMode,
  onStatusModeChange,
  domiciles,
  onDomicilesChange,
  domicileMode,
  onDomicileModeChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearchChange(localSearch), 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [localSearch, onSearchChange])

  const hasFilter = !!(search || riskLevels.length || statuses.length || domiciles.length)

  function clearAll() {
    setLocalSearch('')
    onSearchChange('')
    onRiskLevelsChange([])
    onRiskModeChange('include')
    onStatusesChange([])
    onStatusModeChange('include')
    onDomicilesChange([])
    onDomicileModeChange('include')
  }

  return (
    <div className="flex flex-col gap-2 w-full md:flex-row md:flex-wrap md:items-center">
      {/* 搜索框 — 移动端占满宽度 */}
      <Field.Root
        data-tour="search"
        className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all flex-1 md:flex-none"
      >
        <span className="pl-3 shrink-0">
          <Search size={15} className="text-gray-400" />
        </span>
        <Field.Control
          value={localSearch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)}
          placeholder="搜索基金代码或名称…"
          className="px-2 py-2 md:py-1.5 text-sm outline-none bg-transparent w-full md:w-48"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="pr-2.5 text-gray-400 hover:text-gray-600 touch-manipulation"
            aria-label="清除搜索"
          >
            <X size={14} />
          </button>
        )}
      </Field.Root>

      {/* 筛选按钮组 — 横向滚动 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
        <div data-tour="filter-risk">
          <MultiSelect
            label="风险等级"
            options={RISK_OPTIONS.map((r) => ({ value: r, label: `R${r}` }))}
            selected={riskLevels}
            onChange={onRiskLevelsChange}
            mode={riskMode}
            onModeChange={onRiskModeChange}
          />
        </div>
        <div data-tour="filter-status">
          <MultiSelect
            label="状态"
            options={STATUS_OPTIONS}
            selected={statuses}
            onChange={onStatusesChange}
            mode={statusMode}
            onModeChange={onStatusModeChange}
          />
        </div>
        <MultiSelect
          label="类别"
          options={DOMICILE_OPTIONS}
          selected={domiciles}
          onChange={onDomicilesChange}
          mode={domicileMode}
          onModeChange={onDomicileModeChange}
        />
        <div data-tour="column-toggle">
          <ColumnToggle
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
            columnOrder={columnOrder}
            onColumnOrderChange={onColumnOrderChange}
          />
        </div>
        {hasFilter && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2 md:py-1.5 text-sm text-red-500 border border-red-200 rounded-md hover:bg-red-50 active:bg-red-100 transition-colors shrink-0 touch-manipulation"
          >
            <FilterX size={14} />
            <span className="hidden sm:inline">清除筛选</span>
          </button>
        )}
      </div>
    </div>
  )
}

// 导出活跃筛选数量，供父组件显示徽标
export function countActiveFilters(
  search: string,
  riskLevels: number[],
  statuses: string[],
  domiciles: string[],
) {
  return (search ? 1 : 0) + riskLevels.length + statuses.length + domiciles.length
}
