import { useState, useEffect } from 'react'
import { getSummaryApi } from '../api/reports'
import { getTodayAttendanceApi } from '../api/attendance'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtHours(h) {
  if (h == null) return '—'
  const hrs = parseFloat(h)
  if (isNaN(hrs)) return '—'
  const hh = Math.floor(hrs)
  const mm = Math.round((hrs - hh) * 60)
  return `${hh}h ${mm}m`
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [todayRows, setTodayRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [sRes, tRes] = await Promise.all([getSummaryApi(), getTodayAttendanceApi()])
      setSummary(sRes.data.data)
      setTodayRows(tRes.data.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner text="Loading dashboard..." />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Active Employees"
              value={summary?.active_employees}
              color="indigo"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard
              label="Today's Check-ins"
              value={summary?.today_checkins_count}
              color="emerald"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
            <StatCard
              label="Currently In Office"
              value={summary?.currently_checked_in}
              color="sky"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Total Records"
              value={summary?.total_attendance_records}
              color="amber"
              sub="All time"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
          </div>

          {/* Today attendance table */}
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Today's Attendance</h2>
                <p className="text-xs text-slate-400 mt-0.5">{todayRows.length} records</p>
              </div>
              {summary?.generated_at && (
                <span className="text-xs text-slate-400">
                  Updated {new Date(summary.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {todayRows.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No attendance records for today.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 table-header">Employee</th>
                      <th className="text-left px-4 py-3 table-header">Check-in</th>
                      <th className="text-left px-4 py-3 table-header">Check-out</th>
                      <th className="text-left px-4 py-3 table-header">Duration</th>
                      <th className="text-left px-4 py-3 table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todayRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-slate-800">{row.employee_name}</p>
                          <p className="text-xs text-slate-400">ID #{row.employee_id}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{fmt(row.check_in)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{fmt(row.check_out)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{fmtHours(row.working_hours)}</td>
                        <td className="px-4 py-3">
                          {row.check_out ? (
                            <Badge color={row.is_late ? 'amber' : 'green'}>
                              {row.is_late ? 'Late' : 'On Time'}
                            </Badge>
                          ) : (
                            <Badge color="sky">Active</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
