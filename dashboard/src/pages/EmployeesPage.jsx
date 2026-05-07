import { useState, useEffect, useCallback } from 'react'
import { addEmployeeApi, getAllEmployeesApi, deleteEmployeeApi } from '../api/auth'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'

const EMPTY_FORM = {
  name: '', email: '', department: '', position: '', phone: '', hire_date: '',
}

// ── Copy button — shows transient "Copied!" feedback ──────────────────────────
function CopyButton({ value, label, block = false }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (HTTP context) — fallback ignored
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        block ? 'w-full justify-center' : ''
      } ${
        copied
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

// ── Credentials modal ─────────────────────────────────────────────────────────
function CredentialsModal({ credentials, onClose }) {
  if (!credentials) return null

  const { employee, login } = credentials
  const allText =
    `Name: ${employee?.name}\nUsername: ${login?.username}\nPassword: ${login?.password}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800">Employee Created Successfully</h3>
            <p className="text-xs text-slate-400 mt-0.5">Share these credentials with the employee</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {/* Name */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">
              Employee Name
            </p>
            <p className="font-semibold text-slate-800 text-base">{employee?.name}</p>
          </div>

          {/* Username */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Username</p>
              <CopyButton value={login?.username ?? ''} label="Copy Username" />
            </div>
            <p className="font-mono font-bold text-indigo-700 text-lg tracking-wider break-all">
              {login?.username}
            </p>
          </div>

          {/* Password */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Temporary Password
              </p>
              <CopyButton value={login?.password ?? ''} label="Copy Password" />
            </div>
            <p className="font-mono font-bold text-indigo-700 text-lg tracking-wider break-all">
              {login?.password}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <svg
              className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            <p className="text-amber-700 text-xs leading-relaxed">
              This temporary password should be changed after first login.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <CopyButton value={allText} label="Copy All Credentials" block />
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ target, deleting, onConfirm, onCancel }) {
  if (!target) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800 text-center mb-2">
          Delete Employee?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          This will permanently delete{' '}
          <strong className="text-slate-700">{target.name}</strong> and their login
          account. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 3500)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm ${
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-75 hover:opacity-100 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [form, setForm]           = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  const [credentials, setCredentials] = useState(null)   // success modal payload
  const [employees, setEmployees]     = useState([])
  const [listLoading, setListLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState(null)  // { id, name }
  const [deleting, setDeleting]         = useState(false)
  const [toast, setToast]               = useState(null)  // { message, type }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const loadEmployees = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await getAllEmployeesApi()
      setEmployees(res.data.data || [])
    } catch { /* silent — auth interceptor handles token issues */ }
    finally { setListLoading(false) }
  }, [])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // ── Create employee ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.department.trim() || !form.position.trim()) {
      setFormError('Name, email, department, and position are required.')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      const payload = { ...form }
      if (!payload.phone)     delete payload.phone
      if (!payload.hire_date) delete payload.hire_date

      const res = await addEmployeeApi(payload)
      setCredentials(res.data.data)   // open credentials modal
      setForm(EMPTY_FORM)             // clear form
      await loadEmployees()           // refresh list
    } catch (err) {
      const status = err.response?.status
      const msg    = (err.response?.data?.message || '').toLowerCase()

      if (status === 409) {
        setFormError(
          msg.includes('email') && msg.includes('login')
            ? 'A login account with this email already exists.'
            : 'An employee with this email address already exists.'
        )
      } else if (status === 422) {
        // express-validator errors — take the first field message
        const first = err.response?.data?.errors?.[0]
        setFormError(first ? `${first.field}: ${first.message}` : 'Validation failed.')
      } else {
        setFormError(err.response?.data?.message || 'Failed to create employee. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete employee ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteEmployeeApi(deleteTarget.id)
      // Optimistic: remove from state immediately; no need to refetch
      setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id))
      showToast(`"${deleteTarget.name}" has been deleted.`)
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to delete employee. Please try again.',
        'error'
      )
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Modals */}
      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
      <DeleteModal
        target={deleteTarget}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Employees</h1>
        <p className="text-sm text-slate-400 mt-0.5">Add new employees and manage the team</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Add Employee Form ── */}
        <div className="xl:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: 'name',       label: 'Full Name',            placeholder: 'John Smith',         required: true },
                  { name: 'email',      label: 'Email Address',        placeholder: 'john@company.com',   required: true, type: 'email' },
                  { name: 'department', label: 'Department',           placeholder: 'Engineering',        required: true },
                  { name: 'position',   label: 'Position / Role',      placeholder: 'Software Developer', required: true },
                  { name: 'phone',      label: 'Phone (optional)',      placeholder: '+1 555 0100' },
                  { name: 'hire_date',  label: 'Hire Date (optional)',  type: 'date' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      className="input"
                      disabled={submitting}
                    />
                  </div>
                ))}
              </div>

              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Employee
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Employees Table ── */}
        <div className="xl:col-span-3 card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">All Employees</h2>
              <p className="text-xs text-slate-400 mt-0.5">{employees.length} total</p>
            </div>
            <button
              onClick={loadEmployees}
              disabled={listLoading}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Refresh
            </button>
          </div>

          {listLoading ? (
            <LoadingSpinner />
          ) : employees.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No employees yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 table-header">Name</th>
                    <th className="text-left px-4 py-3 table-header">Email</th>
                    <th className="text-left px-4 py-3 table-header">Department</th>
                    <th className="text-left px-4 py-3 table-header">Status</th>
                    <th className="px-4 py-3 table-header w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-semibold">
                              {emp.name?.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                            <p className="text-xs text-slate-400">{emp.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{emp.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{emp.department || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color={emp.status === 'active' || !emp.status ? 'green' : 'red'}>
                          {emp.status || 'active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget({ id: emp.id, name: emp.name })}
                          title={`Delete ${emp.name}`}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
