# HSBC 基金分析器 — 设计文档

**日期：** 2026-05-29  
**状态：** 已批准

---

## 概述

基于 HSBC Fund Express CSV 数据（598 条基金记录）构建一个可部署到 Vercel 的交互式基金浏览器，支持表格过滤、排序、列配置。

---

## 技术栈

| 层级 | 选型 |
|------|------|
| 构建工具 | Vite + React + TypeScript |
| 表格逻辑 | `@tanstack/react-table` |
| 行虚拟化 | `@tanstack/react-virtual` |
| UI 原语 | `@base-ui/react` |
| 样式 | Tailwind CSS v4 |
| 数据加载 | 运行时 `fetch('/funds.csv')`，浏览器原生解析 |
| 部署 | Vercel（SPA，`vercel.json` 配置 rewrite） |

---

## 项目结构

```
hsbc_fund_analyzer/
├── public/
│   └── funds.csv                  # 数据文件，直接复制 assets/ 下现有 CSV
├── src/
│   ├── components/
│   │   ├── FilterBar.tsx          # 顶部筛选栏
│   │   ├── FundTable.tsx          # 主表格（TanStack Table + Virtual）
│   │   ├── ColumnToggle.tsx       # 列配置 Popover
│   │   ├── PerfCell.tsx           # 收益率单元格（红绿着色）
│   │   └── StatusBadge.tsx        # 状态徽章
│   ├── hooks/
│   │   └── useFundData.ts         # fetch + 解析 CSV → FundRow[]
│   ├── lib/
│   │   ├── columns.ts             # TanStack Table 列定义
│   │   └── types.ts               # FundRow 类型
│   ├── App.tsx                    # 顶层状态（筛选 state）
│   └── main.tsx
├── index.html
├── vite.config.ts
├── vercel.json
└── tailwind.config.ts
```

---

## 数据模型

### FundRow 类型

```ts
type FundRow = {
  fund_code: string
  fund_name_clean: string
  fund_status: string          // "" | "suspended" | "online_only" | "qdii" | 组合值
  fund_domicile: string        // "Mainland Securities Fund" | "HK Mutual Recognition Fund"
  risk_level: number           // 1–5
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

### CSV 解析规则

- 首行为 header，按列名映射
- 收益率字段：去除 `+`/`-` 号后 `parseFloat`，保留符号为正负数；空字符串 → `null`
- `risk_level` → `parseInt`
- `nav` → `parseFloat`，空 → `null`

---

## 状态管理

全部 `useState` 在 `App.tsx` 顶层，向下 props 传递：

```ts
search: string          // 全局搜索，匹配 fund_code + fund_name_clean
riskLevels: number[]    // 多选，空数组 = 不限
statuses: string[]      // 多选，空数组 = 不限
domiciles: string[]     // 多选，空数组 = 不限
columnVisibility: ColumnVisibilityState  // TanStack Table 内置类型
```

TanStack Table 的 `globalFilter` 处理搜索，`columnFilters` 处理多选筛选，不手写 filter 函数。

---

## 组件规格

### FilterBar

- `Field` + `Field.Control`（`@base-ui/react`）— 搜索框，debounce 300ms
- `Select`（`@base-ui/react`）— 风险等级多选（R1–R5）
- `Select`（`@base-ui/react`）— 状态多选（中文标签：暂停申购 / 仅电子渠道 / QDII / 正常）
- `Select`（`@base-ui/react`）— 归属地多选（内地基金 / 香港互认基金）
- 右侧：列配置按钮（触发 `ColumnToggle` Popover）
- 有任一筛选激活时：显示"清除全部"按钮

### FundTable

- TanStack Table 实例，`useVirtualizer` 行虚拟化
- 容器固定高度 `calc(100vh - 160px)`，overflow-y scroll
- 列头点击排序，显示 ↑↓ 指示箭头

**默认可见列（8列）：**

| 列 | 说明 |
|----|------|
| fund_code | `<a href={xueqiu_link}>` 跳转雪球；无链接则纯文本 |
| fund_name_clean | 基金名称 |
| fund_status | `StatusBadge` 组件 |
| fund_domicile | 归属地 |
| risk_level | `R1`–`R5` 彩色徽章 |
| nav | 净值，保留 4 位小数 |
| perf_1y_pct | `PerfCell` |
| perf_ytd_pct | `PerfCell` |

**默认隐藏列（通过 ColumnToggle 可开启）：**
- perf_1d / 1m / 3m / 6m
- annual_return_2021–2025
- fund_detail_url（文字链接）

### PerfCell

- 正数：`text-green-600`，显示 `+X.XX%`
- 负数：`text-red-500`，显示 `X.XX%`
- null：显示 `—`，`text-gray-400`

### StatusBadge

| 值 | 标签 | 样式 |
|----|------|------|
| `suspended` | 暂停申购 | 灰色 |
| `online_only` | 仅电子渠道 | 蓝色 |
| `qdii` | QDII | 紫色 |
| `online_only,qdii` | 仅电子渠道·QDII | 蓝+紫双徽章 |
| `""` | — | 空 |

### ColumnToggle

- `Popover`（`@base-ui/react`）触发
- `Checkbox`（`@base-ui/react`）列表，一个 checkbox 对应一个可切换列
- 直接读写 TanStack Table 的 `columnVisibility` state

---

## 部署

`vercel.json`：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

`public/funds.csv` 随静态资源一起部署，无需后端。

---

## 不在范围内

- 数据更新机制（手动替换 CSV 文件即可）
- 用户认证
- 基金详情页（代码列链接直跳 HSBC/雪球外部页）
- 移动端适配（桌面优先）
