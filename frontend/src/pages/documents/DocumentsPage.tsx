// frontend/src/pages/documents/DocumentsPage.tsx
/**
 * Página principal de gestión de documentos.
 * Conserva el diseño aurora del HTML original.
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navbar, Toast, Modal, UploadDocumentModal } from "@/components";
import type { ToastType } from "@/components";
import {
  listDocuments,
  uploadDocument as apiUploadDocument,
  deleteDocument as apiDeleteDocument,
  listStudySpaces,
  createStudySpace,
} from "@/services/api";
import type { DocumentResponse, StudySpaceResponse } from "@/types";

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [studySpaces, setStudySpaces] = useState<StudySpaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Estado de upload
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Estado de modal de confirmación
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
      setToast({ message: "No se pudieron cargar los datos", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  function handleFileSelect(file: File) {
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["pdf", "docx", "pptx", "txt"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      showToast("Solo se permiten archivos PDF, DOCX, PPTX y TXT", "warning");
      return;
    }

    // Abrir modal con el archivo seleccionado
    setSelectedFile(file);
    setShowUploadModal(true);
  }

  async function handleUploadWithSpaces(
    file: File,
    spaceIds: string[],
    title?: string
  ) {
    try {
      await apiUploadDocument(file, spaceIds, title);
      showToast("Documento subido con éxito", "success");
      await loadData();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      if (error?.response?.status === 413) {
        showToast("El archivo es demasiado grande", "error");
      } else if (error?.response?.status === 507) {
        showToast("No tienes suficiente espacio de almacenamiento", "error");
      } else if (error?.response?.status === 400) {
        showToast("Debes asignar el documento a un espacio de estudio", "error");
      } else {
        showToast("No se pudo subir el documento", "error");
      }
      throw error;
    }
  }

  async function handleCreateSpace(
    name: string,
    description?: string,
    color?: string
  ): Promise<StudySpaceResponse> {
    try {
      const newSpace = await createStudySpace({ name, description, color });
      setStudySpaces((prev) => [...prev, newSpace]);
      showToast(`Espacio "${name}" creado con éxito`, "success");
      return newSpace;
    } catch (error: any) {
      console.error("Error creating space:", error);
      showToast("No se pudo crear el espacio", "error");
      throw error;
    }
  }

  async function confirmDeleteDocument() {
    if (!deleteModal) return;

    try {
      await apiDeleteDocument(deleteModal.id);
      showToast("Documento eliminado", "success");
      await loadData();
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("No se pudo eliminar el documento", "error");
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Clear input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-10">
        {/* Upload Zone */}
        <section className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
            Sube tu documento
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`
              relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging
                ? "border-green-500 bg-green-500/10"
                : "border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }
            `}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <p className="text-white/80">
              Arrastra un <strong>PDF, DOCX, PPTX o TXT</strong> o haz click para seleccionar
            </p>
            <p className="text-xs text-white/60 mt-1">
              Máximo {user?.max_file_size_bytes ? Math.round(user.max_file_size_bytes / 1024 / 1024) : 50} MB por archivo
            </p>
          </div>
        </section>

        {/* Documents List */}
        <section className="mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">Mis documentos</h2>
            <div className="text-sm text-white/60">
              Total: <span className="text-white font-medium">{documents.length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-5 w-1/3 bg-white/10 rounded"></div>
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5l8.485-4.243a2 2 0 011.03-.257L21 3.75M3 7.5V18a2.25 2.25 0 002.25 2.25H18A2.25 2.25 0 0020.25 18V6M3 7.5l9 4.5 8.25-4.125"
                />
              </svg>
              <div>
                <div className="font-medium text-white">Aún no tienes documentos</div>
                <div className="text-white/60 text-xs">Sube uno arriba para comenzar</div>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                      <p className="text-sm text-white/60 mt-1">
                        {doc.file_type.toUpperCase()} • {Math.round(doc.file_size_bytes / 1024)} KB
                        {" • "}
                        {new Date(doc.created_at).toLocaleDateString("es-ES")}
                      </p>
                      {doc.study_space_names && doc.study_space_names.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {doc.study_space_names.map((spaceName, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30"
                            >
                              <svg
                                className="w-3 h-3 inline mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                              {spaceName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteModal({ id: doc.id, title: doc.title })}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

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
              <p className="text-white/80">
                ¿Estás seguro de que quieres eliminar <strong>"{deleteModal.title}"</strong>?
              </p>
              <p className="text-sm text-white/60">
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
    </div>
  );
}
