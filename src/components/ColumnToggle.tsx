import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Settings, GripVertical, Eye, EyeOff } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { VisibilityState } from "@tanstack/react-table";
import { TOGGLEABLE_COLUMNS } from "../lib/columns";

// ----------------------------------------------------------------
// 列 id → 显示标题映射
// ----------------------------------------------------------------
const COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  TOGGLEABLE_COLUMNS.map((col) => [
    col.id!,
    typeof col.header === "string" ? col.header : col.id!,
  ]),
);

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
type Props = {
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (v: VisibilityState) => void;
  columnOrder: string[];
  onColumnOrderChange: (ids: string[]) => void;
};

// ----------------------------------------------------------------
// SortableRow — 单行（可拖拽 + 可见性切换）
// ----------------------------------------------------------------
function SortableRow({
  id,
  visible,
  onToggle,
}: {
  id: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 group"
    >
      {/* 拖拽把手 */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        tabIndex={-1}
        aria-label="拖动排序"
      >
        <GripVertical size={14} />
      </button>

      {/* 可见性切换 */}
      <button
        onClick={onToggle}
        className={`flex-shrink-0 transition-colors ${
          visible
            ? "text-blue-600 hover:text-blue-800"
            : "text-gray-300 hover:text-gray-500"
        }`}
        aria-label={visible ? "隐藏列" : "显示列"}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* 列名 */}
      <span
        className={`text-sm select-none ${visible ? "text-gray-700" : "text-gray-400"}`}
      >
        {COLUMN_LABELS[id] ?? id}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------
// ColumnToggle — 列配置弹窗（排序 + 显隐）
// ----------------------------------------------------------------
export function ColumnToggle({
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function toggle(colId: string) {
    onColumnVisibilityChange({
      ...columnVisibility,
      [colId]: !columnVisibility[colId],
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex));
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700">
        <Settings size={15} className="text-gray-400" />
        <span>列配置</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-[100]"
        >
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-1 pb-2">
              列顺序 / 显示
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder}
                strategy={verticalListSortingStrategy}
              >
                {columnOrder.map((id) => (
                  <SortableRow
                    key={id}
                    id={id}
                    visible={columnVisibility[id] ?? false}
                    onToggle={() => toggle(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
