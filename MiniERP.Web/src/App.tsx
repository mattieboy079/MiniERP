import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Login from './pages/Login'
import { useAuth } from './auth/AuthContext'

function App() {
  const { user, loading, logout } = useAuth()

  // While the session is being restored from the cookie, show nothing decisive
  // yet — avoids a flash of the login screen on refresh for logged-in users.
  if (loading) {
    return (
      <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Laden…</p>
      </main>
    )
  }

  // Not logged in: only the login route is reachable; everything else redirects.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/customers">Customers</NavLink>
        <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.9rem' }}>
          {user.username} ({user.role})
        </span>
        <button onClick={logout}>Uitloggen</button>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        {/* Logged in: the login route is pointless, send them home. */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

export default App
