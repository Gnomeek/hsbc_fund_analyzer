import { useRef, useEffect, useState } from "react";
import { Field } from "@base-ui/react/field";
import { Popover } from "@base-ui/react/popover";
import type { VisibilityState } from "@tanstack/react-table";
import { Search, ChevronDown, Check } from "lucide-react";
import { ColumnToggle } from "./ColumnToggle";

// ----------------------------------------------------------------
// 筛选常量
// ----------------------------------------------------------------
const RISK_OPTIONS = [1, 2, 3, 4, 5];
const STATUS_OPTIONS = [
  { value: "suspended", label: "暂停申购" },
  { value: "online_only", label: "仅电子渠道" },
  { value: "qdii", label: "QDII" },
];
const DOMICILE_OPTIONS = [
  { value: "Mainland Securities Fund", label: "内地基金" },
  { value: "HK Mutual Recognition Fund", label: "香港互认基金" },
];

// ----------------------------------------------------------------
// FilterBar Props
// ----------------------------------------------------------------
type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  riskLevels: number[];
  onRiskLevelsChange: (v: number[]) => void;
  statuses: string[];
  onStatusesChange: (v: string[]) => void;
  domiciles: string[];
  onDomicilesChange: (v: string[]) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (v: VisibilityState) => void;
  columnOrder: string[];
  onColumnOrderChange: (ids: string[]) => void;
};

// ----------------------------------------------------------------
// MultiSelect — 通用多选下拉组件
// ----------------------------------------------------------------
function MultiSelect<T extends string | number>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
}) {
  function toggle(val: T) {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val],
    );
  }

  const displayLabel =
    selected.length === 0
      ? label
      : selected.length === options.length
        ? `${label}：全部`
        : `${label} (${selected.length})`;

  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 min-w-max">
        <span>{displayLabel}</span>
        <ChevronDown size={13} className="text-gray-400" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-[100]"
        >
          <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-36 z-50">
            {options.map((opt) => (
              <div
                key={String(opt.value)}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 select-none"
              >
                <span
                  className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${
                    selected.includes(opt.value)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {selected.includes(opt.value) ? (
                    <Check size={10} strokeWidth={3} />
                  ) : (
                    ""
                  )}
                </span>
                {opt.label}
              </div>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ----------------------------------------------------------------
// FilterBar — 搜索 + 多维度筛选栏
// ----------------------------------------------------------------
export function FilterBar({
  search,
  onSearchChange,
  riskLevels,
  onRiskLevelsChange,
  statuses,
  onStatusesChange,
  domiciles,
  onDomicilesChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 300ms 防抖上报搜索词
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearchChange(localSearch), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [localSearch, onSearchChange]);

  const hasFilter = !!(
    search ||
    riskLevels.length ||
    statuses.length ||
    domiciles.length
  );

  function clearAll() {
    setLocalSearch("");
    onSearchChange("");
    onRiskLevelsChange([]);
    onStatusesChange([]);
    onDomicilesChange([]);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 搜索框 */}
      <Field.Root className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <span className="pl-3">
          <Search size={15} className="text-gray-400" />
        </span>
        <Field.Control
          value={localSearch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocalSearch(e.target.value)
          }
          placeholder="搜索基金代码或名称…"
          className="px-2 py-1.5 text-sm outline-none bg-transparent w-52"
        />
      </Field.Root>

      {/* 风险等级多选 */}
      <MultiSelect
        label="风险等级"
        options={RISK_OPTIONS.map((r) => ({ value: r, label: `R${r}` }))}
        selected={riskLevels}
        onChange={onRiskLevelsChange}
      />

      {/* 状态多选 */}
      <MultiSelect
        label="状态"
        options={STATUS_OPTIONS}
        selected={statuses}
        onChange={onStatusesChange}
      />

      {/* 归属地多选 */}
      <MultiSelect
        label="类别"
        options={DOMICILE_OPTIONS}
        selected={domiciles}
        onChange={onDomicilesChange}
      />

      {/* 列配置 */}
      <ColumnToggle
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
      />

      {/* 清除筛选 — 有任意筛选条件时显示 */}
      {hasFilter && (
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
