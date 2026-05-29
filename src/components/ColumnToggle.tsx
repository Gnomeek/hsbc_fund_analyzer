import * as Popover from '@base-ui/react/popover'
import * as Checkbox from '@base-ui/react/checkbox'
import type { VisibilityState } from '@tanstack/react-table'
import { TOGGLEABLE_COLUMNS } from '../lib/columns'

// ----------------------------------------------------------------
// 类型定义
// ----------------------------------------------------------------
type Props = {
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
}

// ----------------------------------------------------------------
// 列 id → 显示标题映射（从列定义提取，避免 columnDef.header 类型转换）
// ----------------------------------------------------------------
const COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  TOGGLEABLE_COLUMNS.map(col => [
    col.id!,
    typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id!,
  ])
)

// ----------------------------------------------------------------
// ColumnToggle — 列可见性配置弹窗
// ----------------------------------------------------------------
export function ColumnToggle({ columnVisibility, onColumnVisibilityChange }: Props) {
  function toggle(colId: string) {
    onColumnVisibilityChange({
      ...columnVisibility,
      [colId]: !columnVisibility[colId],
    })
  }

  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700">
        <span>列配置</span>
        <span className="text-gray-400">⚙</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6}>
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-52 z-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">显示列</p>
            <div className="flex flex-col gap-1.5">
              {TOGGLEABLE_COLUMNS.map(col => {
                const id = col.id!
                const visible = columnVisibility[id] ?? false
                return (
                  <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox.Root
                      checked={visible}
                      onCheckedChange={() => toggle(id)}
                      className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center data-[checked]:bg-blue-600 data-[checked]:border-blue-600 transition-colors"
                    >
                      <Checkbox.Indicator className="text-white text-xs">✓</Checkbox.Indicator>
                    </Checkbox.Root>
                    <span className="text-sm text-gray-700">{COLUMN_LABELS[id]}</span>
                  </label>
                )
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
