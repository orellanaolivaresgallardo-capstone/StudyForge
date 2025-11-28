import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import * as AuthContext from '@/context/AuthContext'

// Mock del hook useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithRouter = (component: React.ReactNode, initialPath = '/') => {
    window.history.pushState({}, 'Test page', initialPath)
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={component} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    )
  }

  it('debe mostrar loading cuando isLoading=true', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('debe mostrar spinner de carga cuando isLoading=true', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Verificar que existe el spinner (div con animate-spin)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('debe redirigir a /login cuando NO está autenticado', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Debe mostrar la página de login, no el contenido protegido
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('debe renderizar children cuando está autenticado', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        storage_quota_bytes: 104857600,
        storage_used_bytes: 0,
        storage_available_bytes: 104857600,
        storage_usage_percentage: 0,
        created_at: '2024-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
  })

  it('debe renderizar elementos complejos como children', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        storage_quota_bytes: 104857600,
        storage_used_bytes: 0,
        storage_available_bytes: 104857600,
        storage_usage_percentage: 0,
        created_at: '2024-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to your dashboard</p>
          <button>Click me</button>
        </div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('debe cambiar de loading a contenido cuando termine la carga', () => {
    const { rerender } = render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )

    // Primero está cargando
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    rerender(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )

    expect(screen.getByText('Cargando...')).toBeInTheDocument()

    // Luego termina de cargar y está autenticado
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        storage_quota_bytes: 104857600,
        storage_used_bytes: 0,
        storage_available_bytes: 104857600,
        storage_usage_percentage: 0,
        created_at: '2024-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    rerender(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )

    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
