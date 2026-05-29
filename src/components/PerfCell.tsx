type Props = { value: number | null }

export function PerfCell({ value }: Props) {
  if (value === null) return <span className="text-gray-400">—</span>
  const color = value >= 0 ? 'text-green-600' : 'text-red-500'
  const sign = value >= 0 ? '+' : ''
  return <span className={color}>{sign}{value.toFixed(2)}%</span>
}
