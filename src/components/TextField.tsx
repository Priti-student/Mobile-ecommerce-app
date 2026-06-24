import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  const fieldId = id ?? props.name

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <input
        id={fieldId}
        className={`input-premium ${
          error ? '!border-red-400 !ring-red-100' : ''
        } ${className}`}
        {...props}
      />
      {error ? <span className="block text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  )
}