import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import { register, login, getCurrentUser } from '@/services/api/auth.api'
import type { UserCreate, UserLogin, Token, UserDetailResponse } from '@/types'

describe('auth.api', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('register', () => {
    it('debe registrar un nuevo usuario correctamente', async () => {
      const userData: UserCreate = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      }

      const mockResponse: UserDetailResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        storage_quota_bytes: 104857600,
        storage_used_bytes: 0,
        storage_available_bytes: 104857600,
        storage_usage_percentage: 0,
        created_at: '2024-01-01T00:00:00Z',
      }

      mock.onPost('/auth/register', userData).reply(200, mockResponse)

      const result = await register(userData)

      expect(result).toEqual(mockResponse)
    })

    it('debe propagar errores del servidor', async () => {
      const userData: UserCreate = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'password123',
      }

      mock.onPost('/auth/register').reply(409, {
        detail: 'Email already registered',
      })

      await expect(register(userData)).rejects.toThrow()
    })

    it('debe enviar todos los campos requeridos', async () => {
      const userData: UserCreate = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'securepass',
      }

      mock.onPost('/auth/register').reply((config) => {
        const data = JSON.parse(config.data)
        expect(data.email).toBe('test@example.com')
        expect(data.username).toBe('testuser')
        expect(data.password).toBe('securepass')
        return [200, { id: 1, email: data.email, username: data.username }]
      })

      await register(userData)
    })
  })

  describe('login', () => {
    it('debe hacer login y retornar token', async () => {
      const credentials: UserLogin = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockToken: Token = {
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
      }

      mock.onPost('/auth/login', credentials).reply(200, mockToken)

      const result = await login(credentials)

      expect(result).toEqual(mockToken)
      expect(result.access_token).toBe('fake-jwt-token')
      expect(result.token_type).toBe('bearer')
    })

    it('debe fallar con credenciales incorrectas', async () => {
      const credentials: UserLogin = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      mock.onPost('/auth/login').reply(401, {
        detail: 'Incorrect email or password',
      })

      await expect(login(credentials)).rejects.toThrow()
    })

    it('debe enviar email y password', async () => {
      const credentials: UserLogin = {
        email: 'user@test.com',
        password: 'mypass',
      }

      mock.onPost('/auth/login').reply((config) => {
        const data = JSON.parse(config.data)
        expect(data.email).toBe('user@test.com')
        expect(data.password).toBe('mypass')
        return [200, { access_token: 'token', token_type: 'bearer' }]
      })

      await login(credentials)
    })
  })

  describe('getCurrentUser', () => {
    it('debe obtener datos del usuario autenticado', async () => {
      const mockUser: UserDetailResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        storage_quota_bytes: 104857600,
        storage_used_bytes: 1048576,
        storage_available_bytes: 103809024,
        storage_usage_percentage: 1.0,
        created_at: '2024-01-01T00:00:00Z',
      }

      mock.onGet('/auth/me').reply(200, mockUser)

      const result = await getCurrentUser()

      expect(result).toEqual(mockUser)
    })

    it('debe fallar si no hay token válido', async () => {
      mock.onGet('/auth/me').reply(401, {
        detail: 'Not authenticated',
      })

      await expect(getCurrentUser()).rejects.toThrow()
    })

    it('debe incluir campos calculados de storage', async () => {
      const mockUser: UserDetailResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        storage_quota_bytes: 100000000,
        storage_used_bytes: 50000000,
        storage_available_bytes: 50000000,
        storage_usage_percentage: 50.0,
        created_at: '2024-01-01T00:00:00Z',
      }

      mock.onGet('/auth/me').reply(200, mockUser)

      const result = await getCurrentUser()

      expect(result.storage_quota_bytes).toBe(100000000)
      expect(result.storage_used_bytes).toBe(50000000)
      expect(result.storage_available_bytes).toBe(50000000)
      expect(result.storage_usage_percentage).toBe(50.0)
    })
  })
})
