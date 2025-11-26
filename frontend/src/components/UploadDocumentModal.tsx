// frontend/src/components/UploadDocumentModal.tsx
/**
 * Modal para subir documentos con asignación obligatoria a espacios de estudio.
 */
import { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import type { StudySpaceResponse } from "@/types";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  availableSpaces: StudySpaceResponse[];
  onUpload: (file: File, spaceIds: string[], title?: string) => Promise<void>;
  onCreateSpace: (name: string, description?: string, color?: string) => Promise<StudySpaceResponse>;
}

const DEFAULT_COLORS = [
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // green
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#14B8A6", // teal
];

export function UploadDocumentModal({
  isOpen,
  onClose,
  file,
  availableSpaces,
  onUpload,
  onCreateSpace,
}: UploadDocumentModalProps) {
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);

  // New space form
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState(DEFAULT_COLORS[0]);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && file) {
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      setSelectedSpaceIds([]);
      setShowCreateSpace(availableSpaces.length === 0);
      setNewSpaceName("");
      setNewSpaceDescription("");
      setNewSpaceColor(DEFAULT_COLORS[0]);
    }
  }, [isOpen, file, availableSpaces.length]);

  const handleToggleSpace = (spaceId: string) => {
    setSelectedSpaceIds((prev) =>
      prev.includes(spaceId)
        ? prev.filter((id) => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;

    try {
      setIsCreatingSpace(true);
      const newSpace = await onCreateSpace(
        newSpaceName,
        newSpaceDescription || undefined,
        newSpaceColor
      );

      // Auto-select the new space
      setSelectedSpaceIds([newSpace.id]);
      setShowCreateSpace(false);
      setNewSpaceName("");
      setNewSpaceDescription("");
      setNewSpaceColor(DEFAULT_COLORS[0]);
    } catch (error) {
      console.error("Error creating space:", error);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleUpload = async () => {
    if (!file || selectedSpaceIds.length === 0) return;

    try {
      setIsUploading(true);
      await onUpload(file, selectedSpaceIds, title || undefined);
      onClose();
    } catch (error) {
      console.error("Error uploading:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!file) return null;

  const canUpload = selectedSpaceIds.length > 0 && !isUploading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Subir documento" size="md">
      <div className="space-y-6">
        {/* File info */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-10 h-10 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{file.name}</p>
              <p className="text-sm text-white/60">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>

        {/* Title input */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Título (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del documento"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Space selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-white/80">
              Asignar a espacio de estudio <span className="text-red-400">*</span>
            </label>
            {availableSpaces.length > 0 && (
              <button
                onClick={() => setShowCreateSpace(!showCreateSpace)}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {showCreateSpace ? "Cancelar" : "+ Crear nuevo"}
              </button>
            )}
          </div>

          {showCreateSpace ? (
            /* Create new space form */
            <div className="space-y-3 rounded-xl bg-white/5 border border-white/10 p-4">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Nombre del espacio *"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div>
                <label className="block text-xs text-white/60 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewSpaceColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        newSpaceColor === color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim() || isCreatingSpace}
                className="w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold transition-colors"
              >
                {isCreatingSpace ? "Creando..." : "Crear espacio"}
              </button>
            </div>
          ) : availableSpaces.length === 0 ? (
            <div className="text-center py-6 text-white/60 text-sm">
              No tienes espacios de estudio. Crea uno arriba para continuar.
            </div>
          ) : (
            /* Space selection list */
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableSpaces.map((space) => (
                <label
                  key={space.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSpaceIds.includes(space.id)}
                    onChange={() => handleToggleSpace(space.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: space.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{space.name}</p>
                    {space.description && (
                      <p className="text-xs text-white/60 truncate">{space.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {selectedSpaceIds.length === 0 && !showCreateSpace && availableSpaces.length > 0 && (
            <p className="text-xs text-red-400 mt-2">
              Debes seleccionar al menos un espacio
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!canUpload}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-semibold transition-all"
          >
            {isUploading ? "Subiendo..." : "Subir documento"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
