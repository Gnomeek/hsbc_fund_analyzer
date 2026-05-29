import type { FundRow } from './types'

function parsePerf(val: string): number | null {
  const s = val.trim()
  if (!s) return null
  return parseFloat(s.replace('+', ''))
}

// 正确处理 RFC 4180 引号字段（字段内含逗号或换行）
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // 转义双引号
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export function parseCSV(text: string): FundRow[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const headers = splitCSVLine(lines[0].replace(/\uFEFF/, ''))

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const cells = splitCSVLine(line)
      const get = (col: string) => cells[headers.indexOf(col)]?.trim() ?? ''

      return {
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
        doc_prospectus: get('doc_prospectus'),
        doc_annual_report: get('doc_annual_report'),
        doc_quarterly_report: get('doc_quarterly_report'),
        doc_semi_annual_report: get('doc_semi_annual_report'),
        doc_monthly_report: get('doc_monthly_report'),
        doc_fund_contract: get('doc_fund_contract'),
        doc_product_summary: get('doc_product_summary'),
        doc_offering_announcement: get('doc_offering_announcement'),
        doc_all_announcements: get('doc_all_announcements'),
      }
    })
}
