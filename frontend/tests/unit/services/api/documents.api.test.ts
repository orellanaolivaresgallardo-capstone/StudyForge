import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocumentTitle,
  deleteDocument,
  getStorageInfo,
} from '@/services/api/documents.api'
import type {
  DocumentResponse,
  DocumentDetailResponse,
  DocumentListResponse,
  StorageInfo,
} from '@/types'

describe('documents.api', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('uploadDocument', () => {
    it('debe subir un documento con título', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const studySpaceIds = ['space1', 'space2']
      const title = 'Mi Documento'

      const mockResponse: DocumentResponse = {
        id: 'doc1',
        title: 'Mi Documento',
        original_filename: 'test.pdf',
        file_size_bytes: 7,
        mime_type: 'application/pdf',
        upload_date: '2024-01-01T00:00:00Z',
        user_id: 1,
        study_space_ids: ['space1', 'space2'],
      }

      mock.onPost('/documents').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('file')).toBeDefined()
        expect(formData.get('study_space_ids')).toBe('space1,space2')
        expect(formData.get('title')).toBe('Mi Documento')
        return [200, mockResponse]
      })

      const result = await uploadDocument(file, studySpaceIds, title)

      expect(result).toEqual(mockResponse)
    })

    it('debe subir un documento sin título', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const studySpaceIds = ['space1']

      const mockResponse: DocumentResponse = {
        id: 'doc1',
        title: 'test.pdf',
        original_filename: 'test.pdf',
        file_size_bytes: 7,
        mime_type: 'application/pdf',
        upload_date: '2024-01-01T00:00:00Z',
        user_id: 1,
        study_space_ids: ['space1'],
      }

      mock.onPost('/documents').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('title')).toBeNull()
        return [200, mockResponse]
      })

      const result = await uploadDocument(file, studySpaceIds)

      expect(result.title).toBe('test.pdf')
    })

    it('debe manejar múltiples espacios de estudio', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const studySpaceIds = ['space1', 'space2', 'space3']

      mock.onPost('/documents').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('study_space_ids')).toBe('space1,space2,space3')
        return [
          200,
          {
            id: 'doc1',
            title: 'test.pdf',
            study_space_ids: studySpaceIds,
          },
        ]
      })

      await uploadDocument(file, studySpaceIds)
    })

    it('debe fallar si el archivo es demasiado grande', async () => {
      // Simular un archivo grande sin crear realmente 100MB en memoria
      const file = new File(['content'], 'huge.pdf')
      Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 })
      const studySpaceIds = ['space1']

      mock.onPost('/documents').reply(413, {
        detail: 'File too large',
      })

      await expect(uploadDocument(file, studySpaceIds)).rejects.toThrow()
    })

    it('debe enviar Content-Type multipart/form-data', async () => {
      const file = new File(['content'], 'test.pdf')
      const studySpaceIds = ['space1']

      mock.onPost('/documents').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
        return [200, { id: 'doc1' }]
      })

      await uploadDocument(file, studySpaceIds)
    })
  })

  describe('listDocuments', () => {
    it('debe listar documentos con paginación por defecto', async () => {
      const mockResponse: DocumentListResponse = {
        items: [
          {
            id: 'doc1',
            title: 'Documento 1',
            original_filename: 'doc1.pdf',
            file_size_bytes: 1000,
            mime_type: 'application/pdf',
            upload_date: '2024-01-01T00:00:00Z',
            user_id: 1,
            study_space_ids: ['space1'],
          },
          {
            id: 'doc2',
            title: 'Documento 2',
            original_filename: 'doc2.pdf',
            file_size_bytes: 2000,
            mime_type: 'application/pdf',
            upload_date: '2024-01-02T00:00:00Z',
            user_id: 1,
            study_space_ids: ['space1'],
          },
        ],
        total: 2,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/documents').reply((config) => {
        expect(config.params.skip).toBe(0)
        expect(config.params.limit).toBe(100)
        return [200, mockResponse]
      })

      const result = await listDocuments()

      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(2)
    })

    it('debe listar documentos con paginación personalizada', async () => {
      const mockResponse: DocumentListResponse = {
        items: [],
        total: 50,
        skip: 20,
        limit: 10,
      }

      mock.onGet('/documents').reply((config) => {
        expect(config.params.skip).toBe(20)
        expect(config.params.limit).toBe(10)
        return [200, mockResponse]
      })

      const result = await listDocuments(20, 10)

      expect(result.skip).toBe(20)
      expect(result.limit).toBe(10)
    })

    it('debe retornar lista vacía si no hay documentos', async () => {
      const mockResponse: DocumentListResponse = {
        items: [],
        total: 0,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/documents').reply(200, mockResponse)

      const result = await listDocuments()

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getDocument', () => {
    it('debe obtener detalles de un documento', async () => {
      const mockResponse: DocumentDetailResponse = {
        id: 'doc1',
        title: 'Mi Documento',
        original_filename: 'test.pdf',
        file_size_bytes: 1024,
        mime_type: 'application/pdf',
        upload_date: '2024-01-01T00:00:00Z',
        user_id: 1,
        study_space_ids: ['space1'],
        text_content: 'Contenido extraído del PDF',
      }

      mock.onGet('/documents/doc1').reply(200, mockResponse)

      const result = await getDocument('doc1')

      expect(result).toEqual(mockResponse)
      expect(result.text_content).toBe('Contenido extraído del PDF')
    })

    it('debe fallar si el documento no existe', async () => {
      mock.onGet('/documents/nonexistent').reply(404, {
        detail: 'Document not found',
      })

      await expect(getDocument('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el documento no pertenece al usuario', async () => {
      mock.onGet('/documents/doc1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(getDocument('doc1')).rejects.toThrow()
    })
  })

  describe('updateDocumentTitle', () => {
    it('debe actualizar el título de un documento', async () => {
      const newTitle = { title: 'Nuevo Título' }

      const mockResponse: DocumentResponse = {
        id: 'doc1',
        title: 'Nuevo Título',
        original_filename: 'test.pdf',
        file_size_bytes: 1024,
        mime_type: 'application/pdf',
        upload_date: '2024-01-01T00:00:00Z',
        user_id: 1,
        study_space_ids: ['space1'],
      }

      mock.onPatch('/documents/doc1', newTitle).reply(200, mockResponse)

      const result = await updateDocumentTitle('doc1', newTitle)

      expect(result.title).toBe('Nuevo Título')
    })

    it('debe fallar si el documento no existe', async () => {
      mock.onPatch('/documents/nonexistent').reply(404, {
        detail: 'Document not found',
      })

      await expect(
        updateDocumentTitle('nonexistent', { title: 'Nuevo' })
      ).rejects.toThrow()
    })

    it('debe validar que el título no esté vacío', async () => {
      mock.onPatch('/documents/doc1').reply(400, {
        detail: 'Title cannot be empty',
      })

      await expect(updateDocumentTitle('doc1', { title: '' })).rejects.toThrow()
    })
  })

  describe('deleteDocument', () => {
    it('debe eliminar un documento correctamente', async () => {
      mock.onDelete('/documents/doc1').reply(204)

      await expect(deleteDocument('doc1')).resolves.toBeUndefined()
    })

    it('debe fallar si el documento no existe', async () => {
      mock.onDelete('/documents/nonexistent').reply(404, {
        detail: 'Document not found',
      })

      await expect(deleteDocument('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el documento no pertenece al usuario', async () => {
      mock.onDelete('/documents/doc1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(deleteDocument('doc1')).rejects.toThrow()
    })
  })

  describe('getStorageInfo', () => {
    it('debe obtener información de almacenamiento', async () => {
      const mockResponse: StorageInfo = {
        quota_bytes: 104857600,
        used_bytes: 52428800,
        available_bytes: 52428800,
        usage_percentage: 50.0,
      }

      mock.onGet('/documents/storage').reply(200, mockResponse)

      const result = await getStorageInfo()

      expect(result).toEqual(mockResponse)
      expect(result.usage_percentage).toBe(50.0)
    })

    it('debe manejar almacenamiento vacío', async () => {
      const mockResponse: StorageInfo = {
        quota_bytes: 104857600,
        used_bytes: 0,
        available_bytes: 104857600,
        usage_percentage: 0,
      }

      mock.onGet('/documents/storage').reply(200, mockResponse)

      const result = await getStorageInfo()

      expect(result.used_bytes).toBe(0)
      expect(result.usage_percentage).toBe(0)
    })

    it('debe manejar almacenamiento lleno', async () => {
      const mockResponse: StorageInfo = {
        quota_bytes: 104857600,
        used_bytes: 104857600,
        available_bytes: 0,
        usage_percentage: 100.0,
      }

      mock.onGet('/documents/storage').reply(200, mockResponse)

      const result = await getStorageInfo()

      expect(result.available_bytes).toBe(0)
      expect(result.usage_percentage).toBe(100.0)
    })
  })
})
