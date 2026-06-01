# Table Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add column drag-resize with persistence, filter exclude mode, fix text selection bug, and add Driver.js onboarding tour.

**Architecture:** Four independent changes applied in order of increasing complexity — bug fix first (1 line), then resize (state + UI), then filter modes (logic + UI), then onboarding (new file + trigger). Each change is committed separately. No new abstractions beyond `src/lib/tour.ts` for Driver.js config isolation.

**Tech Stack:** TanStack Table v8 (column resize API), driver.js (onboarding), React useState, localStorage, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `src/components/FundTable.tsx` | Remove `userSelect:none`, add resize mode + handle + sizing props |
| `src/App.tsx` | Add `columnSizing` state + `filterMode` states, pass to children, update `savePrefs`/`loadPrefs`, add tour trigger |
| `src/components/FilterBar.tsx` | Add `mode`/`onModeChange` props to `MultiSelect`, add toggle UI, expose mode props from `FilterBar` |
| `src/lib/columns.ts` | Add `minSize` to each column definition |
| `src/lib/tour.ts` | New file — Driver.js tour config + `startTour()` |
| `package.json` | Add `driver.js` dependency |

---

## Task 1: Fix Text Selection Bug

**Files:**
- Modify: `src/components/FundTable.tsx:137`

- [ ] **Step 1: Remove `userSelect: 'none'` from scroll container**

In `FundTable.tsx`, find the scroll container div (line ~136-138):

```tsx
// BEFORE
<div
  ref={tableContainerRef}
  className="overflow-auto flex-1 border border-gray-200 rounded-lg"
  style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain', userSelect: 'none' }}
>

// AFTER
<div
  ref={tableContainerRef}
  className="overflow-auto flex-1 border border-gray-200 rounded-lg"
  style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain' }}
>
```

The `<th>` elements already have `select-none` class so header text stays non-selectable during sort clicks. Body cells are now selectable by default.

- [ ] **Step 2: Verify manually**

Run `npm run dev`, open the table, try to click-drag to select text in a fund name cell. Should highlight/select normally.

- [ ] **Step 3: Commit**

```bash
git add src/components/FundTable.tsx
git commit -m "fix: remove userSelect:none from table scroll container"
```

---

## Task 2: Column Resize

**Files:**
- Modify: `src/lib/columns.ts` — add `minSize` to each column
- Modify: `src/components/FundTable.tsx` — resize mode, handle, sizing state
- Modify: `src/App.tsx` — `columnSizing` state, persist to localStorage

### Step 2a: Add `minSize` to column definitions

- [ ] **Step 1: Update `src/lib/columns.ts`**

Add `minSize` equal to roughly half the default `size` for each column. Replace the entire `ALL_COLUMNS` array:

