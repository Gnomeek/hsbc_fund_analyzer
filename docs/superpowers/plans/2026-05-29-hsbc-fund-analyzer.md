# HSBC 基金分析器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可部署到 Vercel 的交互式基金浏览器，加载 HSBC Fund Express CSV，支持搜索、多维度筛选、列排序、列可见性配置，598 行数据行虚拟化渲染。

**Architecture:** Vite SPA，App.tsx 持有全部筛选 state，FilterBar 负责交互输入，FundTable 用 TanStack Table + TanStack Virtual 渲染，组件之间通过 props 传值，无全局状态库。CSV 放在 `public/funds.csv`，运行时 fetch + 浏览器原生解析。

**Tech Stack:** Vite 6 + React 19 + TypeScript, @tanstack/react-table v8, @tanstack/react-virtual v3, @base-ui/react, Tailwind CSS v4

---

## 文件结构

```
hsbc_fund_analyzer/
├── public/
│   └── funds.csv                        # 数据文件（从 assets/ 复制）
├── src/
│   ├── lib/
│   │   ├── types.ts                     # FundRow 类型定义
│   │   ├── parseCSV.ts                  # CSV 字符串 → FundRow[]
│   │   └── columns.ts                   # TanStack Table 列定义
│   ├── hooks/
│   │   └── useFundData.ts               # fetch + 解析，返回 { data, loading, error }
│   ├── components/
│   │   ├── PerfCell.tsx                 # 收益率单元格（红/绿/灰）
│   │   ├── StatusBadge.tsx              # 状态徽章
│   │   ├── RiskBadge.tsx                # 风险等级徽章 R1–R5
│   │   ├── ColumnToggle.tsx             # 列配置 Popover（@base-ui Popover + Checkbox）
│   │   ├── FilterBar.tsx                # 顶部筛选栏
│   │   └── FundTable.tsx                # 主表格（TanStack Table + Virtual）
│   ├── App.tsx                          # 顶层 state + 布局
│   ├── main.tsx                         # React 挂载点
│   └── index.css                        # Tailwind 入口
├── index.html
├── vite.config.ts
├── vercel.json
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: 脚手架 — Vite + React + TypeScript + Tailwind

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/index.css`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`（占位）
- Create: `vercel.json`
- Create: `tsconfig.json`

- [ ] **Step 1: 在项目根目录初始化 Vite 项目**

```bash
cd /Users/wzhao2/Documents/GithubRepos/Untitled/hsbc_fund_analyzer
npm create vite@latest . -- --template react-ts
```

选择覆盖已有文件时选 `Yes`（仅影响 vite 脚手架文件，不影响 docs/ assets/ 等目录）。

- [ ] **Step 2: 安装所有依赖**

```bash
npm install
npm install @tanstack/react-table @tanstack/react-virtual @base-ui/react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 Tailwind v4**

修改 `vite.config.ts`：
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

替换 `src/index.css` 内容：
```css
@import "tailwindcss";
```

