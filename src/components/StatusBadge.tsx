const STATUS_MAP: Record<string, { label: string; className: string }> = {
  suspended:    { label: '暂停申购',   className: 'bg-gray-100 text-gray-600' },
  online_only:  { label: '仅电子渠道', className: 'bg-blue-100 text-blue-700' },
  qdii:         { label: 'QDII',       className: 'bg-purple-100 text-purple-700' },
}

type Props = { value: string }

export function StatusBadge({ value }: Props) {
  if (!value) return null
  const parts = value.split(',').map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map(part => {
        const cfg = STATUS_MAP[part]
        if (!cfg) return null
        return (
          <span key={part} className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.className}`}>
            {cfg.label}
          </span>
        )
      })}
    </div>
  )
}