```ts
export const ALL_COLUMNS = [
  h.accessor('fund_code', {
    id: 'fund_code',
    header: '代码',
    enableHiding: false,
    size: 80,
    minSize: 60,
  }),
  h.accessor('fund_name_clean', {
    id: 'fund_name_clean',
    header: '基金名称',
    enableHiding: false,
    size: 300,
    minSize: 120,
  }),
  h.accessor('fund_status', {
    id: 'fund_status',
    header: '标签',
    size: 120,
    minSize: 60,
  }),
  h.accessor('fund_domicile', {
    id: 'fund_domicile',
    header: '类别',
    size: 72,
    minSize: 48,
  }),
  h.accessor('risk_level', {
    id: 'risk_level',
    header: '风险',
    size: 72,
    minSize: 48,
  }),
  h.accessor('nav', {
    id: 'nav',
    header: '净值',
    size: 72,
    minSize: 48,
  }),
  h.accessor('nav_date', {
    id: 'nav_date',
    header: '更新日期',
    size: 100,
    minSize: 72,
    enableSorting: false,
  }),
  h.accessor('perf_1d_pct', {
    id: 'perf_1d_pct',
    header: '1日表现',
    size: 75,
    minSize: 56,
  }),
  h.accessor('perf_1m_pct', {
    id: 'perf_1m_pct',
    header: '1月表现',
    size: 75,
    minSize: 56,
  }),
  h.accessor('perf_3m_pct', {
    id: 'perf_3m_pct',
    header: '3月表现',
    size: 75,
    minSize: 56,
  }),
  h.accessor('perf_6m_pct', {
    id: 'perf_6m_pct',
    header: '6月表现',
    size: 75,
    minSize: 56,
  }),
  h.accessor('perf_1y_pct', {
    id: 'perf_1y_pct',
    header: '1年表现',
    size: 80,
    minSize: 56,
  }),
  h.accessor('perf_ytd_pct', {
    id: 'perf_ytd_pct',
    header: 'YTD表现',
    size: 80,
    minSize: 56,
  }),
  h.accessor('annual_return_2021_pct', {
    id: 'annual_return_2021_pct',
    header: '2021回报率',
    size: 75,
    minSize: 56,
  }),
  h.accessor('annual_return_2022_pct', {
    id: 'annual_return_2022_pct',
    header: '2022回报率',
    size: 75,
    minSize: 56,
  }),
  h.accessor('annual_return_2023_pct', {
    id: 'annual_return_2023_pct',
    header: '2023回报率',
    size: 75,
    minSize: 56,
  }),
  h.accessor('annual_return_2024_pct', {
    id: 'annual_return_2024_pct',
    header: '2024回报率',
    size: 75,
    minSize: 56,
  }),
  h.accessor('annual_return_2025_pct', {
    id: 'annual_return_2025_pct',
    header: '2025回报率',
    size: 75,
    minSize: 56,
  }),
  h.accessor('doc_prospectus', {
    id: 'doc_prospectus',
    header: '招募说明书',
    size: 90,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_annual_report', {
    id: 'doc_annual_report',
    header: '年度报告',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_quarterly_report', {
    id: 'doc_quarterly_report',
    header: '季度报告',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_semi_annual_report', {
    id: 'doc_semi_annual_report',
    header: '半年报告',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_monthly_report', {
    id: 'doc_monthly_report',
    header: '月报',
    size: 56,
    minSize: 40,
    enableSorting: false,
  }),
  h.accessor('doc_fund_contract', {
    id: 'doc_fund_contract',
    header: '基金合同',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_product_summary', {
    id: 'doc_product_summary',
    header: '产品概要',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_offering_announcement', {
    id: 'doc_offering_announcement',
    header: '发行公告',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
  h.accessor('doc_all_announcements', {
    id: 'doc_all_announcements',
    header: '所有公告',
    size: 80,
    minSize: 56,
    enableSorting: false,
  }),
]
```

### Step 2b: Wire resize in App.tsx

- [ ] **Step 2: Update imports and state in `src/App.tsx`**

Add `ColumnSizingState` to the TanStack import line:

```ts
import type { SortingState, ColumnFiltersState, VisibilityState, ColumnSizingState } from '@tanstack/react-table'
```

- [ ] **Step 3: Update `loadPrefs` and `savePrefs` in `src/App.tsx`**

```ts
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
```

- [ ] **Step 4: Add `columnSizing` state in `App` component**

After the `toggleableColOrder` state declaration, add:

```ts
const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
  const prefs = loadPrefs()
  return prefs.sizing ?? {}
})
```

- [ ] **Step 5: Update `handleVisibilityChange` and `handleOrderChange` to pass sizing**

```ts
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
```

- [ ] **Step 6: Pass `columnSizing` and `onColumnSizingChange` to `FundTable`**

In the `<FundTable ...>` JSX, add two props:

```tsx
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
```

### Step 2c: Implement resize in FundTable.tsx

- [ ] **Step 7: Update `Props` type in `FundTable.tsx`**

```ts
import type { SortingState, ColumnFiltersState, VisibilityState, ColumnSizingState } from '@tanstack/react-table'

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
```

- [ ] **Step 8: Add resize config to `useReactTable`**

Add these fields inside the `useReactTable({...})` call:

```ts
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
    columnSizing,        // add this
  },
  onColumnSizingChange: (updater) => {
    const next = typeof updater === 'function' ? updater(columnSizing) : updater
    onColumnSizingChange(next)
  },
  // ... existing handlers
})
```

- [ ] **Step 9: Update `FundTable` function signature to accept new props**

```ts
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
```

- [ ] **Step 10: Add resize handle to each `<th>`**

The `<th>` currently has `className="... overflow-hidden whitespace-nowrap"`. Change it to `position: relative` and add the handle inside. Replace the `<th>` block in the header:

```tsx
<th
  key={header.id}
  style={{
    width: header.getSize(),
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
```

- [ ] **Step 11: Verify resize works**

Run `npm run dev`. Hover over a column header edge — should show a blue resize handle. Drag to resize. Refresh the page — widths should be restored from localStorage.

- [ ] **Step 12: Commit**

```bash
git add src/lib/columns.ts src/components/FundTable.tsx src/App.tsx
git commit -m "feat: column drag resize with localStorage persistence"
```

---

## Task 3: Filter Exclude Mode

