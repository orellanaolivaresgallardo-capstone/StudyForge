// frontend/src/components/UploadDocumentModal.tsx
/**
 * Upload Document Modal - REFACTORED VERSION
 * Reduced from 270 → ~130 lines using extracted components
 */
import { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import { CreateSpaceForm, SpaceSelector } from "./upload";
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
  "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#3B82F6", "#6366F1", "#14B8A6",
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
              <p className="text-sm text-slate-300">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>

        {/* Title input */}
        <div>
          <label className="block text-sm font-medium text-slate-100 mb-2">
            Título (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del documento"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Space selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-100">
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
            <CreateSpaceForm
              name={newSpaceName}
              description={newSpaceDescription}
              color={newSpaceColor}
              colors={DEFAULT_COLORS}
              isCreating={isCreatingSpace}
              onNameChange={setNewSpaceName}
              onDescriptionChange={setNewSpaceDescription}
              onColorChange={setNewSpaceColor}
              onSubmit={handleCreateSpace}
            />
          ) : (
            <SpaceSelector
              spaces={availableSpaces}
              selectedIds={selectedSpaceIds}
              onToggleSpace={handleToggleSpace}
            />
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
