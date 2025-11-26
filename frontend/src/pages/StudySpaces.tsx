// frontend/src/pages/StudySpaces.tsx
/**
 * Página de gestión de espacios de estudio.
 * Permite crear, editar y eliminar espacios de estudio.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast, { ToastType } from "../components/Toast";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import {
  listStudySpaces,
  createStudySpace,
  deleteStudySpace,
  updateStudySpace,
} from "../services/api";
import type { StudySpaceResponse } from "../types/api.types";

export default function StudySpacesPage() {
  const navigate = useNavigate();

  // Estado de espacios
  const [spaces, setSpaces] = useState<StudySpaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Estado de modal (crear/editar)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDescription, setSpaceDescription] = useState("");
  const [spaceColor, setSpaceColor] = useState("#8B5CF6");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSpaces();
  }, []);

  async function loadSpaces() {
    try {
      setIsLoading(true);
      const response = await listStudySpaces();
      setSpaces(response.items);
    } catch (error) {
      console.error("Error loading study spaces:", error);
      showToast("No se pudieron cargar los espacios de estudio", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  function handleOpenCreateModal() {
    setIsEditing(false);
    setEditingSpaceId(null);
    setSpaceName("");
    setSpaceDescription("");
    setSpaceColor("#8B5CF6");
    setShowModal(true);
  }

  function handleOpenEditModal(space: StudySpaceResponse) {
    setIsEditing(true);
    setEditingSpaceId(space.id);
    setSpaceName(space.name);
    setSpaceDescription(space.description || "");
    setSpaceColor(space.color);
    setShowModal(true);
  }

  async function handleSaveSpace() {
    if (!spaceName.trim()) {
      showToast("El nombre del espacio es obligatorio", "warning");
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing && editingSpaceId) {
        // Actualizar espacio
        await updateStudySpace(editingSpaceId, {
          name: spaceName,
          description: spaceDescription || null,
          color: spaceColor,
        });
        showToast("Espacio actualizado exitosamente", "success");
      } else {
        // Crear nuevo espacio
        await createStudySpace({
          name: spaceName,
          description: spaceDescription || null,
          color: spaceColor,
        });
        showToast("Espacio creado exitosamente", "success");
      }
      setShowModal(false);
      loadSpaces();
    } catch (error: unknown) {
      console.error("Error saving study space:", error);
      const errorMessage =
        error instanceof Error &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "detail" in error.response.data
          ? String(error.response.data.detail)
          : "Error al guardar el espacio";
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSpace(spaceId: string, name: string) {
    if (!confirm(`¿Eliminar el espacio "${name}"?`)) return;

    try {
      await deleteStudySpace(spaceId);
      showToast("Espacio eliminado", "success");
      setSpaces(spaces.filter((s) => s.id !== spaceId));
    } catch (error) {
      console.error("Error deleting study space:", error);
      showToast("No se pudo eliminar el espacio", "error");
    }
  }

  function handleViewSpace(spaceId: string) {
    navigate(`/study-spaces/${spaceId}`);
  }

  // Colores predefinidos para selección rápida
  const colorOptions = [
    { name: "Violeta", value: "#8B5CF6" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Azul", value: "#3B82F6" },
    { name: "Verde", value: "#10B981" },
    { name: "Amarillo", value: "#F59E0B" },
    { name: "Rojo", value: "#EF4444" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      <Navbar />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Espacios de Estudio
            </h1>
            <p className="text-white/60 mt-2">
              Organiza tus documentos y resúmenes en espacios temáticos
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            + Crear Espacio
          </button>
        </div>

        {/* Lista de espacios */}
        {isLoading ? (
          <LoadingSpinner message="Cargando espacios de estudio..." />
        ) : spaces.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="w-8 h-8 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            }
            title="No tienes espacios de estudio aún"
            description="Crea tu primer espacio para comenzar a organizar tu estudio"
            action={{
              label: "+ Crear Espacio",
              onClick: handleOpenCreateModal,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
                onClick={() => handleViewSpace(space.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: space.color }}
                  >
                    <svg
                      className="w-6 h-6 text-white"
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
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(space);
                      }}
                      className="text-white/60 hover:text-violet-400 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSpace(space.id, space.name);
                      }}
                      className="text-white/60 hover:text-red-400 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                  {space.name}
                </h3>

                {space.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {space.description}
                  </p>
                )}

                <div className="text-xs text-white/50">
                  Creado el {new Date(space.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? "Editar Espacio" : "Crear Nuevo Espacio"}
        size="lg"
      >
        <div className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-white/80 font-semibold mb-2">
              Nombre del Espacio *
            </label>
            <input
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="Ej: Matemáticas Avanzadas"
              className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-white/80 font-semibold mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={spaceDescription}
              onChange={(e) => setSpaceDescription(e.target.value)}
              placeholder="Describe el contenido de este espacio..."
              rows={3}
              className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-white/80 font-semibold mb-3">
              Color del Espacio
            </label>
            <div className="grid grid-cols-6 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSpaceColor(color.value)}
                  className={`h-12 rounded-xl transition-all duration-200 ${
                    spaceColor === color.value
                      ? "ring-4 ring-white ring-offset-2 ring-offset-slate-800 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setShowModal(false)}
              disabled={isSaving}
              className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSpace}
              disabled={isSaving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
