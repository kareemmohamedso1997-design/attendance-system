import { useState, useEffect } from 'react'
import { getSummaryApi, getUserReportApi } from '../api/reports'
import { getAttendanceEmployeesApi } from '../api/attendance'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'

function fmt(dt) {
  if (!dt) return 'N/A'
  return new Date(dt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    getSummaryApi()
      .then(r => setSummary(r.data.data))
      .finally(() => setSummaryLoading(false))

    getAttendanceEmployeesApi()
      .then(r => setEmployees(r.data.data || []))
      .catch(() => {})
  }, [])

  const generateReport = async () => {
    if (!selectedId) return
    setReportLoading(true)
    setReportError('')
    setReport(null)
    try {
      const res = await getUserReportApi(selectedId)
      setReport(res.data.data)
    } catch (e) {
      setReportError(e.response?.data?.message || 'Failed to generate report.')
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">System overview and per-employee analytics</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">System Summary</h2>
        {summaryLoading ? <LoadingSpinner text="Loading summary..." /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Active Employees" value={summary?.active_employees} color="indigo"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard label="Today's Check-ins" value={summary?.today_checkins_count} color="emerald"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
            <StatCard label="Currently In Office" value={summary?.currently_checked_in} color="sky"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard label="All-Time Records" value={summary?.total_attendance_records} color="amber" sub="All time"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
          </div>
        )}
      </div>

      {/* Per-employee report */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Per-Employee Report</h2>
        <div className="card p-6">
          <div className="flex gap-3 flex-wrap items-end mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Employee</label>
              <select className="input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                <option value="">— Choose an employee —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.department || 'N/A'}</option>
                ))}
              </select>
            </div>
            <button onClick={generateReport} className="btn-primary" disabled={!selectedId || reportLoading}>
              {reportLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Generate Report</>
              )}
            </button>
          </div>

          {reportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">{reportError}</div>
          )}

          {report && (
            <div className="space-y-6">
              {/* Employee info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-sm">
                    {report.employee?.name?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{report.employee?.name}</p>
                  <p className="text-sm text-slate-500">{report.employee?.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge color="indigo">{report.employee?.department || 'N/A'}</Badge>
                    <Badge color="slate">{report.employee?.position || 'N/A'}</Badge>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Days Worked', value: report.stats?.total_days_worked ?? 0, color: 'indigo' },
                  { label: 'Total Hours', value: `${report.stats?.total_hours_worked ?? 0}h`, color: 'emerald' },
                  { label: 'Overtime Hours', value: `${report.stats?.total_overtime_hours ?? 0}h`, color: 'amber' },
                  { label: 'Late Days', value: report.stats?.late_days ?? 0, color: 'rose' },
                  { label: 'Last Check-in', value: fmt(report.stats?.last_check_in), color: 'sky', small: true },
                  { label: 'Last Check-out', value: fmt(report.stats?.last_check_out), color: 'slate', small: true },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
                    <p className={`font-bold ${s.small ? 'text-sm text-slate-700' : 'text-2xl text-slate-800'}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!report && !reportLoading && !reportError && (
            <div className="text-center py-12 text-slate-400 text-sm">
              Select an employee and click "Generate Report" to see analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
