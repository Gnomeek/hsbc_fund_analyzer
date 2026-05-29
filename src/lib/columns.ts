import { createColumnHelper } from "@tanstack/react-table";
import type { FundRow } from "./types";

const h = createColumnHelper<FundRow>();

export const ALL_COLUMNS = [
  h.accessor("fund_code", {
    id: "fund_code",
    header: "代码",
    enableHiding: false,
    size: 80,
  }),
  h.accessor("fund_name_clean", {
    id: "fund_name_clean",
    header: "基金名称",
    enableHiding: false,
    size: 300,
  }),
  h.accessor("fund_status", {
    id: "fund_status",
    header: "标签",
    size: 120,
  }),
  h.accessor("fund_domicile", {
    id: "fund_domicile",
    header: "类别",
    size: 72,
  }),
  h.accessor("risk_level", {
    id: "risk_level",
    header: "风险",
    size: 72,
  }),
  h.accessor("nav", {
    id: "nav",
    header: "净值",
    size: 72,
  }),
  h.accessor("nav_date", {
    id: "nav_date",
    header: "更新日期",
    size: 100,
    enableSorting: false,
  }),
  h.accessor("perf_1d_pct", {
    id: "perf_1d_pct",
    header: "1日表现",
    size: 75,
  }),
  h.accessor("perf_1m_pct", {
    id: "perf_1m_pct",
    header: "1月表现",
    size: 75,
  }),
  h.accessor("perf_3m_pct", {
    id: "perf_3m_pct",
    header: "3月表现",
    size: 75,
  }),
  h.accessor("perf_6m_pct", {
    id: "perf_6m_pct",
    header: "6月表现",
    size: 75,
  }),
  h.accessor("perf_1y_pct", {
    id: "perf_1y_pct",
    header: "1年表现",
    size: 80,
  }),
  h.accessor("perf_ytd_pct", {
    id: "perf_ytd_pct",
    header: "YTD表现",
    size: 80,
  }),
  h.accessor("annual_return_2021_pct", {
    id: "annual_return_2021_pct",
    header: "2021回报率",
    size: 75,
  }),
  h.accessor("annual_return_2022_pct", {
    id: "annual_return_2022_pct",
    header: "2022回报率",
    size: 75,
  }),
  h.accessor("annual_return_2023_pct", {
    id: "annual_return_2023_pct",
    header: "2023回报率",
    size: 75,
  }),
  h.accessor("annual_return_2024_pct", {
    id: "annual_return_2024_pct",
    header: "2024回报率",
    size: 75,
  }),
  h.accessor("annual_return_2025_pct", {
    id: "annual_return_2025_pct",
    header: "2025回报率",
    size: 75,
  }),
  // 文件文档列（默认隐藏）
  h.accessor("doc_prospectus", {
    id: "doc_prospectus",
    header: "招募说明书",
    size: 90,
    enableSorting: false,
  }),
  h.accessor("doc_annual_report", {
    id: "doc_annual_report",
    header: "年度报告",
    size: 80,
    enableSorting: false,
  }),
  h.accessor("doc_quarterly_report", {
    id: "doc_quarterly_report",
    header: "季度报告",
    size: 80,
    enableSorting: false,
  }),
  h.accessor("doc_semi_annual_report", {
    id: "doc_semi_annual_report",
    header: "半年报告",
    size: 80,
    enableSorting: false,
  }),
  h.accessor("doc_monthly_report", {
    id: "doc_monthly_report",
    header: "月报",
    size: 56,
    enableSorting: false,
  }),
  h.accessor("doc_fund_contract", {
    id: "doc_fund_contract",
    header: "基金合同",
    size: 80,
    enableSorting: false,
  }),
  h.accessor("doc_product_summary", {
    id: "doc_product_summary",
    header: "产品概要",
    size: 80,
    enableSorting: false,
  }),
  h.accessor("doc_offering_announcement", {
    id: "doc_offering_announcement",
    header: "发行公告",
    size: 80,
    enableSorting: false,
  }),
  h.accessor("doc_all_announcements", {
    id: "doc_all_announcements",
    header: "所有公告",
    size: 80,
    enableSorting: false,
  }),
];

// 默认可见的列 id
export const DEFAULT_VISIBLE_COLUMNS = new Set([
  "fund_code",
  "fund_name_clean",
  "risk_level",
  "fund_status",
  "fund_domicile",
  "nav",
  "nav_date",
  "perf_1y_pct",
  "perf_ytd_pct",
  "doc_product_summary",
]);

// 可在 ColumnToggle 中显隐的列（代码和名称始终显示）
export const TOGGLEABLE_COLUMNS = ALL_COLUMNS.filter(
  (col) => col.id !== "fund_code" && col.id !== "fund_name_clean",
);

export const TOGGLEABLE_COLUMN_IDS = TOGGLEABLE_COLUMNS.map((col) => col.id!);
