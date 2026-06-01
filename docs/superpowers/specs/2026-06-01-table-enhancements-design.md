# 表格增强功能设计文档

**日期：** 2026-06-01  
**范围：** 四项独立功能：列拖拽调宽 + 持久化、筛选排除模式、文字选中修复、Onboarding 引导

---

## 1. 列拖拽调宽（Column Resize）

### 方案
使用 TanStack Table v8 内置 resize API，零新增依赖。

### 数据流

```
用户拖拽 <th> resize handle
  → column.getResizeHandler() 触发
  → table 内部更新 columnSizing state
  → onColumnSizingChange 回调 → App.tsx
  → savePrefs() 写入 localStorage（与 visibility/order 合并）
```

### 改动点

**`src/lib/columns.ts`**  
所有列加 `enableResizing: true`（或在 table 配置里全局开启）。

**`src/App.tsx`**  
- 新增 `columnSizing` state，类型 `ColumnSizingState`，初始从 `loadPrefs()` 恢复。  
- `savePrefs` 扩展：存入 `{ visibility, order, sizing }`。  
- 将 `columnSizing` 和 `onColumnSizingChange` 传给 `FundTable`。

**`src/components/FundTable.tsx`**  
- `useReactTable` 加 `columnResizeMode: 'onChange'`，注入 `columnSizing` state。  
- `<th>` 内追加 resize handle 元素：
  ```tsx
  <div
    onMouseDown={header.getResizeHandler()}
    onTouchStart={header.getResizeHandler()}
    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 
      ${header.column.getIsResizing() ? 'bg-blue-500' : 'bg-transparent'}`}
  />
  ```
- `<th>` 改为 `position: relative` 以容纳 handle 定位。
- `<th>` 宽度改用 `header.getSize()`（已有），`<td>` 同步。

### 最小宽度
各列保留现有 `size` 值作为 `minSize`，防止拖到 0。

---

## 2. 筛选排除模式（Filter Exclude）

### 方案
每个多选筛选器（风险、状态、类别）独立维护一个 `exclude` boolean，在弹出菜单内底部加切换按钮。

### 数据结构

```ts
// App.tsx 新增
type FilterMode = 'include' | 'exclude'

const [riskMode, setRiskMode] = useState<FilterMode>('include')
const [statusMode, setStatusMode] = useState<FilterMode>('include')
const [domicileMode, setDomicileMode] = useState<FilterMode>('include')
```

### 过滤逻辑（App.tsx `filteredData`）

```ts
// 当前
if (statuses.length && !statuses.some(s => row.fund_status.includes(s))) return false

// 改为
if (statuses.length) {
  const matches = statuses.some(s => row.fund_status.includes(s))
  if (statusMode === 'include' ? !matches : matches) return false
}
```

风险、类别同理。

### UI（FilterBar.tsx）

`MultiSelect` 组件接受 `mode: FilterMode` 和 `onModeChange` 两个新 prop。弹出菜单底部加分割线 + toggle 行：

```
┌─────────────────┐
│ ☑ 暂停申购       │
│ ☑ 仅电子渠道     │
│ □ QDII          │
├─────────────────┤
│ [包含 ↔ 排除]    │  ← 仅当 selected.length > 0 时显示
└─────────────────┘
```

Toggle 样式：包含模式用蓝色，排除模式用橙色/红色，直观区分。

**`countActiveFilters`**：排除模式下选中的筛选同样计入 badge 数量（行为一致）。

---

## 3. 文字选中修复（Bug Fix）

### 根因
`FundTable.tsx:137`，scroll 容器的 inline style 中有 `userSelect: 'none'`。这是为了防止拖拽排序时意外选中文字，但覆盖了整个表格，导致普通浏览时完全无法选中。

### 修复
**移除** `userSelect: 'none'`，只在 `<thead>` 的 `<th>` 上保留 `select-none` class（已有，防止点击排序时选中表头文字）。

`<td>` 的文字默认可选，无需额外操作。

---

## 4. Onboarding 引导（Driver.js）

### 依赖
```
driver.js  (~5kb gzip，无其他依赖)
```

### 触发逻辑

```ts
// localStorage key
const TOUR_KEY = 'hsbc_fund_tour_done'

// 首次访问自动启动
useEffect(() => {
  if (!localStorage.getItem(TOUR_KEY)) startTour()
}, [])

// 完成/跳过时写标记
function onTourComplete() {
  localStorage.setItem(TOUR_KEY, '1')
}
```

页头加「? 功能导览」按钮，点击随时重新触发（不受 localStorage 标记影响）。

### 步骤规划（6 步）

| 步# | 高亮元素 | 说明文字 |
|-----|---------|---------|
| 1 | 搜索框 | 按基金代码或名称搜索 |
| 2 | 风险等级筛选器 | 可多选，支持"包含/排除"切换 |
| 3 | 状态筛选器 | 同上 |
| 4 | 列切换按钮（ColumnToggle） | 显示/隐藏列，可拖拽排序 |
| 5 | 表头（任意一列） | 点击排序，拖拽边缘可调整列宽 |
| 6 | 结果计数行 | 实时显示筛选后数量 |

### 文件组织

新建 `src/lib/tour.ts`：导出 `startTour()` 函数，封装 driver.js 配置。`App.tsx` 调用，避免组件内联大段配置。

### 样式覆盖
Driver.js 默认样式与项目色调（红色主题）需一处 CSS 覆盖：高亮边框改为 `#dc2626`（red-600）。

---

## 改动文件清单

| 文件 | 改动类型 |
|------|---------|
| `src/App.tsx` | 新增 columnSizing state、filterMode state、tour 触发逻辑 |
| `src/components/FundTable.tsx` | resize API 接入、移除 userSelect:none、新增 resize handle |
| `src/components/FilterBar.tsx` | MultiSelect 新增 mode prop、UI 添加 toggle |
| `src/lib/columns.ts` | 各列加 enableResizing |
| `src/lib/tour.ts` | 新建，封装 driver.js tour 配置 |
| `package.json` | 新增 driver.js 依赖 |

---

## 实现顺序建议

1. **Bug fix**（文字选中）— 一行改动，独立提交
2. **列 resize** — 核心交互，改动集中
3. **筛选排除** — 独立逻辑，不影响其他
4. **Onboarding** — 依赖前三项都完成后，元素 ID 才稳定
