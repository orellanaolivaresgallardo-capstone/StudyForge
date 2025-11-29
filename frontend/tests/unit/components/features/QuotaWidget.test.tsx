import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuotaWidget from '@/components/features/QuotaWidget'
import { StorageProvider } from '@/context/StorageContext'
import * as apiModule from '@/services/api'
import type { StorageInfo } from '@/types'

vi.mock('@/services/api', () => ({
  getStorageInfo: vi.fn(),
}))

// Helper para renderizar con StorageProvider
const renderWithStorage = (ui: React.ReactElement) => {
  return render(<StorageProvider>{ui}</StorageProvider>)
}

describe('QuotaWidget', () => {
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

  describe('Estado de carga', () => {
    it('debe mostrar spinner mientras carga', () => {
      vi.mocked(apiModule.getStorageInfo).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithStorage(<QuotaWidget />)

      expect(screen.getByText('Cargando...')).toBeInTheDocument()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('debe tener clases de estilo correctas en modo loading', () => {
      vi.mocked(apiModule.getStorageInfo).mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = renderWithStorage(<QuotaWidget />)
      const loadingDiv = container.querySelector('.bg-slate-800\\/50')
      expect(loadingDiv).toBeInTheDocument()
    })
  })

  describe('Estado de error', () => {
    it('debe mostrar mensaje de error cuando la API falla', async () => {
      vi.mocked(apiModule.getStorageInfo).mockRejectedValue(
        new Error('Network error')
      )

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(
          screen.getByText('Error al cargar información de almacenamiento')
        ).toBeInTheDocument()
      })
    })

    it('debe aplicar estilos de error cuando hay un error', async () => {
      vi.mocked(apiModule.getStorageInfo).mockRejectedValue(
        new Error('Network error')
      )

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const errorDiv = container.querySelector('.bg-red-900\\/20')
        expect(errorDiv).toBeInTheDocument()
      })
    })

    it('debe mostrar "Error desconocido" si storageInfo es null', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(null as any)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('Error desconocido')).toBeInTheDocument()
      })
    })
  })

  describe('Estado exitoso', () => {
    it('debe mostrar información de almacenamiento correctamente', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('Almacenamiento')).toBeInTheDocument()
        expect(screen.getByText('500.0 MB')).toBeInTheDocument()
        expect(screen.getByText(/1.0 GB/)).toBeInTheDocument()
      })
    })

    it('debe mostrar el porcentaje de uso', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('48.8% usado')).toBeInTheDocument()
      })
    })

    it('debe mostrar el número de documentos', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('15 documentos')).toBeInTheDocument()
      })
    })

    it('debe mostrar "documento" en singular cuando hay 1 documento', async () => {
      const singleDocInfo = { ...mockStorageInfo, total_documents: 1 }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(singleDocInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('1 documento')).toBeInTheDocument()
      })
    })
  })

  describe('Formato de bytes', () => {
    it('debe formatear 0 bytes correctamente', async () => {
      const zeroInfo = {
        ...mockStorageInfo,
        storage_used_bytes: 0,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(zeroInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('0 B')).toBeInTheDocument()
      })
    })

    it('debe formatear KB correctamente', async () => {
      const kbInfo = {
        ...mockStorageInfo,
        storage_used_bytes: 5 * 1024, // 5 KB
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(kbInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('5.0 KB')).toBeInTheDocument()
      })
    })

    it('debe formatear GB correctamente', async () => {
      const gbInfo = {
        ...mockStorageInfo,
        storage_used_bytes: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
        storage_quota_bytes: 10 * 1024 * 1024 * 1024, // 10 GB
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(gbInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('2.5 GB')).toBeInTheDocument()
      })
    })
  })

  describe('Colores de progreso', () => {
    it('debe usar color púrpura-rosa para uso < 50%', async () => {
      const lowUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 30,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(lowUsage)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const progressBar = container.querySelector('.from-purple-500')
        expect(progressBar).toBeInTheDocument()
      })
    })

    it('debe usar color amarillo-verde para uso 50-74%', async () => {
      const mediumUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 60,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mediumUsage)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const progressBar = container.querySelector('.from-yellow-500')
        expect(progressBar).toBeInTheDocument()
      })
    })

    it('debe usar color naranja-amarillo para uso 75-89%', async () => {
      const highUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 80,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(highUsage)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const progressBar = container.querySelector('.from-orange-500')
        expect(progressBar).toBeInTheDocument()
      })
    })

    it('debe usar color rojo-rosa para uso >= 90%', async () => {
      const criticalUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 95,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(criticalUsage)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const progressBar = container.querySelector('.from-red-500')
        expect(progressBar).toBeInTheDocument()
      })
    })
  })

  describe('Advertencia de almacenamiento lleno', () => {
    it('debe mostrar advertencia cuando el uso >= 90%', async () => {
      const criticalUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 92,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(criticalUsage)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(
          screen.getByText(
            /Almacenamiento casi lleno. Considera eliminar documentos antiguos./
          )
        ).toBeInTheDocument()
      })
    })

    it('NO debe mostrar advertencia cuando el uso < 90%', async () => {
      const normalUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 89,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(normalUsage)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(
          screen.queryByText(/Almacenamiento casi lleno/)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Botón de actualizar', () => {
    it('debe tener botón de actualizar en modo normal', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const refreshButton = screen.getByTitle('Actualizar')
        expect(refreshButton).toBeInTheDocument()
      })
    })

    it('debe llamar a getStorageInfo cuando se hace click en actualizar', async () => {
      const user = userEvent.setup()
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('Almacenamiento')).toBeInTheDocument()
      })

      // Clear the initial call
      vi.mocked(apiModule.getStorageInfo).mockClear()

      const refreshButton = screen.getByTitle('Actualizar')
      await user.click(refreshButton)

      expect(apiModule.getStorageInfo).toHaveBeenCalledTimes(1)
    })

    it('debe actualizar los datos al hacer refresh', async () => {
      const user = userEvent.setup()
      const initialData = { ...mockStorageInfo, storage_used_bytes: 100 * 1024 } // 100 KB
      const updatedData = { ...mockStorageInfo, storage_used_bytes: 200 * 1024 } // 200 KB

      vi.mocked(apiModule.getStorageInfo)
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(updatedData)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(screen.getByText('100.0 KB')).toBeInTheDocument()
      })

      const refreshButton = screen.getByTitle('Actualizar')
      await user.click(refreshButton)

      await waitFor(() => {
        expect(screen.getByText('200.0 KB')).toBeInTheDocument()
      })
    })
  })

  describe('Modo compacto', () => {
    it('debe renderizar en modo compacto cuando compact=true', async () => {
      vi.mocked(apiModule.getStorageInfo).mockClear()
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget compact={true} />)

      await waitFor(
        () => {
          expect(screen.getByText('500.0 MB')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // En modo compacto no debe aparecer el título "Almacenamiento"
      expect(screen.queryByText('Almacenamiento')).not.toBeInTheDocument()
    })

    it('NO debe tener botón de actualizar en modo compacto', async () => {
      vi.mocked(apiModule.getStorageInfo).mockClear()
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget compact={true} />)

      await waitFor(
        () => {
          expect(screen.getByText('500.0 MB')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.queryByTitle('Actualizar')).not.toBeInTheDocument()
    })

    it('NO debe mostrar advertencia en modo compacto', async () => {
      const criticalUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 95,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(criticalUsage)

      renderWithStorage(<QuotaWidget compact={true} />)

      await waitFor(() => {
        expect(screen.getByText('500.0 MB')).toBeInTheDocument()
      })

      expect(
        screen.queryByText(/Almacenamiento casi lleno/)
      ).not.toBeInTheDocument()
    })

    it('debe aplicar clases de padding correctas en modo compacto', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      const { container } = renderWithStorage(<QuotaWidget compact={true} />)

      await waitFor(() => {
        const compactDiv = container.querySelector('.px-3.py-2')
        expect(compactDiv).toBeInTheDocument()
      })
    })
  })

  describe('Prop className', () => {
    it('debe aplicar className personalizado', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      const { container } = renderWithStorage(<QuotaWidget className="custom-class" />)

      await waitFor(() => {
        const widget = container.querySelector('.custom-class')
        expect(widget).toBeInTheDocument()
      })
    })

    it('debe combinar className con clases existentes', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      const { container } = renderWithStorage(
        <QuotaWidget className="my-custom-class" />
      )

      await waitFor(() => {
        const widget = container.querySelector(
          '.my-custom-class.bg-slate-800\\/50'
        )
        expect(widget).toBeInTheDocument()
      })
    })
  })

  describe('Barra de progreso', () => {
    it('debe establecer el ancho de la barra según el porcentaje', async () => {
      const halfUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 50,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(halfUsage)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const progressBar = container.querySelector('[style*="width: 50%"]')
        expect(progressBar).toBeInTheDocument()
      })
    })

    it('debe limitar el ancho al 100% aunque el porcentaje sea mayor', async () => {
      const overUsage = {
        ...mockStorageInfo,
        storage_usage_percentage: 150,
      }
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(overUsage)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const progressBar = container.querySelector('[style*="width: 100%"]')
        expect(progressBar).toBeInTheDocument()
      })
    })

    it('debe tener efectos de animación en la barra', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      const { container } = renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        const pulseEffect = container.querySelector('.animate-pulse')
        expect(pulseEffect).toBeInTheDocument()
      })
    })
  })

  describe('Carga inicial', () => {
    it('debe llamar a getStorageInfo al montar el componente', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      await waitFor(() => {
        expect(apiModule.getStorageInfo).toHaveBeenCalledTimes(1)
      })
    })

    it('debe manejar cambio de loading a success correctamente', async () => {
      vi.mocked(apiModule.getStorageInfo).mockResolvedValue(mockStorageInfo)

      renderWithStorage(<QuotaWidget />)

      // Primero debe mostrar loading
      expect(screen.getByText('Cargando...')).toBeInTheDocument()

      // Luego debe mostrar los datos
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
        expect(screen.getByText('Almacenamiento')).toBeInTheDocument()
      })
    })
  })
})
