import { useState } from 'react'
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { Drawer } from './Drawer'
import { Button } from './Button'

// Show/hide + reorder columns, matching the reference Loadx-Youngs-Frontend's
// ColumnManager. Reordering works two ways: drag the grip handle (native
// HTML5 drag-and-drop, no extra library), or the up/down buttons — kept
// alongside drag so reordering stays possible without a mouse.
export function ColumnManager({ open, onClose, orderedColumns, hidden, onToggle, onMove, onReorder, onReset, onShowAll }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDrop = (index) => {
    if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index)
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Manage Columns"
      subtitle="Drag to reorder, or use the arrows — saved on this browser"
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={onShowAll}>Show All</Button>
          <Button variant="secondary" onClick={onReset}>Reset to Default</Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-1.5">
        {orderedColumns.map((col, i) => (
          <div
            key={col.key}
            draggable
            onDragStart={(e) => {
              setDragIndex(i)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (overIndex !== i) setOverIndex(i)
            }}
            onDragLeave={() => setOverIndex((prev) => (prev === i ? null : prev))}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(i)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${
              overIndex === i && dragIndex !== null && dragIndex !== i
                ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-800'
            } ${dragIndex === i ? 'opacity-40' : ''}`}
          >
            <span className="cursor-grab text-slate-300 active:cursor-grabbing dark:text-slate-600" title="Drag to reorder">
              <GripVertical className="h-4 w-4" />
            </span>
            <input
              type="checkbox"
              checked={!hidden.has(col.key)}
              onChange={() => onToggle(col.key)}
              className="h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{col.header}</span>
            <button
              type="button"
              onClick={() => onMove(col.key, -1)}
              disabled={i === 0}
              title="Move up"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(col.key, 1)}
              disabled={i === orderedColumns.length - 1}
              title="Move down"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Drawer>
  )
}
