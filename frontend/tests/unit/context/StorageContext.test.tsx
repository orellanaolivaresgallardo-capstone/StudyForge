import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { StorageProvider, useStorage } from '@/context/StorageContext'
import * as apiModule from '@/services/api'
import type { StorageInfo } from '@/types'
import { ReactNode } from 'react'

vi.mock('@/services/api', () => ({
  getStorageInfo: vi.fn(),
}))

describe('StorageContext', () => {
  const mockStorageInfo: StorageInfo = {
    storage_used_bytes: 500 * 1024 * 1024, // 500 MB
    storage_quota_bytes: 1024 * 1024 * 1024, // 1 GB
    storage_usage_percentage: 48.8,
    total_documents: 15,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('StorageProvider - Estado inicial', () => {
    it('debe tener valores iniciales correctos', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      expect(result.current.storageInfo).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.refreshStorage).toBeInstanceOf(Function)
    })
  })

  describe('refreshStorage - Caso exitoso', () => {
    it('debe cargar storage info correctamente', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      // Estado inicial
      expect(result.current.isLoading).toBe(false)
      expect(result.current.storageInfo).toBeNull()

      // Llamar a refreshStorage
      await act(async () => {
        await result.current.refreshStorage()
      })

      // Verificar que se llamó a la API
      expect(apiModule.getStorageInfo).toHaveBeenCalledTimes(1)

      // Verificar estado final
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.storageInfo).toEqual(mockStorageInfo)
        expect(result.current.error).toBeNull()
      })
    })

    it('debe establecer isLoading a true durante la carga', async () => {
      let resolvePromise: (value: StorageInfo) => void
      const promise = new Promise<StorageInfo>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(apiModule.getStorageInfo).mockReturnValue(promise)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      // Iniciar carga
      act(() => {
        result.current.refreshStorage()
      })

      // Verificar que isLoading es true durante la carga
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolver la promesa
      act(() => {
        resolvePromise!(mockStorageInfo)
      })

      // Verificar que isLoading vuelve a false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('debe limpiar error anterior en carga exitosa', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      // Simular error primero
      vi.mocked(apiModule.getStorageInfo).mockRejectedValueOnce(
        new Error('Network error')
      )

      await act(async () => {
        await result.current.refreshStorage()
      })

      // Verificar que hay error
      expect(result.current.error).toBe(
        'Error al cargar información de almacenamiento'
      )

      // Ahora simular carga exitosa
      vi.mocked(apiModule.getStorageInfo).mockResolvedValueOnce(mockStorageInfo)

      await act(async () => {
        await result.current.refreshStorage()
      })

      // Verificar que el error fue limpiado
      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.storageInfo).toEqual(mockStorageInfo)
      })
    })

    it('debe actualizar storageInfo con nuevos datos', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      const initialData: StorageInfo = {
        ...mockStorageInfo,
        storage_used_bytes: 100 * 1024, // 100 KB
      }

      const updatedData: StorageInfo = {
        ...mockStorageInfo,
        storage_used_bytes: 200 * 1024, // 200 KB
      }

      // Primera carga
      vi.mocked(apiModule.getStorageInfo).mockResolvedValueOnce(initialData)

      await act(async () => {
        await result.current.refreshStorage()
      })

      expect(result.current.storageInfo).toEqual(initialData)

      // Segunda carga con datos actualizados
      vi.mocked(apiModule.getStorageInfo).mockResolvedValueOnce(updatedData)

      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.storageInfo).toEqual(updatedData)
      })
    })
  })

  describe('refreshStorage - Caso de error', () => {
    it('debe manejar errores de la API', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.getStorageInfo).mockRejectedValue(
        new Error('Network error')
      )

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBe(
          'Error al cargar información de almacenamiento'
        )
        expect(result.current.storageInfo).toBeNull()
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading storage info:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('debe establecer isLoading a false después de error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.getStorageInfo).mockRejectedValue(
        new Error('Server error')
      )

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      consoleErrorSpy.mockRestore()
    })

    it('debe mantener storageInfo anterior si hay error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      // Primera carga exitosa
      vi.mocked(apiModule.getStorageInfo).mockResolvedValueOnce(mockStorageInfo)

      await act(async () => {
        await result.current.refreshStorage()
      })

      expect(result.current.storageInfo).toEqual(mockStorageInfo)

      // Segunda carga con error
      vi.mocked(apiModule.getStorageInfo).mockRejectedValueOnce(
        new Error('Network error')
      )

      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        // storageInfo debe mantener los datos anteriores
        expect(result.current.storageInfo).toEqual(mockStorageInfo)
        expect(result.current.error).toBe(
          'Error al cargar información de almacenamiento'
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('useStorage hook', () => {
    it('debe lanzar error si se usa fuera de StorageProvider', () => {
      // Suprimir el error esperado en consola durante el test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useStorage())
      }).toThrow('useStorage must be used within a StorageProvider')

      consoleErrorSpy.mockRestore()
    })

    it('debe retornar el contexto si se usa dentro de StorageProvider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      expect(result.current).toHaveProperty('storageInfo')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('refreshStorage')
    })
  })

  describe('refreshStorage - Estabilidad (useCallback)', () => {
    it('debe mantener la misma referencia de función entre renders', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result, rerender } = renderHook(() => useStorage(), { wrapper })

      const firstRefreshFn = result.current.refreshStorage

      // Forzar re-render
      rerender()

      const secondRefreshFn = result.current.refreshStorage

      // La función debe ser la misma
      expect(firstRefreshFn).toBe(secondRefreshFn)
    })
  })

  describe('Integración completa', () => {
    it('debe manejar ciclo completo: carga inicial → error → recuperación exitosa', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      // Estado inicial
      expect(result.current.storageInfo).toBeNull()
      expect(result.current.error).toBeNull()

      // Primera carga: éxito
      vi.mocked(apiModule.getStorageInfo).mockResolvedValueOnce(mockStorageInfo)

      await act(async () => {
        await result.current.refreshStorage()
      })

      expect(result.current.storageInfo).toEqual(mockStorageInfo)
      expect(result.current.error).toBeNull()

      // Segunda carga: error
      vi.mocked(apiModule.getStorageInfo).mockRejectedValueOnce(
        new Error('Temporary error')
      )

      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.error).toBe(
          'Error al cargar información de almacenamiento'
        )
        // Datos anteriores se mantienen
        expect(result.current.storageInfo).toEqual(mockStorageInfo)
      })

      // Tercera carga: recuperación exitosa
      const updatedData: StorageInfo = {
        ...mockStorageInfo,
        storage_used_bytes: 600 * 1024 * 1024,
      }

      vi.mocked(apiModule.getStorageInfo).mockResolvedValueOnce(updatedData)

      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.storageInfo).toEqual(updatedData)
        expect(result.current.error).toBeNull()
      })

      consoleErrorSpy.mockRestore()
    })

    it('debe permitir múltiples llamadas a refreshStorage consecutivas', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <StorageProvider>{children}</StorageProvider>
      )

      const { result } = renderHook(() => useStorage(), { wrapper })

      const data1: StorageInfo = { ...mockStorageInfo, storage_used_bytes: 100 }
      const data2: StorageInfo = { ...mockStorageInfo, storage_used_bytes: 200 }
      const data3: StorageInfo = { ...mockStorageInfo, storage_used_bytes: 300 }

      vi.mocked(apiModule.getStorageInfo)
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2)
        .mockResolvedValueOnce(data3)

      // Primera carga
      await act(async () => {
        await result.current.refreshStorage()
      })

      expect(result.current.storageInfo).toEqual(data1)

      // Segunda carga
      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.storageInfo).toEqual(data2)
      })

      // Tercera carga
      await act(async () => {
        await result.current.refreshStorage()
      })

      await waitFor(() => {
        expect(result.current.storageInfo).toEqual(data3)
      })

      // Verificar que se llamó 3 veces
      expect(apiModule.getStorageInfo).toHaveBeenCalledTimes(3)
    })
  })
})
