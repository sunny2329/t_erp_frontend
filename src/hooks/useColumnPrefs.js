import { useEffect, useMemo, useState } from 'react'

function readStored(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Column visibility + order, persisted to localStorage — mirrors the
// reference Loadx-Youngs-Frontend's useReportColumns hook: every column is
// visible by default, the user can hide/reorder any of them via
// ColumnManager, and the choice is remembered per-browser (not per-account
// — there's no server-side "saved view" concept here, same as the
// reference, which also only ever writes to localStorage).
export function useColumnPrefs(columns, storageKey) {
  const allKeys = columns.map((c) => c.key)
  // Stable across renders as long as the actual set of keys hasn't changed,
  // even though `columns` (and therefore `allKeys`) is a brand-new array
  // every render — lets the reconcile effect below depend on content, not
  // array identity, without needing to memoize `columns` itself.
  const keysSignature = allKeys.join('|')
  const columnMap = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns])

  const [order, setOrder] = useState(() => {
    const stored = readStored(storageKey)
    const storedOrder = Array.isArray(stored?.order) ? stored.order.filter((k) => allKeys.includes(k)) : []
    const missing = allKeys.filter((k) => !storedOrder.includes(k))
    return [...storedOrder, ...missing]
  })
  const [hidden, setHidden] = useState(() => {
    const stored = readStored(storageKey)
    const storedHidden = Array.isArray(stored?.hidden) ? stored.hidden : []
    return new Set(storedHidden.filter((k) => allKeys.includes(k)))
  })

  // If the column definitions themselves change (a column added/removed in
  // code), reconcile: keep the user's existing order/hidden choices for
  // still-known keys, append any newly-added columns at the end visible.
  useEffect(() => {
    const currentKeys = keysSignature.split('|')
    setOrder((prev) => {
      const kept = prev.filter((k) => currentKeys.includes(k))
      const added = currentKeys.filter((k) => !kept.includes(k))
      return added.length || kept.length !== prev.length ? [...kept, ...added] : prev
    })
    setHidden((prev) => {
      const next = new Set([...prev].filter((k) => currentKeys.includes(k)))
      return next.size === prev.size ? prev : next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ order, hidden: [...hidden] }))
  }, [storageKey, order, hidden])

  const toggleColumn = (key) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const moveColumn = (key, direction) => {
    setOrder((prev) => {
      const idx = prev.indexOf(key)
      const target = idx + direction
      if (idx === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // Drag-and-drop reorder — moves the column at fromIndex to sit at
  // toIndex, shifting everything between. Indices are positions within
  // `orderedColumns`/`order` (same order, one-to-one), which is what
  // ColumnManager's drag handlers work with directly.
  const reorderColumn = (fromIndex, toIndex) => {
    setOrder((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const reset = () => {
    setOrder(allKeys)
    setHidden(new Set())
  }
  const showAll = () => setHidden(new Set())

  const orderedColumns = order.map((k) => columnMap[k]).filter(Boolean)
  const activeColumns = orderedColumns.filter((c) => !hidden.has(c.key))

  return { orderedColumns, activeColumns, hidden, toggleColumn, moveColumn, reorderColumn, reset, showAll }
}
