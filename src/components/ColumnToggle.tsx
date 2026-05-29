import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Settings, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { VisibilityState } from '@tanstack/react-table'
import { TOGGLEABLE_COLUMNS } from '@/lib/columns'

const COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  TOGGLEABLE_COLUMNS.map((col) => [col.id!, typeof col.header === 'string' ? col.header : col.id!]),
)

type Props = {
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  columnOrder: string[]
  onColumnOrderChange: (ids: string[]) => void
}

// ----------------------------------------------------------------
// SortableRow
// ----------------------------------------------------------------
function SortableRow({
  id,
  visible,
  onToggle,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  id: string
  visible: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50"
    >
      {/* 桌面端：拖拽把手 */}
      <button
        {...attributes}
        {...listeners}
        className="hidden md:flex text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        tabIndex={-1}
        aria-label="拖动排序"
      >
        <GripVertical size={14} />
      </button>

      {/* 移动端：上下箭头 */}
      <div className="flex flex-col md:hidden shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 touch-manipulation"
          aria-label="上移"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 touch-manipulation"
          aria-label="下移"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* 可见性切换 */}
      <button
        onClick={onToggle}
        className={`shrink-0 transition-colors ${
          visible ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 hover:text-gray-500'
        }`}
        aria-label={visible ? '隐藏列' : '显示列'}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* 列名 */}
      <span className={`text-sm select-none ${visible ? 'text-gray-700' : 'text-gray-400'}`}>
        {COLUMN_LABELS[id] ?? id}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------
// ColumnToggle
// ----------------------------------------------------------------
export function ColumnToggle({
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: Props) {
  const [open, setOpen] = useState(false)

  const sensors = useSensors(
    // 鼠标 / 触控笔：移动 5px 立即触发
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // 触摸屏：长按 200ms 后触发，避免与滚动冲突
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  )

  function toggle(colId: string) {
    onColumnVisibilityChange({ ...columnVisibility, [colId]: !columnVisibility[colId] })
  }

  function move(id: string, direction: -1 | 1) {
    const idx = columnOrder.indexOf(id)
    const next = idx + direction
    if (next < 0 || next >= columnOrder.length) return
    onColumnOrderChange(arrayMove(columnOrder, idx, next))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string)
      const newIndex = columnOrder.indexOf(over.id as string)
      onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex))
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 touch-manipulation">
        <Settings size={15} className="text-gray-400" />
        <span>列配置</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-100">
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-52 flex flex-col max-h-[70vh]">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-1 pb-2 shrink-0">
              列顺序 / 显示
            </p>

            <div className="overflow-y-auto flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                  {columnOrder.map((id, idx) => (
                    <SortableRow
                      key={id}
                      id={id}
                      visible={columnVisibility[id] ?? false}
                      onToggle={() => toggle(id)}
                      onMoveUp={() => move(id, -1)}
                      onMoveDown={() => move(id, 1)}
                      isFirst={idx === 0}
                      isLast={idx === columnOrder.length - 1}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
