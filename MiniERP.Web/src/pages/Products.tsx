import { useEffect, useState } from 'react'

// The API base URL is injected by Aspire (see AppHost). Falls back to the
// default API port for a plain `npm run dev` outside of Aspire.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5215'

type Product = {
  id: number
  name: string
  price: number
  stock: number
}

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Product[]) => setProducts(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h1>MiniERP — Products</h1>
      <p style={{ color: '#666' }}>API: {API_URL}</p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load products: {error}</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
              <th style={{ padding: '0.5rem' }}>#</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Price</th>
              <th style={{ padding: '0.5rem' }}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{p.id}</td>
                <td style={{ padding: '0.5rem' }}>{p.name}</td>
                <td style={{ padding: '0.5rem' }}>€ {p.price.toFixed(2)}</td>
                <td style={{ padding: '0.5rem' }}>{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default Products
