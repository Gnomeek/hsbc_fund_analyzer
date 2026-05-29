const RISK_STYLES: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
}

type Props = { value: number }

export function RiskBadge({ value }: Props) {
  const style = RISK_STYLES[value] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${style}`}>
      R{value}
    </span>
  )
}
