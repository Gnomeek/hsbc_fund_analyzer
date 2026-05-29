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
