import { useEffect, useState } from 'react'
import ProductForm, { type ProductInput } from '../components/ProductForm'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'

type Product = {
  id: number
  name: string
  articleNumber: string
  price: number
  costPrice: number
  minimumStock: number | null
  currentStock: number
}

const isLow = (p: Product) => p.minimumStock != null && p.currentStock <= p.minimumStock

function Products() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // null = adding, Product = editing that product, undefined = modal closed.
  const [editing, setEditing] = useState<Product | null | undefined>(undefined)

  const load = () => {
    setLoading(true)
    api(`/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Product[]) => {
        setProducts(data)
        setError(null)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (values: ProductInput) => {
    const isEdit = editing != null
    const url = isEdit ? `/products/${editing!.id}` : `/products`
    const res = await api(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    setEditing(undefined)
    load()
  }

  const remove = async (product: Product) => {
    if (!confirm(`Product "${product.name}" verwijderen?`)) return
    const res = await api(`/products/${product.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError(`Verwijderen mislukt: HTTP ${res.status}`)
      return
    }
    load()
  }

  const modalOpen = editing !== undefined

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h1>Producten</h1>
        {isAdmin && <button onClick={() => setEditing(null)}>Product toevoegen</button>}
      </div>

      {loading && <p>Laden…</p>}
      {error && <p style={{ color: 'crimson' }}>Fout: {error}</p>}

      {!loading && !error && products.length === 0 && (
        <p style={{ color: '#666' }}>Geen producten gevonden.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
              <th style={{ padding: '0.5rem' }}>Naam</th>
              <th style={{ padding: '0.5rem' }}>Artikelnummer</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Prijs</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Voorraad</th>
              {isAdmin && <th style={{ padding: '0.5rem' }} />}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{p.name}</td>
                <td style={{ padding: '0.5rem' }}>{p.articleNumber}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>€ {p.price.toFixed(2)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: isLow(p) ? 'crimson' : undefined }}>
                  {p.currentStock}
                  {isLow(p) && ' (laag)'}
                </td>
                {isAdmin && (
                  <td style={{ padding: '0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setEditing(p)}>Wijzig</button>{' '}
                    <button onClick={() => remove(p)}>Verwijder</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div
          onClick={() => setEditing(undefined)}
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
            style={{ background: '#fff', padding: '1.5rem', borderRadius: 8, width: 'min(420px, 90vw)' }}
          >
            <h2 style={{ marginTop: 0 }}>{editing ? 'Product wijzigen' : 'Product toevoegen'}</h2>
            <ProductForm
              initial={
                editing
                  ? {
                      name: editing.name,
                      articleNumber: editing.articleNumber,
                      price: editing.price,
                      costPrice: editing.costPrice,
                      minimumStock: editing.minimumStock,
                      currentStock: editing.currentStock,
                    }
                  : undefined
              }
              submitLabel={editing ? 'Opslaan' : 'Toevoegen'}
              onSubmit={save}
              onCancel={() => setEditing(undefined)}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Products
