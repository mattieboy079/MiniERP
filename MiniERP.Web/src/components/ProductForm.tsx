import { useState, type FormEvent } from 'react'

export type ProductInput = {
  name: string
  articleNumber: string
  price: number
  costPrice: number
  minimumStock: number | null
  currentStock: number
}

type FieldKey = keyof ProductInput

// Form state keeps every field as a string so inputs can be edited (and left
// blank) freely; values are converted to the typed ProductInput on submit.
type FormState = Record<FieldKey, string>

const EMPTY: FormState = {
  name: '',
  articleNumber: '',
  price: '',
  costPrice: '',
  minimumStock: '',
  currentStock: '',
}

const fields: { key: FieldKey; label: string; kind: 'text' | 'number'; step?: string; optional?: boolean }[] = [
  { key: 'name', label: 'Naam', kind: 'text' },
  { key: 'articleNumber', label: 'Artikelnummer', kind: 'text' },
  { key: 'price', label: 'Prijs (€)', kind: 'number', step: '0.01' },
  { key: 'costPrice', label: 'Kostprijs (€)', kind: 'number', step: '0.01' },
  { key: 'currentStock', label: 'Huidige voorraad', kind: 'number', step: '1' },
  { key: 'minimumStock', label: 'Minimale voorraad', kind: 'number', step: '1', optional: true },
]

function toFormState(initial?: ProductInput): FormState {
  if (!initial) return EMPTY
  return {
    name: initial.name,
    articleNumber: initial.articleNumber,
    price: String(initial.price),
    costPrice: String(initial.costPrice),
    currentStock: String(initial.currentStock),
    minimumStock: initial.minimumStock != null ? String(initial.minimumStock) : '',
  }
}

type Props = {
  initial?: ProductInput
  submitLabel: string
  onSubmit: (values: ProductInput) => Promise<void> | void
  onCancel: () => void
}

function ProductForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<FormState>(() => toFormState(initial))
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        name: values.name,
        articleNumber: values.articleNumber,
        price: Number(values.price) || 0,
        costPrice: Number(values.costPrice) || 0,
        currentStock: Number(values.currentStock) || 0,
        minimumStock: values.minimumStock.trim() === '' ? null : Number(values.minimumStock),
      })
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
            type={f.kind}
            step={f.step}
            required={!f.optional}
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

export default ProductForm