- [ ] **Step 4: 创建 `vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 5: 复制 CSV 到 public/**

```bash
cp "assets/HSBC Fund Express.csv" public/funds.csv
```

- [ ] **Step 6: 清空脚手架占位内容，创建最小 App.tsx**

`src/App.tsx`:
```tsx
export default function App() {
  return <div className="p-4">HSBC Fund Analyzer</div>
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 7: 验证开发服务器启动**

```bash
npm run dev
```

预期：终端输出 `Local: http://localhost:5173`，浏览器显示 "HSBC Fund Analyzer" 文字。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind"
```

---

## Task 2: 数据层 — 类型、CSV 解析、fetch hook

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/parseCSV.ts`
- Create: `src/hooks/useFundData.ts`

- [ ] **Step 1: 定义 `FundRow` 类型**

`src/lib/types.ts`:
```ts
export type FundRow = {
  fund_code: string
  fund_name_clean: string
  fund_status: string
  fund_domicile: string
  risk_level: number
  nav: number | null
  nav_date: string
  perf_1d_pct: number | null
  perf_1m_pct: number | null
  perf_3m_pct: number | null
  perf_6m_pct: number | null
  perf_1y_pct: number | null
  perf_ytd_pct: number | null
  annual_return_2021_pct: number | null
  annual_return_2022_pct: number | null
  annual_return_2023_pct: number | null
  annual_return_2024_pct: number | null
  annual_return_2025_pct: number | null
  fund_detail_url: string
  xueqiu_link: string
}
```

- [ ] **Step 2: 实现 CSV 解析函数**

`src/lib/parseCSV.ts`:
```ts
import type { FundRow } from './types'

const PERF_COLS = [
  'perf_1d_pct', 'perf_1m_pct', 'perf_3m_pct', 'perf_6m_pct',
  'perf_1y_pct', 'perf_ytd_pct',
  'annual_return_2021_pct', 'annual_return_2022_pct',
  'annual_return_2023_pct', 'annual_return_2024_pct',
  'annual_return_2025_pct',
] as const

function parsePerf(val: string): number | null {
  const s = val.trim()
  if (!s) return null
  return parseFloat(s.replace('+', ''))
}

export function parseCSV(text: string): FundRow[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const headers = lines[0].replace(/^﻿/, '').split(',')

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      // CSV split that handles no quoted fields (this CSV has none)
      const cells = line.split(',')
      const get = (col: string) => cells[headers.indexOf(col)]?.trim() ?? ''

      const row: FundRow = {
        fund_code: get('fund_code'),
        fund_name_clean: get('fund_name_clean'),
        fund_status: get('fund_status'),
        fund_domicile: get('fund_domicile'),
        risk_level: parseInt(get('risk_level')) || 0,
        nav: parseFloat(get('nav')) || null,
        nav_date: get('nav_date'),
        perf_1d_pct: parsePerf(get('perf_1d_pct')),
        perf_1m_pct: parsePerf(get('perf_1m_pct')),
        perf_3m_pct: parsePerf(get('perf_3m_pct')),
        perf_6m_pct: parsePerf(get('perf_6m_pct')),
        perf_1y_pct: parsePerf(get('perf_1y_pct')),
        perf_ytd_pct: parsePerf(get('perf_ytd_pct')),
        annual_return_2021_pct: parsePerf(get('annual_return_2021_pct')),
        annual_return_2022_pct: parsePerf(get('annual_return_2022_pct')),
        annual_return_2023_pct: parsePerf(get('annual_return_2023_pct')),
        annual_return_2024_pct: parsePerf(get('annual_return_2024_pct')),
        annual_return_2025_pct: parsePerf(get('annual_return_2025_pct')),
        fund_detail_url: get('fund_detail_url'),
        xueqiu_link: get('xueqiu_link'),
      }
      return row
    })
}
```

- [ ] **Step 3: 实现 `useFundData` hook**

`src/hooks/useFundData.ts`:
```ts
import { useState, useEffect } from 'react'
import { parseCSV } from '../lib/parseCSV'
import type { FundRow } from '../lib/types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: FundRow[] }

export function useFundData(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    fetch('/funds.csv')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => setState({ status: 'ok', data: parseCSV(text) }))
      .catch(e => setState({ status: 'error', message: String(e) }))
  }, [])

  return state
}
```

- [ ] **Step 4: 在 App.tsx 中验证数据加载**

`src/App.tsx`:
```tsx
import { useFundData } from './hooks/useFundData'

export default function App() {
  const state = useFundData()
  if (state.status === 'loading') return <div className="p-4">加载中…</div>
  if (state.status === 'error') return <div className="p-4 text-red-500">{state.message}</div>
  return <div className="p-4">已加载 {state.data.length} 条基金数据</div>
}
```

- [ ] **Step 5: 验证浏览器显示 "已加载 598 条基金数据"**

```bash
npm run dev
```

打开 http://localhost:5173，确认显示 `已加载 598 条基金数据`。

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/parseCSV.ts src/hooks/useFundData.ts src/App.tsx public/funds.csv
git commit -m "feat: data layer — types, CSV parser, useFundData hook"
```

---

## Task 3: 小型展示组件 — PerfCell、StatusBadge、RiskBadge

**Files:**
- Create: `src/components/PerfCell.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/RiskBadge.tsx`

- [ ] **Step 1: 创建 `PerfCell.tsx`**

`src/components/PerfCell.tsx`:
```tsx
type Props = { value: number | null }

export function PerfCell({ value }: Props) {
  if (value === null) return <span className="text-gray-400">—</span>
  const color = value >= 0 ? 'text-green-600' : 'text-red-500'
  const sign = value >= 0 ? '+' : ''
  return <span className={color}>{sign}{value.toFixed(2)}%</span>
}
```

- [ ] **Step 2: 创建 `StatusBadge.tsx`**

`src/components/StatusBadge.tsx`:
```tsx
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  suspended:    { label: '暂停申购',   className: 'bg-gray-100 text-gray-600' },
  online_only:  { label: '仅电子渠道', className: 'bg-blue-100 text-blue-700' },
  qdii:         { label: 'QDII',       className: 'bg-purple-100 text-purple-700' },
}

