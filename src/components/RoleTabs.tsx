import type { UserRole } from '@/types/auth'

interface RoleTabsProps {
  value: UserRole
  onChange: (role: UserRole) => void
}

export function RoleTabs({ value, onChange }: RoleTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5">
      <button
        type="button"
        onClick={() => onChange('customer')}
        className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
          value === 'customer'
            ? 'bg-white text-brand-500 shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        🙋 Customer
      </button>
      <button
        type="button"
        onClick={() => onChange('vendor')}
        className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
          value === 'vendor'
            ? 'bg-white text-brand-500 shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        🏪 Vendor
      </button>
    </div>
  )
}