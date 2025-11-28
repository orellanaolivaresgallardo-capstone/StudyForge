import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import apiClient, { getToken, setToken, clearToken, isAuthenticated } from '@/services/api/client'

// Mock window.location
delete (window as any).location
window.location = { href: '', pathname: '/' } as any

describe('API Client - Token Management', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('getToken', () => {
    it('debe retornar token de localStorage si existe', () => {
      localStorage.setItem('sf_token', 'token-from-local')
      expect(getToken()).toBe('token-from-local')
    })

    it('debe retornar token de sessionStorage si no está en localStorage', () => {
      sessionStorage.setItem('sf_token', 'token-from-session')
      expect(getToken()).toBe('token-from-session')
    })

    it('debe priorizar localStorage sobre sessionStorage', () => {
      localStorage.setItem('sf_token', 'token-from-local')
      sessionStorage.setItem('sf_token', 'token-from-session')
      expect(getToken()).toBe('token-from-local')
    })

    it('debe retornar null cuando no hay token', () => {
      expect(getToken()).toBeNull()
    })
  })

  describe('setToken', () => {
    it('debe guardar token en localStorage cuando remember=true', () => {
      setToken('my-token', true)

      expect(localStorage.getItem('sf_token')).toBe('my-token')
      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })

    it('debe guardar token en localStorage por defecto', () => {
      setToken('my-token')

      expect(localStorage.getItem('sf_token')).toBe('my-token')
      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })

    it('debe guardar token en sessionStorage cuando remember=false', () => {
      setToken('my-token', false)

      expect(sessionStorage.getItem('sf_token')).toBe('my-token')
      expect(localStorage.getItem('sf_token')).toBeNull()
    })

    it('debe limpiar sessionStorage al guardar en localStorage', () => {
      sessionStorage.setItem('sf_token', 'old-token')
      setToken('new-token', true)

      expect(localStorage.getItem('sf_token')).toBe('new-token')
      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })

    it('debe limpiar localStorage al guardar en sessionStorage', () => {
      localStorage.setItem('sf_token', 'old-token')
      setToken('new-token', false)

      expect(sessionStorage.getItem('sf_token')).toBe('new-token')
      expect(localStorage.getItem('sf_token')).toBeNull()
    })
  })

  describe('clearToken', () => {
    it('debe limpiar token de localStorage', () => {
      localStorage.setItem('sf_token', 'my-token')
      clearToken()

      expect(localStorage.getItem('sf_token')).toBeNull()
    })

    it('debe limpiar token de sessionStorage', () => {
      sessionStorage.setItem('sf_token', 'my-token')
      clearToken()

      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })

    it('debe limpiar ambos storages', () => {
      localStorage.setItem('sf_token', 'token-local')
      sessionStorage.setItem('sf_token', 'token-session')
      clearToken()

      expect(localStorage.getItem('sf_token')).toBeNull()
      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('debe retornar true cuando hay token en localStorage', () => {
      localStorage.setItem('sf_token', 'my-token')
      expect(isAuthenticated()).toBe(true)
    })

    it('debe retornar true cuando hay token en sessionStorage', () => {
      sessionStorage.setItem('sf_token', 'my-token')
      expect(isAuthenticated()).toBe(true)
    })

    it('debe retornar false cuando no hay token', () => {
      expect(isAuthenticated()).toBe(false)
    })
  })
})

describe('API Client - Interceptors', () => {
  let mock: MockAdapter

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mock = new MockAdapter(apiClient)
    window.location.href = ''
    window.location.pathname = '/'
  })

  afterEach(() => {
    mock.restore()
  })

  describe('Request Interceptor', () => {
    it('debe agregar Authorization header cuando hay token', async () => {
      localStorage.setItem('sf_token', 'my-auth-token')

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer my-auth-token')
        return [200, { success: true }]
      })

      await apiClient.get('/test')
    })

    it('NO debe agregar Authorization header cuando no hay token', async () => {
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined()
        return [200, { success: true }]
      })

      await apiClient.get('/test')
    })

    it('debe usar token de sessionStorage si existe', async () => {
      sessionStorage.setItem('sf_token', 'session-token')

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer session-token')
        return [200, { success: true }]
      })

      await apiClient.get('/test')
    })
  })

  describe('Response Interceptor - 401 Handling', () => {
    it('debe limpiar token y redirigir al login en error 401', async () => {
      localStorage.setItem('sf_token', 'expired-token')
      window.location.pathname = '/dashboard'

      mock.onGet('/protected').reply(401)

      try {
        await apiClient.get('/protected')
      } catch (error) {
        expect(localStorage.getItem('sf_token')).toBeNull()
        expect(sessionStorage.getItem('sf_token')).toBeNull()
        expect(window.location.href).toBe('/login')
      }
    })

    it('NO debe redirigir si ya estamos en /login', async () => {
      localStorage.setItem('sf_token', 'expired-token')
      window.location.pathname = '/login'

      mock.onPost('/login').reply(401)

      try {
        await apiClient.post('/login')
      } catch (error) {
        expect(localStorage.getItem('sf_token')).toBeNull()
        expect(window.location.href).toBe('')
      }
    })

    it('NO debe redirigir si ya estamos en /signup', async () => {
      localStorage.setItem('sf_token', 'expired-token')
      window.location.pathname = '/signup'

      mock.onPost('/signup').reply(401)

      try {
        await apiClient.post('/signup')
      } catch (error) {
        expect(localStorage.getItem('sf_token')).toBeNull()
        expect(window.location.href).toBe('')
      }
    })

    it('debe propagar el error después de manejar 401', async () => {
      mock.onGet('/protected').reply(401, { detail: 'Token expired' })

      await expect(apiClient.get('/protected')).rejects.toThrow()
    })

    it('NO debe interferir con otros códigos de error', async () => {
      mock.onGet('/test').reply(500, { detail: 'Server error' })

      await expect(apiClient.get('/test')).rejects.toThrow()
    })

    it('debe limpiar ambos storages en 401', async () => {
      localStorage.setItem('sf_token', 'token1')
      sessionStorage.setItem('sf_token', 'token2')
      window.location.pathname = '/dashboard'

      mock.onGet('/protected').reply(401)

      try {
        await apiClient.get('/protected')
      } catch (error) {
        expect(localStorage.getItem('sf_token')).toBeNull()
        expect(sessionStorage.getItem('sf_token')).toBeNull()
      }
    })
  })

  describe('Successful Requests', () => {
    it('debe retornar datos correctamente en peticiones exitosas', async () => {
      mock.onGet('/users').reply(200, { users: ['Alice', 'Bob'] })

      const response = await apiClient.get('/users')

      expect(response.status).toBe(200)
      expect(response.data).toEqual({ users: ['Alice', 'Bob'] })
    })

    it('debe funcionar con POST requests', async () => {
      const postData = { name: 'Test' }
      mock.onPost('/create').reply(201, { id: 1, ...postData })

      const response = await apiClient.post('/create', postData)

      expect(response.status).toBe(201)
      expect(response.data.name).toBe('Test')
    })
  })
})