type Props = { value: string }

export function StatusBadge({ value }: Props) {
  if (!value) return null
  const parts = value.split(',').map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map(part => {
        const cfg = STATUS_MAP[part]
        if (!cfg) return null
        return (
          <span key={part} className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.className}`}>
            {cfg.label}
          </span>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: 创建 `RiskBadge.tsx`**

`src/components/RiskBadge.tsx`:
```tsx
const RISK_STYLES: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
}

type Props = { value: number }

export function RiskBadge({ value }: Props) {
  const style = RISK_STYLES[value] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${style}`}>
      R{value}
    </span>
  )
}
```

- [ ] **Step 4: 快速目视验证**

在 `App.tsx` 临时加入：
```tsx
import { PerfCell } from './components/PerfCell'
import { StatusBadge } from './components/StatusBadge'
import { RiskBadge } from './components/RiskBadge'

// 在 return 里加：
<div className="p-4 flex gap-4 items-center">
  <PerfCell value={72.56} />
  <PerfCell value={-5.3} />
  <PerfCell value={null} />
  <StatusBadge value="online_only,qdii" />
  <RiskBadge value={3} />
</div>
```

浏览器确认显示绿色正数、红色负数、灰色破折号、双徽章、黄色 R3。

- [ ] **Step 5: 还原 App.tsx 占位内容（保持 Step 4 之前的状态）**

`src/App.tsx`:
```tsx
import { useFundData } from './hooks/useFundData'

export default function App() {
  const state = useFundData()
  if (state.status === 'loading') return <div className="p-4">加载中…</div>
  if (state.status === 'error') return <div className="p-4 text-red-500">{state.message}</div>
  return <div className="p-4">已加载 {state.data.length} 条基金数据</div>
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/PerfCell.tsx src/components/StatusBadge.tsx src/components/RiskBadge.tsx src/App.tsx
git commit -m "feat: PerfCell, StatusBadge, RiskBadge display components"
```

---

## Task 4: 列定义 — TanStack Table columns

**Files:**
- Create: `src/lib/columns.ts`

- [ ] **Step 1: 创建列定义文件**

`src/lib/columns.ts`:
```ts
import { createColumnHelper } from '@tanstack/react-table'
import type { FundRow } from './types'

const h = createColumnHelper<FundRow>()

export const ALL_COLUMNS = [
  h.accessor('fund_code', {
    id: 'fund_code',
    header: '代码',
    enableHiding: false,
    size: 80,
  }),
  h.accessor('fund_name_clean', {
    id: 'fund_name_clean',
    header: '基金名称',
    enableHiding: false,
    size: 260,
  }),
  h.accessor('fund_status', {
    id: 'fund_status',
    header: '状态',
    size: 130,
  }),
  h.accessor('fund_domicile', {
    id: 'fund_domicile',
    header: '归属地',
    size: 120,
  }),
  h.accessor('risk_level', {
    id: 'risk_level',
    header: '风险',
    size: 60,
  }),
  h.accessor('nav', {
    id: 'nav',
    header: '净值',
    size: 80,
  }),
  h.accessor('perf_1d_pct', {
    id: 'perf_1d_pct',
    header: '1日',
    size: 75,
  }),
  h.accessor('perf_1m_pct', {
    id: 'perf_1m_pct',
    header: '1月',
    size: 75,
  }),
  h.accessor('perf_3m_pct', {
    id: 'perf_3m_pct',
    header: '3月',
    size: 75,
  }),
  h.accessor('perf_6m_pct', {
    id: 'perf_6m_pct',
    header: '6月',
    size: 75,
  }),
  h.accessor('perf_1y_pct', {
    id: 'perf_1y_pct',
    header: '1年',
    size: 80,
  }),
  h.accessor('perf_ytd_pct', {
    id: 'perf_ytd_pct',
    header: 'YTD',
    size: 80,
  }),
  h.accessor('annual_return_2021_pct', {
    id: 'annual_return_2021_pct',
    header: '2021',
    size: 75,
  }),
  h.accessor('annual_return_2022_pct', {
    id: 'annual_return_2022_pct',
    header: '2022',
    size: 75,
  }),
  h.accessor('annual_return_2023_pct', {
    id: 'annual_return_2023_pct',
    header: '2023',
    size: 75,
  }),
  h.accessor('annual_return_2024_pct', {
    id: 'annual_return_2024_pct',
    header: '2024',
    size: 75,
  }),
  h.accessor('annual_return_2025_pct', {
    id: 'annual_return_2025_pct',
    header: '2025',
    size: 75,
  }),
]

// 默认可见的列 id
export const DEFAULT_VISIBLE_COLUMNS = new Set([
  'fund_code',
  'fund_name_clean',
  'fund_status',
  'fund_domicile',
  'risk_level',
  'nav',
  'perf_1y_pct',
  'perf_ytd_pct',
])

// 可在 ColumnToggle 中显隐的列（代码和名称始终显示）
export const TOGGLEABLE_COLUMNS = ALL_COLUMNS.filter(
  col => col.id !== 'fund_code' && col.id !== 'fund_name_clean'
)
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

预期：无输出（0 错误）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/columns.ts
git commit -m "feat: TanStack Table column definitions"
```

---

## Task 5: 主表格 — FundTable

**Files:**
- Create: `src/components/FundTable.tsx`

- [ ] **Step 1: 创建 FundTable 组件**

`src/components/FundTable.tsx`:
```tsx
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
            {/* 虚拟化前的空白占位 */}
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
            {/* 虚拟化后的空白占位 */}
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
```

- [ ] **Step 2: 在 App.tsx 接入 FundTable（带占位 state）**

`src/App.tsx`:
```tsx
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
```

- [ ] **Step 3: 验证表格正常渲染**

```bash
npm run dev
```

打开 http://localhost:5173，确认：
- 表格显示 598 条数据
- 列头点击可排序，出现 ↑↓
- 收益率显示红绿颜色
- 代码列有蓝色链接

- [ ] **Step 4: Commit**

```bash
git add src/components/FundTable.tsx src/App.tsx
git commit -m "feat: FundTable with TanStack Table + Virtual"
```

---

## Task 6: 列配置弹窗 — ColumnToggle

**Files:**
- Create: `src/components/ColumnToggle.tsx`

- [ ] **Step 1: 创建 `ColumnToggle.tsx`**

`src/components/ColumnToggle.tsx`:
```tsx
import * as Popover from '@base-ui-components/react/popover'
import * as Checkbox from '@base-ui-components/react/checkbox'
import type { VisibilityState } from '@tanstack/react-table'
import { TOGGLEABLE_COLUMNS } from '../lib/columns'

type Props = {
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
}

export function ColumnToggle({ columnVisibility, onColumnVisibilityChange }: Props) {
  function toggle(colId: string) {
    onColumnVisibilityChange({
      ...columnVisibility,
      [colId]: !columnVisibility[colId],
    })
  }

  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700">
        <span>列配置</span>
        <span className="text-gray-400">⚙</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6}>
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-52 z-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">显示列</p>
            <div className="flex flex-col gap-1.5">
              {TOGGLEABLE_COLUMNS.map(col => {
                const id = col.id!
                const visible = columnVisibility[id] ?? false
                return (
                  <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox.Root
                      checked={visible}
                      onCheckedChange={() => toggle(id)}
                      className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center data-[checked]:bg-blue-600 data-[checked]:border-blue-600 transition-colors"
                    >
                      <Checkbox.Indicator className="text-white text-xs">✓</Checkbox.Indicator>
                    </Checkbox.Root>
                    <span className="text-sm text-gray-700">
                      {col.columnDef.header as string}
                    </span>
                  </label>
                )
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

- [ ] **Step 2: 确认 @base-ui/react 导入路径**

```bash
ls node_modules/@base-ui-components/react/ | head -20
```

如果包名不是 `@base-ui-components/react` 而是 `@base-ui/react`，则将所有 import 中的 `@base-ui-components/react` 替换为 `@base-ui/react`。

- [ ] **Step 3: Commit**

```bash
git add src/components/ColumnToggle.tsx
git commit -m "feat: ColumnToggle with @base-ui Popover + Checkbox"
```

---

## Task 7: 筛选栏 — FilterBar

**Files:**
- Create: `src/components/FilterBar.tsx`

- [ ] **Step 1: 创建 `FilterBar.tsx`**

`src/components/FilterBar.tsx`:
```tsx
import { useRef, useEffect, useState } from 'react'
import * as Field from '@base-ui-components/react/field'
import * as Popover from '@base-ui-components/react/popover'
import type { VisibilityState } from '@tanstack/react-table'
import { ColumnToggle } from './ColumnToggle'

const RISK_OPTIONS = [1, 2, 3, 4, 5]
const STATUS_OPTIONS = [
  { value: 'suspended',   label: '暂停申购' },
  { value: 'online_only', label: '仅电子渠道' },
  { value: 'qdii',        label: 'QDII' },
]
const DOMICILE_OPTIONS = [
  { value: 'Mainland Securities Fund',   label: '内地基金' },
  { value: 'HK Mutual Recognition Fund', label: '香港互认基金' },
]

type Props = {
  search: string
  onSearchChange: (v: string) => void
  riskLevels: number[]
  onRiskLevelsChange: (v: number[]) => void
  statuses: string[]
  onStatusesChange: (v: string[]) => void
  domiciles: string[]
  onDomicilesChange: (v: string[]) => void
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
}

function MultiSelect<T extends string | number>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (v: T[]) => void
}) {
  function toggle(val: T) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }

  const displayLabel = selected.length === 0
    ? label
    : selected.length === options.length
    ? `${label}：全部`
    : `${label} (${selected.length})`

  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 min-w-max">
        <span>{displayLabel}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-36 z-50">
            {options.map(opt => (
              <div
                key={String(opt.value)}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 select-none"
              >
                <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${selected.includes(opt.value) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                  {selected.includes(opt.value) ? '✓' : ''}
                </span>
                {opt.label}
              </div>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function FilterBar({
  search, onSearchChange,
  riskLevels, onRiskLevelsChange,
  statuses, onStatusesChange,
  domiciles, onDomicilesChange,
  columnVisibility, onColumnVisibilityChange,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearchChange(localSearch), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [localSearch, onSearchChange])

  const hasFilter = search || riskLevels.length || statuses.length || domiciles.length

  function clearAll() {
    setLocalSearch('')
    onSearchChange('')
    onRiskLevelsChange([])
    onStatusesChange([])
    onDomicilesChange([])
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Field.Root className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <span className="pl-3 text-gray-400 text-sm">🔍</span>
        <Field.Control
          as="input"
          value={localSearch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)}
          placeholder="搜索基金代码或名称…"
          className="px-2 py-1.5 text-sm outline-none bg-transparent w-52"
        />
      </Field.Root>

      <MultiSelect
        label="风险等级"
        options={RISK_OPTIONS.map(r => ({ value: r, label: `R${r}` }))}
        selected={riskLevels}
        onChange={onRiskLevelsChange}
      />
      <MultiSelect
        label="状态"
        options={STATUS_OPTIONS}
        selected={statuses}
        onChange={onStatusesChange}
      />
      <MultiSelect
        label="归属地"
        options={DOMICILE_OPTIONS}
        selected={domiciles}
        onChange={onDomicilesChange}
      />

      <ColumnToggle
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />

      {hasFilter && (
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          清除筛选
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: FilterBar with search, multi-select filters, column toggle"
```

---

## Task 8: 接线 — App.tsx 完整版

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 完善 App.tsx，接入筛选逻辑**

`src/App.tsx`:
```tsx
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

  // 多选筛选在 TanStack 之外提前过滤（比 columnFilters 更直观）
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
```

- [ ] **Step 2: 验证全功能**

```bash
npm run dev
```

逐一验证：
1. 搜索 "华夏" → 表格实时过滤
2. 选风险等级 R3 → 只显示风险3的基金
3. 选状态"暂停申购" → 只显示 suspended
4. 列配置勾选"1年" → 收益列出现（默认已显示）；勾选"2021" → 年度收益列出现
5. 点击列头"1年" → 排序
6. 清除筛选 → 恢复全部

- [ ] **Step 3: 类型检查**

```bash
npx tsc --noEmit
```

预期：0 错误。

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up App.tsx — search, filters, column visibility, sorting"
```

---

## Task 9: 构建验证 + Vercel 部署准备

**Files:**
- Verify: `vercel.json`

- [ ] **Step 1: 生产构建**

```bash
npm run build
```

预期：`dist/` 目录生成，无错误，输出大致如下：
```
dist/index.html
dist/assets/index-[hash].js
dist/assets/index-[hash].css
dist/funds.csv
```

- [ ] **Step 2: 本地预览生产版本**

```bash
npm run preview
```

打开 http://localhost:4173，验证生产版本功能正常。

- [ ] **Step 3: 确认 vercel.json 存在且格式正确**

文件内容：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 4: 最终 Commit**

```bash
git add .
git commit -m "feat: production build verified, ready for Vercel deployment"
```

- [ ] **Step 5: 部署到 Vercel（可选）**

```bash
npx vercel
```

按提示选择：
- Link to existing project? → No（第一次部署选 No）
- Project name → `hsbc-fund-analyzer`（或自定义）
- Framework preset → Vite

部署完成后 Vercel 输出正式 URL。
