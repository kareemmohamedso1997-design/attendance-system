export default function Badge({ children, color = 'slate' }) {
  const variants = {
    green:  'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    red:    'bg-red-50 text-red-700 ring-red-600/20',
    amber:  'bg-amber-50 text-amber-700 ring-amber-600/20',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    slate:  'bg-slate-100 text-slate-700 ring-slate-500/20',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[color]}`}>
      {children}
    </span>
  )
}
