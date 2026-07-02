import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

type StatCardProps = {
  label: string
  count: number | null
  loading: boolean
  error: boolean
}

function StatCard({ label, count, loading, error }: StatCardProps) {
  return (
    <div
      style={{
        display: 'inline-block',
        minWidth: 160,
        padding: '1.25rem',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.2 }}>
        {loading ? '…' : error ? '—' : count}
      </div>
      {error && <div style={{ fontSize: '0.8rem', color: 'crimson' }}>Kon aantal niet laden</div>}
    </div>
  )
}

// Fetches an integer count from the API, tracking loading/error state.
function useCount(path: string) {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api(path)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: number) => setCount(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [path])

  return { count, error, loading }
}

function Dashboard() {
  const navigate = useNavigate()
  const customers = useCount('/customers/count')
  const lowStock = useCount('/products/low-stock/count')
  const quotes = useCount('/quotes/count')

  return (
    <>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard label="Klanten" count={customers.count} loading={customers.loading} error={customers.error} />
        <StatCard label="Lage voorraad" count={lowStock.count} loading={lowStock.loading} error={lowStock.error} />
        <StatCard label="Offertes" count={quotes.count} loading={quotes.loading} error={quotes.error} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/products')}>Producten beheren</button>
        <button onClick={() => navigate('/quotes')}>Offertes beheren</button>
      </div>
    </>
  )
}

export default Dashboard
