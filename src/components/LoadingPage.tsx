type Props = {
  loaded?: number
  total?: number | null
}

export function LoadingPage({ loaded, total }: Props) {
  const hasProgress = loaded != null
  const pct = hasProgress && total ? Math.min(Math.round((loaded / total) * 100), 99) : null

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white select-none">
      {/* 品牌 */}
      <div className="flex items-center gap-3 mb-10">
        <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded tracking-widest">
          HSBC
        </span>
        <span className="text-2xl font-semibold text-gray-800 tracking-tight">基金快车</span>
      </div>

      {/* 进度条容器 */}
      <div className="w-72 flex flex-col gap-3">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          {pct != null ? (
            /* 确定进度 */
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          ) : (
            /* 不确定进度 — 扫光动画 */
            <div className="h-full w-full relative overflow-hidden bg-gray-100">
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[shimmer_1.4s_ease-in-out_infinite]" />
            </div>
          )}
        </div>

        {/* 文字状态 */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          {hasProgress && loaded! > 0 ? (
            <>
              <span>已加载 {loaded} 只基金{total ? `，共约 ${total} 只` : ''}</span>
              {pct != null && <span>{pct}%</span>}
            </>
          ) : (
            <span className="animate-pulse">正在连接数据源…</span>
          )}
        </div>
      </div>

      {/* 免责小字 */}
      <p className="absolute bottom-8 text-[11px] text-gray-300 text-center px-8">
        数据来源：汇丰中国官网 · 仅供参考，不构成投资建议
      </p>
    </div>
  )
}
