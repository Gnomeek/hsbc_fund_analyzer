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
