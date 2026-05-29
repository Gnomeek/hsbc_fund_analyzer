# HSBC 代销基金汇总

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/hsbc-cn-funds)


**Live demo:** https://ibkr-stats.vercel.app/

> 汇丰中国代销基金的可视化分析工具，支持多维度筛选、业绩对比与文件直链。

---

## 功能

| 功能 | 说明 |
|------|------|
| 实时筛选 | 按基金代码 / 名称搜索，支持风险等级、认购状态、归属地多选过滤 |
| 业绩列 | 1日、1月、3月、6月、1年、YTD 及 2021–2025 年度收益，涨跌色彩标注 |
| 列配置 | 拖拽调整列顺序，一键显示 / 隐藏任意列，偏好持久化到 localStorage |
| 文件直链 | 招募说明书、年报、季报、基金合同等文件一键打开 |
| 雪球跳转 | 基金代码列带外链图标，直达雪球行情页 |
| 虚拟列表 | 基于 `@tanstack/react-virtual` 渲染，千条数据流畅滚动 |

---

## 数据来源

数据来自汇丰中国代销基金查询页面：

- [汇丰基金搜索易](https://fundsresearch.investments.hsbc.com.cn/rbwm/QuickRank.aspx)
- [代销产品信息 PDF](https://www.hsbc.com.cn/content/dam/hsbc/cn/docs/transfers/sales-agency-product-info-ut.pdf)

脚本 `script/` 目录下的 Python 脚本负责从 HTML 导出 `public/funds.csv`。

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 格式化代码
npm run format

# 构建生产包
npm run build
```

---

## 技术栈

- **框架**：React 19 + TypeScript + Vite
- **样式**：Tailwind CSS v4
- **表格**：@tanstack/react-table + @tanstack/react-virtual
- **拖拽**：@dnd-kit/sortable
- **UI 组件**：@base-ui/react
- **图标**：lucide-react
- **部署**：Vercel（含 Analytics + Speed Insights）
