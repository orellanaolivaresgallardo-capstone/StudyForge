// frontend/src/pages/documents/DocumentsPage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStorage } from "@/context/StorageContext";
import { Toast, Modal, UploadDocumentModal } from "@/components";
import type { ToastType } from "@/components";
import {
  listDocuments,
  uploadDocument as apiUploadDocument,
  deleteDocument as apiDeleteDocument,
  listStudySpaces,
  createStudySpace,
} from "@/services/api";
import type { DocumentResponse, StudySpaceResponse } from "@/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { UploadZone, DocumentsList } from "./components";

export default function DocumentsPage() {
  const { user } = useAuth();
  const { refreshStorage } = useStorage();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [studySpaces, setStudySpaces] = useState<StudySpaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [docsResponse, spacesResponse] = await Promise.all([
        listDocuments(),
        listStudySpaces(),
      ]);
      setDocuments(docsResponse.items);
      setStudySpaces(spacesResponse.items);
    } catch (error) {
      console.error("Error loading data:", error);
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  function handleFileSelect(file: File) {
    if (!file) return;
    const allowedTypes = ["pdf", "docx", "pptx", "txt"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      showToast("Solo se permiten archivos PDF, DOCX, PPTX y TXT", "warning");
      return;
    }
    setSelectedFile(file);
    setShowUploadModal(true);
  }

  async function handleUploadWithSpaces(file: File, spaceIds: string[], title?: string) {
    try {
      await apiUploadDocument(file, spaceIds, title);
      showToast("Documento subido con éxito", "success");
      await loadData();
      await refreshStorage();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      if (error?.response?.status === 413) {
        showToast("El archivo es demasiado grande", "error");
      } else if (error?.response?.status === 507) {
        showToast("No tienes suficiente espacio de almacenamiento", "error");
      } else {
        showToast(getErrorMessage(error), "error");
      }
      throw error;
    }
  }

  async function handleCreateSpace(name: string, description?: string, color?: string): Promise<StudySpaceResponse> {
    try {
      const newSpace = await createStudySpace({ name, description, color });
      setStudySpaces((prev) => [...prev, newSpace]);
      showToast(`Espacio "${name}" creado con éxito`, "success");
      return newSpace;
    } catch (error: any) {
      console.error("Error creating space:", error);
      showToast(getErrorMessage(error), "error");
      throw error;
    }
  }

  async function confirmDeleteDocument() {
    if (!deleteModal) return;
    try {
      await apiDeleteDocument(deleteModal.id);
      showToast("Documento eliminado", "success");
      await loadData();
      await refreshStorage();
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast(getErrorMessage(error), "error");
    }
  }

  return (
    <>
      <UploadZone
        maxFileSizeMB={user?.max_file_size_bytes ? Math.round(user.max_file_size_bytes / 1024 / 1024) : 50}
        onFileSelect={handleFileSelect}
      />
      <DocumentsList documents={documents} isLoading={isLoading} onDelete={(id, title) => setDeleteModal({ id, title })} />

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Confirmar eliminación"
          size="sm"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-slate-100">
                ¿Estás seguro de que quieres eliminar <strong>"{deleteModal.title}"</strong>?
              </p>
              <p className="text-sm text-slate-300">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteDocument}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        availableSpaces={studySpaces}
        onUpload={handleUploadWithSpaces}
        onCreateSpace={handleCreateSpace}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
