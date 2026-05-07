import { useState, useEffect } from 'react'
import { getTodayAttendanceApi, getUserAttendanceApi, getAttendanceEmployeesApi } from '../api/attendance'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'

const LIMIT = 20

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtHours(h) {
  if (h == null) return '—'
  const hrs = parseFloat(h)
  if (isNaN(hrs)) return '—'
  return `${Math.floor(hrs)}h ${Math.round((hrs % 1) * 60)}m`
}

function AttendanceTable({ rows }) {
  if (rows.length === 0) return <EmptyState title="No records found" />
  return (
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
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-3">
                <p className="text-sm font-medium text-slate-800">{r.employee_name}</p>
                <p className="text-xs text-slate-400">ID #{r.employee_id}</p>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{fmt(r.check_in)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{fmt(r.check_out)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{fmtHours(r.working_hours)}</td>
              <td className="px-4 py-3">
                {!r.check_out
                  ? <Badge color="sky">Active</Badge>
                  : r.is_late
                    ? <Badge color="amber">Late</Badge>
                    : <Badge color="green">On Time</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AttendancePage() {
  const [tab, setTab] = useState('today')
  const [todayRows, setTodayRows] = useState([])
  const [todayLoading, setTodayLoading] = useState(true)

  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [historyRows, setHistoryRows] = useState([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getTodayAttendanceApi()
      .then(r => setTodayRows(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load today.'))
      .finally(() => setTodayLoading(false))

    getAttendanceEmployeesApi()
      .then(r => setEmployees(r.data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEmpId) return
    setHistoryLoading(true)
    getUserAttendanceApi(selectedEmpId, LIMIT, offset)
      .then(r => {
        setHistoryRows(r.data.data || [])
        setHistoryTotal(r.data.total || 0)
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load history.'))
      .finally(() => setHistoryLoading(false))
  }, [selectedEmpId, offset])

  const totalPages = Math.ceil(historyTotal / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Attendance</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track check-ins and check-outs</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {['today', 'history'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'today' ? "Today's Attendance" : 'Employee History'}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'today' ? (
          <>
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-800">{todayRows.length} records today</p>
            </div>
            {todayLoading ? <LoadingSpinner /> : <AttendanceTable rows={todayRows} />}
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-medium text-slate-700">Employee:</label>
                <select
                  className="input max-w-xs"
                  value={selectedEmpId}
                  onChange={e => { setSelectedEmpId(e.target.value); setOffset(0) }}
                >
                  <option value="">— Select an employee —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'N/A'})</option>
                  ))}
                </select>
                {selectedEmpId && (
                  <span className="text-xs text-slate-400">{historyTotal} total records</span>
                )}
              </div>
            </div>

            {!selectedEmpId ? (
              <EmptyState title="Select an employee" description="Choose an employee above to view their attendance history." />
            ) : historyLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <AttendanceTable rows={historyRows} />
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <p className="text-sm text-slate-400">Page {currentPage} of {totalPages}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                        disabled={offset === 0}
                        className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                      >← Previous</button>
                      <button
                        onClick={() => setOffset(offset + LIMIT)}
                        disabled={currentPage >= totalPages}
                        className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                      >Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
