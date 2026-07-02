import { useEffect, useState } from 'react'
import CustomerForm, { type CustomerInput } from '../components/CustomerForm'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'

type Customer = {
  id: number
  name: string
  contactName: string
  email: string
  phone: string
  address: string
}

function Customers() {
  const { isAdmin } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // null = closed, {} = adding, Customer = editing that customer.
  const [editing, setEditing] = useState<Customer | null | undefined>(undefined)

  const load = (term: string) => {
    setLoading(true)
    const url = term.trim()
      ? `/customers?search=${encodeURIComponent(term.trim())}`
      : `/customers`
    api(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Customer[]) => {
        setCustomers(data)
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

  const save = async (values: CustomerInput) => {
    const isEdit = editing != null
    const url = isEdit ? `/customers/${editing!.id}` : `/customers`
    const res = await api(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    setEditing(undefined)
    load(search)
  }

  const remove = async (customer: Customer) => {
    if (!confirm(`Klant "${customer.name}" verwijderen?`)) return
    const res = await api(`/customers/${customer.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError(`Verwijderen mislukt: HTTP ${res.status}`)
      return
    }
    load(search)
  }

  const modalOpen = editing !== undefined

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h1>Klanten</h1>
        {isAdmin && <button onClick={() => setEditing(null)}>Klant toevoegen</button>}
      </div>

      <input
        type="search"
        placeholder="Zoek op naam, contactpersoon of email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', margin: '1rem 0', border: '1px solid #ccc', borderRadius: 4 }}
      />

      {loading && <p>Laden…</p>}
      {error && <p style={{ color: 'crimson' }}>Fout: {error}</p>}

      {!loading && !error && customers.length === 0 && (
        <p style={{ color: '#666' }}>Geen klanten gevonden.</p>
      )}

      {!loading && !error && customers.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
              <th style={{ padding: '0.5rem' }}>Naam</th>
              <th style={{ padding: '0.5rem' }}>Contactpersoon</th>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Telefoon</th>
              {isAdmin && <th style={{ padding: '0.5rem' }} />}
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{c.name}</td>
                <td style={{ padding: '0.5rem' }}>{c.contactName}</td>
                <td style={{ padding: '0.5rem' }}>{c.email}</td>
                <td style={{ padding: '0.5rem' }}>{c.phone}</td>
                {isAdmin && (
                  <td style={{ padding: '0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setEditing(c)}>Wijzig</button>{' '}
                    <button onClick={() => remove(c)}>Verwijder</button>
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
            <h2 style={{ marginTop: 0 }}>{editing ? 'Klant wijzigen' : 'Klant toevoegen'}</h2>
            <CustomerForm
              initial={
                editing
                  ? {
                      name: editing.name,
                      contactName: editing.contactName,
                      email: editing.email,
                      phone: editing.phone,
                      address: editing.address,
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

export default Customers
