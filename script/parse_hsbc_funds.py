#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["beautifulsoup4", "lxml"]
# ///

"""
uv run parse_hsbc_funds.py <input.html> [output.csv]
"""

import re
import sys
import csv
from dataclasses import dataclass, fields, astuple
from pathlib import Path
from bs4 import BeautifulSoup


@dataclass
class FundRecord:
    fund_code: str
    fund_name: str
    fund_name_clean: str   # fund name stripped of status annotations
    fund_status: str       # subscription status flags, comma-separated
    fund_detail_url: str   # link to fund detail page
    fund_domicile: str     # "HK Mutual Recognition Fund" | "Mainland Securities Fund"
    risk_level: str
    nav: str
    nav_date: str
    perf_1d_pct: str
    perf_1m_pct: str
    perf_3m_pct: str
    perf_6m_pct: str
    perf_1y_pct: str
    perf_ytd_pct: str
    annual_return_date: str
    annual_return_2021_pct: str
    annual_return_2022_pct: str
    annual_return_2023_pct: str
    annual_return_2024_pct: str
    annual_return_2025_pct: str
    doc_prospectus: str
    doc_annual_report: str
    doc_quarterly_report: str
    doc_semi_annual_report: str
    doc_monthly_report: str
    doc_fund_contract: str
    doc_product_summary: str
    doc_offering_announcement: str
    doc_all_announcements: str
    xueqiu_link: str


# HTML title attribute → dataclass field name
DOC_TITLE_MAP = {
    "基金招募说明书": "doc_prospectus",
    "年报":          "doc_annual_report",
    "季报":          "doc_quarterly_report",
    "半年报":        "doc_semi_annual_report",
    "月报":          "doc_monthly_report",
    "基金合同":      "doc_fund_contract",
    "产品概要":      "doc_product_summary",
    "发售公告":      "doc_offering_announcement",
    "全部公告":      "doc_all_announcements",
}


def cell_text(td) -> str:
    """提取 td 的纯文本，'-' 和空白统一为空字符串。"""
    text = td.get_text(strip=True)
    return "" if text in ("-", "") else text


def parse_row(tr) -> FundRecord:
    tds = tr.find_all("td", recursive=False)

    # --- 基本字段 (按列顺序) ---
    fund_code   = tds[0].find("a").get_text(strip=True)
    fund_name   = tds[1].get_text(strip=True)
    detail_url  = tds[1].find("a").get("href", "")

    # 状态标注映射：中文原文 → snake_case 英文
    STATUS_MAP = {
        "仅电子渠道": "online_only",
        "暂停申购":   "suspended",
    }
    # QDII 出现在名称中间括号里，单独识别
    QDII_PAT = re.compile(r'[（(](QDII(?:-FOF)?)[）)]')

    statuses  = []
    name_work = fund_name

    # 1. 方括号前缀 [仅电子渠道]
    bm = re.match(r'^\[([^\]]+)\](.*)', name_work)
    if bm and bm.group(1) in STATUS_MAP:
        statuses.append(STATUS_MAP[bm.group(1)])
        name_work = bm.group(2).strip()

    # 2. QDII / QDII-FOF 括号（可出现在名称任意位置，剥离后保留其余名称）
    if QDII_PAT.search(name_work):
        statuses.append("qdii")
        name_work = QDII_PAT.sub("", name_work).strip().strip("-").strip()

    # 3. 尾部圆括号状态（暂停申购）
    pm = re.search(r'[（(]([^）)]+)[）)]$', name_work)
    if pm and pm.group(1) in STATUS_MAP:
        statuses.append(STATUS_MAP[pm.group(1)])
        name_work = name_work[:pm.start()].strip()

    name_core   = name_work
    status_note = ",".join(statuses)

    risk_level = cell_text(tds[2])
    nav        = cell_text(tds[3])
    nav_date   = cell_text(tds[4])

    perf_1d    = cell_text(tds[5])
    perf_1m    = cell_text(tds[6])
    perf_3m    = cell_text(tds[7])
    perf_6m    = cell_text(tds[8])
    perf_1y    = cell_text(tds[9])
    perf_ytd   = cell_text(tds[10])

    ret_date   = cell_text(tds[11])
    ret_2021   = cell_text(tds[12])
    ret_2022   = cell_text(tds[13])
    ret_2023   = cell_text(tds[14])
    ret_2024   = cell_text(tds[15])
    ret_2025   = cell_text(tds[16])

    doc_td = tds[17]
    docs = {k: "" for k in DOC_TITLE_MAP.values()}
    for a in doc_td.find_all("a", title=True):
        title = a["title"]
        href  = a.get("href", "")
        field = DOC_TITLE_MAP.get(title)
        if field and href:
            docs[field] = href

    return FundRecord(
        fund_code=fund_code,
        fund_name=fund_name,
        fund_name_clean=name_core,
        fund_status=status_note,
        fund_detail_url=detail_url,
        fund_domicile="HK Mutual Recognition Fund" if fund_code.startswith("968") else "Mainland Securities Fund",
        risk_level=risk_level,
        nav=nav,
        nav_date=nav_date,
        perf_1d_pct=perf_1d,
        perf_1m_pct=perf_1m,
        perf_3m_pct=perf_3m,
        perf_6m_pct=perf_6m,
        perf_1y_pct=perf_1y,
        perf_ytd_pct=perf_ytd,
        annual_return_date=ret_date,
        annual_return_2021_pct=ret_2021,
        annual_return_2022_pct=ret_2022,
        annual_return_2023_pct=ret_2023,
        annual_return_2024_pct=ret_2024,
        annual_return_2025_pct=ret_2025,
        **docs,
        xueqiu_link=f"https://danjuanfunds.com/funding/{fund_code}" if not fund_code.startswith("968") else "",
    )


def parse_html(html_path: Path) -> list[FundRecord]:
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8", errors="replace"), "lxml")
    rows = soup.find_all("tr", id=lambda v: v and "trQuickRankItem" in v)
    return [parse_row(tr) for tr in rows]


def write_csv(records: list[FundRecord], out_path: Path) -> None:
    header = [f.name for f in fields(FundRecord)]
    with out_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(astuple(r) for r in records)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    html_path = Path(sys.argv[1])
    out_path  = Path(sys.argv[2]) if len(sys.argv) > 2 else html_path.with_suffix(".csv")

    records = parse_html(html_path)
    write_csv(records, out_path)


if __name__ == "__main__":
    main()
