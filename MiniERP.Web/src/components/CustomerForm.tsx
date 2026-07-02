import { useState, type FormEvent } from 'react'

export type CustomerInput = {
  name: string
  contactName: string
  email: string
  phone: string
  address: string
}

const EMPTY: CustomerInput = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
}

type Props = {
  initial?: CustomerInput
  submitLabel: string
  onSubmit: (values: CustomerInput) => Promise<void> | void
  onCancel: () => void
}

const fields: { key: keyof CustomerInput; label: string; type?: string }[] = [
  { key: 'name', label: 'Naam' },
  { key: 'contactName', label: 'Contactpersoon' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Telefoon' },
  { key: 'address', label: 'Adres' },
]

function CustomerForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<CustomerInput>(initial ?? EMPTY)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {fields.map((f) => (
        <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#444' }}>{f.label}</span>
          <input
            type={f.type ?? 'text'}
            required
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            style={{ padding: '0.4rem', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </label>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Annuleren
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Bezig…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default CustomerForm
