import { useState, type FormEvent } from 'react'

export type QuoteLineInput = {
  productId: number
  quantity: number
  lineDiscountPercent: number
}

export type QuoteInput = {
  customerId: number
  validUntil: string | null // yyyy-mm-dd, or null to let the server default to +30 days
  overallDiscountPercent: number
  lines: QuoteLineInput[]
}

export type CustomerOption = { id: number; name: string }
export type ProductOption = { id: number; name: string; price: number }

// The server is authoritative; this mirrors the fixed rate only for the live preview.
const VAT_RATE = 21

const money = (n: number) => `€ ${n.toFixed(2)}`

type Props = {
  customers: CustomerOption[]
  products: ProductOption[]
  initial?: QuoteInput
  submitLabel: string
  onSubmit: (values: QuoteInput) => Promise<void> | void
  onCancel: () => void
}

function QuoteForm({ customers, products, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [customerId, setCustomerId] = useState<number>(initial?.customerId ?? 0)
  const [validUntil, setValidUntil] = useState<string>(initial?.validUntil ?? '')
  const [overallDiscount, setOverallDiscount] = useState<string>(
    initial ? String(initial.overallDiscountPercent) : '0',
  )
  const [lines, setLines] = useState<QuoteLineInput[]>(
    initial?.lines ?? [{ productId: products[0]?.id ?? 0, quantity: 1, lineDiscountPercent: 0 }],
  )
  const [submitting, setSubmitting] = useState(false)

  const priceOf = (productId: number) => products.find((p) => p.id === productId)?.price ?? 0
  const lineNet = (l: QuoteLineInput) => l.quantity * priceOf(l.productId) * (1 - l.lineDiscountPercent / 100)

  const subtotal = lines.reduce((sum, l) => sum + lineNet(l), 0)
  const discountPct = Number(overallDiscount) || 0
  const discountedSubtotal = subtotal * (1 - discountPct / 100)
  const vatAmount = discountedSubtotal * (VAT_RATE / 100)
  const total = discountedSubtotal + vatAmount

  const updateLine = (index: number, patch: Partial<QuoteLineInput>) =>
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  const addLine = () =>
    setLines((current) => [...current, { productId: products[0]?.id ?? 0, quantity: 1, lineDiscountPercent: 0 }])

  const removeLine = (index: number) => setLines((current) => current.filter((_, i) => i !== index))

  const valid =
    customerId > 0 && lines.length > 0 && lines.every((l) => l.productId > 0 && l.quantity >= 1)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    try {
      await onSubmit({
        customerId,
        validUntil: validUntil.trim() === '' ? null : validUntil,
        overallDiscountPercent: discountPct,
        lines,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
  const captionStyle = { fontSize: '0.85rem', color: '#444' }
  const inputStyle = { padding: '0.4rem', border: '1px solid #ccc', borderRadius: 4 }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={labelStyle}>
        <span style={captionStyle}>Klant</span>
        <select
          required
          value={customerId}
          onChange={(e) => setCustomerId(Number(e.target.value))}
          style={inputStyle}
        >
          <option value={0} disabled>
            — kies een klant —
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        <span style={captionStyle}>Geldig tot (leeg = 30 dagen na nu)</span>
        <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={inputStyle} />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={captionStyle}>Regels</span>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <select
              value={l.productId}
              onChange={(e) => updateLine(i, { productId: Number(e.target.value) })}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value={0} disabled>
                — kies product —
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({money(p.price)})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              step={1}
              value={l.quantity}
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
              title="Aantal"
              style={{ ...inputStyle, width: 64 }}
            />
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={l.lineDiscountPercent}
              onChange={(e) => updateLine(i, { lineDiscountPercent: Number(e.target.value) || 0 })}
              title="Korting %"
              style={{ ...inputStyle, width: 72 }}
            />
            <span style={{ width: 90, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {money(lineNet(l))}
            </span>
            <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} title="Regel verwijderen">
              ✕
            </button>
          </div>
        ))}
        <div>
          <button type="button" onClick={addLine}>
            Regel toevoegen
          </button>
        </div>
      </div>

      <label style={labelStyle}>
        <span style={captionStyle}>Korting over totaal (%)</span>
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={overallDiscount}
          onChange={(e) => setOverallDiscount(e.target.value)}
          style={inputStyle}
        />
      </label>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>
        <Row label="Subtotaal" value={money(subtotal)} />
        {discountPct > 0 && <Row label={`Na korting (${discountPct}%)`} value={money(discountedSubtotal)} />}
        <Row label={`BTW (${VAT_RATE}%)`} value={money(vatAmount)} />
        <Row label="Totaal" value={money(total)} strong />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Annuleren
        </button>
        <button type="submit" disabled={submitting || !valid}>
          {submitting ? 'Bezig…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.15rem 0',
        fontWeight: strong ? 600 : undefined,
        fontSize: strong ? '1.05rem' : undefined,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default QuoteForm