**Files:**
- Modify: `src/components/FilterBar.tsx` — add mode prop to `MultiSelect`, add toggle UI
- Modify: `src/App.tsx` — add 3 filterMode states, update filter logic, pass mode props

### Step 3a: Update FilterBar

- [ ] **Step 1: Update `MultiSelect` to accept `mode` and `onModeChange` props**

Replace the `MultiSelect` function signature and add the toggle UI at the bottom of the popup. The full updated component:

```tsx
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
```

- [ ] **Step 2: Update `FilterBar` Props type to include mode props**

```ts
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
```

- [ ] **Step 3: Update `FilterBar` function signature and pass mode props to `MultiSelect`**

```ts
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
```

And pass mode props in the JSX:

```tsx
<MultiSelect
  label="风险等级"
  options={RISK_OPTIONS.map((r) => ({ value: r, label: `R${r}` }))}
  selected={riskLevels}
  onChange={onRiskLevelsChange}
  mode={riskMode}
  onModeChange={onRiskModeChange}
/>
<MultiSelect
  label="状态"
  options={STATUS_OPTIONS}
  selected={statuses}
  onChange={onStatusesChange}
  mode={statusMode}
  onModeChange={onStatusModeChange}
/>
<MultiSelect
  label="类别"
  options={DOMICILE_OPTIONS}
  selected={domiciles}
  onChange={onDomicilesChange}
  mode={domicileMode}
  onModeChange={onDomicileModeChange}
/>
```

- [ ] **Step 4: Update `clearAll` to also reset modes**

```ts
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
```

### Step 3b: Update App.tsx

- [ ] **Step 5: Add filterMode states in `App.tsx`**

After the existing filter states, add:

```ts
const [riskMode, setRiskMode] = useState<'include' | 'exclude'>('include')
const [statusMode, setStatusMode] = useState<'include' | 'exclude'>('include')
const [domicileMode, setDomicileMode] = useState<'include' | 'exclude'>('include')
```

- [ ] **Step 6: Update `filteredData` logic in `App.tsx`**

```ts
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
```

- [ ] **Step 7: Update `filterBarProps` in `App.tsx` to include mode props**

```ts
const filterBarProps = {
  search,
  onSearchChange: setSearch,
  riskLevels,
  onRiskLevelsChange: setRiskLevels,
  riskMode,
  onRiskModeChange: setRiskMode,
  statuses,
  onStatusesChange: setStatuses,
  statusMode,
  onStatusModeChange: setStatusMode,
  domiciles,
  onDomicilesChange: setDomiciles,
  domicileMode,
  onDomicileModeChange: setDomicileMode,
  columnVisibility,
  onColumnVisibilityChange: handleVisibilityChange,
  columnOrder: toggleableColOrder,
  onColumnOrderChange: handleOrderChange,
}
```

- [ ] **Step 8: Verify filter exclude works**

Run `npm run dev`. Select "暂停申购" under 状态. Toggle to "排除模式" — the table should show only rows that do NOT contain "suspended". The button border should turn orange.

- [ ] **Step 9: Commit**

```bash
git add src/components/FilterBar.tsx src/App.tsx
git commit -m "feat: filter exclude mode for risk, status, domicile filters"
```

---

## Task 4: Onboarding Tour (Driver.js)

**Files:**
- Modify: `package.json` — add `driver.js`
- Create: `src/lib/tour.ts` — Driver.js config + `startTour()`
- Modify: `src/App.tsx` — auto-trigger on first visit, add help button

### Step 4a: Install driver.js

- [ ] **Step 1: Install dependency**

```bash
npm install driver.js
```

Expected: `driver.js` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Add driver.js CSS import to `src/main.tsx` or `src/index.css`**

In `src/main.tsx`, add at the top:

```ts
import 'driver.js/dist/driver.css'
```

### Step 4b: Create tour config

- [ ] **Step 3: Create `src/lib/tour.ts`**

```ts
import { driver } from 'driver.js'

export const TOUR_KEY = 'hsbc_fund_tour_done'

export function startTour() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0,0,0,0.4)',
    popoverClass: 'hsbc-tour-popover',
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    doneBtnText: '完成',
    onDestroyStarted: () => {
      localStorage.setItem(TOUR_KEY, '1')
      driverObj.destroy()
    },
    steps: [
      {
        element: '[data-tour="search"]',
        popover: {
          title: '搜索基金',
          description: '按基金代码或名称搜索，支持中英文',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="filter-status"]',
        popover: {
          title: '标签筛选',
          description: '选择状态后，可点击底部开关切换"包含/排除"模式',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="filter-risk"]',
        popover: {
          title: '风险等级筛选',
          description: '同样支持包含/排除切换',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="column-toggle"]',
        popover: {
          title: '列显示设置',
          description: '显示/隐藏列，并可拖拽排序',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="table-header"]',
        popover: {
          title: '排序 & 调整列宽',
          description: '点击列头排序，拖拽列头右边缘调整列宽',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="result-count"]',
        popover: {
          title: '筛选结果',
          description: '实时显示当前条件下的基金数量',
          side: 'top',
          align: 'start',
        },
      },
    ],
  })

  driverObj.drive()
}
```

