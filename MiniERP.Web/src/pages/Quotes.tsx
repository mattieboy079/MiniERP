import { useEffect, useState } from 'react'
import QuoteForm, {
  type QuoteInput,
  type CustomerOption,
  type ProductOption,
} from '../components/QuoteForm'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'

type QuoteSummary = {
  id: number
  quoteNumber: string
  customerId: number | null
  customerName: string
  createdDate: string
  validUntil: string
  total: number
}

type QuoteLine = {
  productId: number | null
  productName: string
  articleNumber: string
  unitPrice: number
  quantity: number
  lineDiscountPercent: number
  lineTotal: number
}

type QuoteDetail = {
  id: number
  quoteNumber: string
  customerId: number | null
  customerName: string
  createdDate: string
  validUntil: string
  vatRate: number
  overallDiscountPercent: number
  lines: QuoteLine[]
  subtotal: number
  discountedSubtotal: number
  vatAmount: number
  total: number
}

type Modal =
  | { mode: 'add' }
  | { mode: 'edit'; quote: QuoteDetail }
  | { mode: 'view'; quote: QuoteDetail }
  | null

const money = (n: number) => `€ ${n.toFixed(2)}`
const date = (iso: string) => new Date(iso).toLocaleDateString('nl-NL')

function Quotes() {
  const { isAdmin } = useAuth()
  const [quotes, setQuotes] = useState<QuoteSummary[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Modal>(null)

  const load = (term: string) => {
    setLoading(true)
    const url = term.trim() ? `/quotes?search=${encodeURIComponent(term.trim())}` : `/quotes`
    api(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: QuoteSummary[]) => {
        setQuotes(data)
        setError(null)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }

  // Debounced search: refetch 250ms after the user stops typing.
  useEffect(() => {
    const handle = setTimeout(() => load(search), 250)
    return () => clearTimeout(handle)
  }, [search])

  // The form needs the current customers and products to pick from and to snapshot
  // prices in the live preview.
  useEffect(() => {
    api(`/customers`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CustomerOption[]) => setCustomers(data))
      .catch(() => {})
    api(`/products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProductOption[]) => setProducts(data))
      .catch(() => {})
  }, [])

  const openDetail = async (id: number, mode: 'view' | 'edit') => {
    const res = await api(`/quotes/${id}`)
    if (!res.ok) {
      setError(`Kon offerte niet laden: HTTP ${res.status}`)
      return
    }
    const quote: QuoteDetail = await res.json()
    setModal({ mode, quote })
  }

  const save = async (values: QuoteInput) => {
    const isEdit = modal?.mode === 'edit'
    const url = isEdit ? `/quotes/${modal.quote.id}` : `/quotes`
    const res = await api(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    setModal(null)
    load(search)
  }

  const remove = async (quote: QuoteSummary) => {
    if (!confirm(`Offerte ${quote.quoteNumber} verwijderen?`)) return
    const res = await api(`/quotes/${quote.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError(`Verwijderen mislukt: HTTP ${res.status}`)
      return
    }
    load(search)
  }

  const toInput = (q: QuoteDetail): QuoteInput => ({
    customerId: q.customerId ?? 0,
    validUntil: q.validUntil ? q.validUntil.slice(0, 10) : null,
    overallDiscountPercent: q.overallDiscountPercent,
    lines: q.lines.map((l) => ({
      productId: l.productId ?? 0,
      quantity: l.quantity,
      lineDiscountPercent: l.lineDiscountPercent,
    })),
  })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h1>Offertes</h1>
        <button onClick={() => setModal({ mode: 'add' })}>Offerte toevoegen</button>
      </div>

      <input
        type="search"
        placeholder="Zoek op offertenummer of klant…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', margin: '1rem 0', border: '1px solid #ccc', borderRadius: 4 }}
      />

      {loading && <p>Laden…</p>}
      {error && <p style={{ color: 'crimson' }}>Fout: {error}</p>}

      {!loading && !error && quotes.length === 0 && <p style={{ color: '#666' }}>Geen offertes gevonden.</p>}

      {!loading && !error && quotes.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
              <th style={{ padding: '0.5rem' }}>Offertenummer</th>
              <th style={{ padding: '0.5rem' }}>Klant</th>
              <th style={{ padding: '0.5rem' }}>Datum</th>
              <th style={{ padding: '0.5rem' }}>Geldig tot</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Totaal</th>
              <th style={{ padding: '0.5rem' }} />
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{q.quoteNumber}</td>
                <td style={{ padding: '0.5rem' }}>{q.customerName}</td>
                <td style={{ padding: '0.5rem' }}>{date(q.createdDate)}</td>
                <td style={{ padding: '0.5rem' }}>{date(q.validUntil)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{money(q.total)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => openDetail(q.id, 'view')}>Bekijk</button>{' '}
                  <button onClick={() => openDetail(q.id, 'edit')}>Wijzig</button>{' '}
                  {isAdmin && <button onClick={() => remove(q)}>Verwijder</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: 8,
              width: 'min(560px, 92vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {modal.mode === 'view' ? (
              <QuoteDetailView quote={modal.quote} onClose={() => setModal(null)} />
            ) : (
              <>
                <h2 style={{ marginTop: 0 }}>{modal.mode === 'edit' ? 'Offerte wijzigen' : 'Offerte toevoegen'}</h2>
                <QuoteForm
                  customers={customers}
                  products={products}
                  initial={modal.mode === 'edit' ? toInput(modal.quote) : undefined}
                  submitLabel={modal.mode === 'edit' ? 'Opslaan' : 'Toevoegen'}
                  onSubmit={save}
                  onCancel={() => setModal(null)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function QuoteDetailView({ quote, onClose }: { quote: QuoteDetail; onClose: () => void }) {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Offerte {quote.quoteNumber}</h2>
      <p style={{ color: '#555', margin: '0 0 1rem' }}>
        {quote.customerName} · {date(quote.createdDate)} · geldig tot {date(quote.validUntil)}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '0.35rem' }}>Product</th>
            <th style={{ padding: '0.35rem', textAlign: 'right' }}>Stukprijs</th>
            <th style={{ padding: '0.35rem', textAlign: 'right' }}>Aantal</th>
            <th style={{ padding: '0.35rem', textAlign: 'right' }}>Korting</th>
            <th style={{ padding: '0.35rem', textAlign: 'right' }}>Regeltotaal</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((l, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.35rem' }}>
                {l.productName}
                <span style={{ color: '#999' }}> ({l.articleNumber})</span>
              </td>
              <td style={{ padding: '0.35rem', textAlign: 'right' }}>{money(l.unitPrice)}</td>
              <td style={{ padding: '0.35rem', textAlign: 'right' }}>{l.quantity}</td>
              <td style={{ padding: '0.35rem', textAlign: 'right' }}>{l.lineDiscountPercent}%</td>
              <td style={{ padding: '0.35rem', textAlign: 'right' }}>{money(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '1rem', fontVariantNumeric: 'tabular-nums' }}>
        <SummaryRow label="Subtotaal" value={money(quote.subtotal)} />
        {quote.overallDiscountPercent > 0 && (
          <SummaryRow label={`Na korting (${quote.overallDiscountPercent}%)`} value={money(quote.discountedSubtotal)} />
        )}
        <SummaryRow label={`BTW (${quote.vatRate}%)`} value={money(quote.vatAmount)} />
        <SummaryRow label="Totaal" value={money(quote.total)} strong />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button onClick={onClose}>Sluiten</button>
      </div>
    </>
  )
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
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

export default Quotes
