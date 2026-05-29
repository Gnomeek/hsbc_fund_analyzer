import { useFundData } from './hooks/useFundData'

export default function App() {
  const state = useFundData()
  if (state.status === 'loading') return <div className="p-4">加载中…</div>
  if (state.status === 'error') return <div className="p-4 text-red-500">{state.message}</div>
  return <div className="p-4">已加载 {state.data.length} 条基金数据</div>
}
