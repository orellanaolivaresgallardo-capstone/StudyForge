import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import * as apiModule from '@/services/api'
import type { UserDetailResponse, TokenResponse } from '@/types'

// Mock del módulo completo de API
vi.mock('@/services/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getToken: vi.fn(),
}))

describe('AuthContext', () => {
  const mockUser: UserDetailResponse = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    is_active: true,
    storage_quota_bytes: 104857600, // 100MB
    storage_used_bytes: 0,
    storage_available_bytes: 104857600,
    storage_usage_percentage: 0,
    created_at: '2024-01-01T00:00:00Z',
  }

  const mockTokenResponse: TokenResponse = {
    access_token: 'fake-jwt-token',
    token_type: 'bearer',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    // Por defecto, no hay token
    vi.mocked(apiModule.getToken).mockReturnValue(null)
  })

  describe('useAuth hook', () => {
    it('debe lanzar error cuando se usa fuera de AuthProvider', () => {
      // Suprimir console.error para este test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })

    it('debe funcionar correctamente dentro de AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current).toBeDefined()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Estado inicial', () => {
    it('debe cambiar isLoading a false cuando no hay token', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('debe cargar usuario automáticamente si hay token al montar', async () => {
      vi.mocked(apiModule.getToken).mockReturnValue('existing-token')
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(apiModule.getCurrentUser).toHaveBeenCalledTimes(1)
    })

    it('debe limpiar token si falla la carga del usuario al montar', async () => {
      vi.mocked(apiModule.getToken).mockReturnValue('invalid-token')
      vi.mocked(apiModule.getCurrentUser).mockRejectedValue(new Error('Unauthorized'))

      // Suprimir console.error para este test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(apiModule.clearToken).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('login', () => {
    it('debe hacer login correctamente', async () => {
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      // Esperar a que termine la carga inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Hacer login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(apiModule.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(apiModule.setToken).toHaveBeenCalledWith('fake-jwt-token', true)
      expect(apiModule.getCurrentUser).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('debe hacer login con remember=false', async () => {
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login(
          { email: 'test@example.com', password: 'pass' },
          false
        )
      })

      expect(apiModule.setToken).toHaveBeenCalledWith('fake-jwt-token', false)
    })

    it('debe propagar error si falla el login', async () => {
      const loginError = new Error('Invalid credentials')
      vi.mocked(apiModule.login).mockRejectedValue(loginError)

      // Suprimir console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
          })
        })
      ).rejects.toThrow('Invalid credentials')

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)

      consoleSpy.mockRestore()
    })

    it('debe manejar error al cargar usuario después de login exitoso', async () => {
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockRejectedValue(new Error('User load failed'))

      // Suprimir console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'pass',
          })
        })
      ).rejects.toThrow('User load failed')

      // Token se estableció, pero usuario no se cargó
      expect(apiModule.setToken).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('signup', () => {
    it('debe registrar usuario y hacer auto-login', async () => {
      vi.mocked(apiModule.register).mockResolvedValue()
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const signupData = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
      }

      await act(async () => {
        await result.current.signup(signupData)
      })

      expect(apiModule.register).toHaveBeenCalledWith(signupData)
      expect(apiModule.login).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('debe hacer signup con remember=false', async () => {
      vi.mocked(apiModule.register).mockResolvedValue()
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.signup(
          {
            email: 'new@example.com',
            username: 'newuser',
            password: 'pass',
          },
          false
        )
      })

      expect(apiModule.login).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('debe propagar error si falla el registro', async () => {
      const signupError = new Error('Email already exists')
      vi.mocked(apiModule.register).mockRejectedValue(signupError)

      // Suprimir console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.signup({
            email: 'existing@example.com',
            username: 'user',
            password: 'pass',
          })
        })
      ).rejects.toThrow('Email already exists')

      expect(result.current.user).toBeNull()
      expect(apiModule.login).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('logout', () => {
    it('debe hacer logout correctamente', async () => {
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Primero hacer login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'pass',
        })
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)

      // Luego logout
      act(() => {
        result.current.logout()
      })

      expect(apiModule.clearToken).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('debe funcionar logout sin usuario previo', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      act(() => {
        result.current.logout()
      })

      expect(apiModule.clearToken).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })
  })

  describe('refreshUser', () => {
    it('debe actualizar datos del usuario correctamente', async () => {
      vi.mocked(apiModule.getToken).mockReturnValue('valid-token')
      const updatedUser = { ...mockUser, username: 'updated-username' }
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(updatedUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.refreshUser()
      })

      expect(apiModule.getCurrentUser).toHaveBeenCalled()
      expect(result.current.user).toEqual(updatedUser)
    })

    it('debe establecer user=null si no hay token', async () => {
      vi.mocked(apiModule.getToken).mockReturnValue(null)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.refreshUser()
      })

      expect(apiModule.getCurrentUser).not.toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })

    it('debe limpiar token y usuario si falla la actualización', async () => {
      vi.mocked(apiModule.getToken).mockReturnValue('invalid-token')
      vi.mocked(apiModule.getCurrentUser).mockRejectedValue(new Error('Token expired'))

      // Suprimir console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.refreshUser()
        })
      ).rejects.toThrow('Token expired')

      expect(apiModule.clearToken).toHaveBeenCalled()
      expect(result.current.user).toBeNull()

      consoleSpy.mockRestore()
    })
  })

  describe('isAuthenticated', () => {
    it('debe ser false cuando user es null', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('debe ser true cuando user existe', async () => {
      vi.mocked(apiModule.login).mockResolvedValue(mockTokenResponse)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'pass',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
