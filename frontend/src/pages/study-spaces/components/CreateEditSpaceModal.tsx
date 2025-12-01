/**
 * Modal for creating or editing a study space
 */
import { useState, useEffect } from 'react';
import { Modal } from '@/components';
import { STUDY_SPACE_COLORS, DEFAULT_SPACE_COLOR } from '@/constants/studySpaceColors';
import type { StudySpaceWithStatsResponse } from '@/types';

interface CreateEditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  editingSpace: StudySpaceWithStatsResponse | null;
  onSubmit: (data: { name: string; description: string | null; color: string }) => Promise<void>;
  isSaving: boolean;
}

export function CreateEditSpaceModal({
  isOpen,
  onClose,
  isEditing,
  editingSpace,
  onSubmit,
  isSaving,
}: CreateEditSpaceModalProps) {
  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [spaceColor, setSpaceColor] = useState(DEFAULT_SPACE_COLOR);

  // Reset form when modal opens or editing space changes
  useEffect(() => {
    if (isOpen && editingSpace) {
      setSpaceName(editingSpace.name);
      setSpaceDescription(editingSpace.description || '');
      setSpaceColor(editingSpace.color);
    } else if (isOpen && !editingSpace) {
      setSpaceName('');
      setSpaceDescription('');
      setSpaceColor(DEFAULT_SPACE_COLOR);
    }
  }, [isOpen, editingSpace]);

  const handleClose = () => {
    setSpaceName('');
    setSpaceDescription('');
    setSpaceColor(DEFAULT_SPACE_COLOR);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit({
      name: spaceName,
      description: spaceDescription || null,
      color: spaceColor,
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
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

        {/* Description */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
            Contexto del espacio (opcional)
          </label>
          <textarea
            value={spaceDescription}
            onChange={(e) => setSpaceDescription(e.target.value)}
            placeholder="Ej: Curso nivel universitario de cálculo diferencial e integral, enfoque en aplicaciones prácticas"
            rows={3}
            className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-slate-100 font-semibold mb-3">
            Color del Espacio
          </label>
          <div className="grid grid-cols-6 gap-3">
            {STUDY_SPACE_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSpaceColor(color.value)}
                className={`h-12 rounded-xl transition-all duration-200 ${
                  spaceColor === color.value
                    ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !spaceName.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
