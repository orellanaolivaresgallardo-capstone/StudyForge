/**
 * Modal for editing study space details
 */
import { Modal } from '@/components';
import { STUDY_SPACE_COLORS } from '@/constants/studySpaceColors';
import type { StudySpaceDetailResponse, StudySpaceUpdate } from '@/types';

interface EditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: StudySpaceDetailResponse | null;
  form: { name: string; description: string; color: string };
  onFormChange: (form: { name: string; description: string; color: string }) => void;
  onSubmit: (data: StudySpaceUpdate) => Promise<void>;
  isUpdating: boolean;
}

export function EditSpaceModal({
  isOpen,
  onClose,
  space,
  form,
  onFormChange,
  onSubmit,
  isUpdating,
}: EditSpaceModalProps) {
  if (!space) return null;

  const handleSubmit = async () => {
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      color: form.color,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Espacio" size="lg">
      <div className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-slate-100 font-semibold mb-2">
            Nombre del Espacio *
          </label>
          <input
            type="text"
            id="name"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="Ej: Matemáticas Avanzadas"
            className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-slate-100 font-semibold mb-2">
            Contexto del espacio (opcional)
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
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
                onClick={() => onFormChange({ ...form, color: color.value })}
                className={`h-12 rounded-xl transition-all duration-200 ${
                  form.color === color.value
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
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating || !form.name.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
