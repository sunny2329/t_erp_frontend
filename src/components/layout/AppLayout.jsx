import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* min-w-0 on both flex items below is load-bearing: without it, a
          flex child refuses to shrink below its content's intrinsic width,
          so a wide table (e.g. Dashboard's many-column DataTable) blows out
          this whole column — and the outer flex row with it, dragging the
          sidebar sideways along with the page instead of the table
          scrolling locally within its own overflow-x-auto wrapper. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
        <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