### Step 4c: Add `data-tour` anchors and trigger logic

- [ ] **Step 4: Add `data-tour` attributes to elements in `FundTable.tsx`**

On the result count `<div>` (currently `<div className="text-sm text-gray-500 px-4 py-2">`):

```tsx
<div data-tour="result-count" className="text-sm text-gray-500 px-4 py-2">
  共 {rows.length} / {data.length} 只基金
</div>
```

On the first visible `<th>` in the header, add `data-tour="table-header"` to the first header — wrap the thead map to add the attribute only on index 0:

```tsx
{hg.headers.map((header, idx) => (
  <th
    key={header.id}
    data-tour={idx === 0 ? 'table-header' : undefined}
    // ... rest unchanged
  >
```

- [ ] **Step 5: Add `data-tour` attributes to FilterBar elements in `FilterBar.tsx`**

Add `data-tour` to the search `Field.Root`:

```tsx
<Field.Root
  data-tour="search"
  className="flex items-center border ..."
>
```

Add `data-tour` to the risk `MultiSelect` trigger — since `Popover.Trigger` renders the trigger, wrap the `MultiSelect` call in `FilterBar` with a `<div>`:

```tsx
<div data-tour="filter-risk">
  <MultiSelect
    label="风险等级"
    ...
  />
</div>
<div data-tour="filter-status">
  <MultiSelect
    label="状态"
    ...
  />
</div>
```

Add `data-tour="column-toggle"` to the `ColumnToggle` wrapper in `FilterBar.tsx`:

```tsx
<div data-tour="column-toggle">
  <ColumnToggle ... />
</div>
```

- [ ] **Step 6: Add auto-trigger and help button in `App.tsx`**

Add import:

```ts
import { useEffect } from 'react'
import { startTour, TOUR_KEY } from '@/lib/tour'
import { HelpCircle } from 'lucide-react'
```

Add `useEffect` inside the `App` component (after state declarations, before the loading guards):

```ts
useEffect(() => {
  if (!localStorage.getItem(TOUR_KEY)) {
    // slight delay so DOM is painted
    const t = setTimeout(startTour, 800)
    return () => clearTimeout(t)
  }
}, [])
```

Add help button in the header JSX, between the GitHub link and the end of the header. Place it just before the GitHub `<a>`:

```tsx
<button
  onClick={startTour}
  className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
  aria-label="功能导览"
  title="功能导览"
>
  <HelpCircle size={18} />
</button>
```

- [ ] **Step 7: Override driver.js popover color to match red theme**

In `src/index.css` (or wherever global styles live), add:

```css
.hsbc-tour-popover .driver-popover-title {
  color: #dc2626;
}
.hsbc-tour-popover .driver-popover-next-btn {
  background-color: #dc2626;
  border-color: #dc2626;
}
.hsbc-tour-popover .driver-popover-next-btn:hover {
  background-color: #b91c1c;
  border-color: #b91c1c;
}
```

- [ ] **Step 8: Verify onboarding tour**

Run `npm run dev`. Open in a fresh browser (or clear localStorage). The tour should auto-start after ~800ms, highlight each element in sequence, and complete with a ✓ in localStorage. Click the `?` button in the header to re-trigger at any time.

- [ ] **Step 9: Commit**

```bash
git add src/lib/tour.ts src/components/FundTable.tsx src/components/FilterBar.tsx src/App.tsx src/main.tsx src/index.css package.json package-lock.json
git commit -m "feat: onboarding tour with Driver.js"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Bug fix (Task 1) ✓, Column resize (Task 2) ✓, Filter exclude (Task 3) ✓, Onboarding (Task 4) ✓
- [x] **No placeholders:** All steps have actual code
- [x] **Type consistency:** `ColumnSizingState` used in Task 2 steps 2/3/4/5/7/8/9; `'include' | 'exclude'` used consistently across Task 3
- [x] **`savePrefs` signature:** Updated in Task 2 Step 3, all callers (Step 5) pass 3 args
- [x] **`filterBarProps`:** Updated in Task 3 Step 7 to include all 6 new mode props matching the Props type from Step 2
