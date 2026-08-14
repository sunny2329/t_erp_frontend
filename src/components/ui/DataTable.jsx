import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

const PAGE_SIZE = 25

// col.filterValue(row) lets a column with a non-text render (badges,
// currency, links) still be matched by its column-search box — falls back
// to the raw field value when not provided.
function cellSearchText(col, row) {
  const value = col.filterValue ? col.filterValue(row) : row[col.key]
  return String(value ?? '')
}

export function DataTable({
  columns,
  rows,
  onRowClick,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  toolbar,
  emptyLabel = 'No records found.',
  columnSearch = true,
}) {
  const [columnFilters, setColumnFilters] = useState({})
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v.trim())
    if (!activeFilters.length) return rows
    return rows.filter((row) =>
      activeFilters.every(([key, value]) => {
        const col = columns.find((c) => c.key === key)
        if (!col) return true
        return cellSearchText(col, row).toLowerCase().includes(value.trim().toLowerCase())
      }),
    )
  }, [rows, columns, columnFilters])

  // Whatever narrowed the result set (external search/filters, or the
  // column-search boxes below) should always land back on page 1 — staying
  // on e.g. page 4 of a now-3-page result set would just show an empty table.
  useEffect(() => {
    setPage(1)
  }, [rows, columnFilters])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const setColumnFilter = (key, value) => setColumnFilters((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
        {onSearchChange && (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        )}
        {toolbar}
      </div>
      {/* Horizontal scroll is the point of this wrapper — cells never wrap
          (whitespace-nowrap below), so a wide/many-column table (e.g.
          Dashboard's) scrolls sideways here instead of squeezing text. */}
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {columns.map((col) => (
                <th key={col.key} className={`whitespace-nowrap px-4 py-2.5 font-medium ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
            {columnSearch && (
              <tr className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
                {columns.map((col) => (
                  <th key={col.key} className={`whitespace-nowrap px-2 py-1.5 font-normal ${col.className || ''}`}>
                    {col.filterable === false ? null : (
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                        <input
                          value={columnFilters[col.key] || ''}
                          onChange={(e) => setColumnFilter(col.key, e.target.value)}
                          placeholder="Filter…"
                          className="w-full min-w-[90px] rounded border border-slate-200 bg-white py-1 pl-5 pr-1.5 text-[11px] font-normal normal-case text-slate-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800/60 ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`whitespace-nowrap px-4 py-3 align-middle text-slate-700 dark:text-slate-300 ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span>Page {currentPage} of {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
