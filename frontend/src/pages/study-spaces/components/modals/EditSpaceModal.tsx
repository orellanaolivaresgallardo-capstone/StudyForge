/**
 * Modal for editing study space details
 */
import { Modal } from '@/components';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Espacio" size="md">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-white/80 font-semibold mb-2">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Nombre del espacio"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-white/80 font-semibold mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
            placeholder="Descripción del espacio (opcional)"
          />
        </div>

        <div>
          <label htmlFor="color" className="block text-white/80 font-semibold mb-2">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="color"
              value={form.color}
              onChange={(e) => onFormChange({ ...form, color: e.target.value })}
              className="h-10 w-20 rounded cursor-pointer"
            />
            <span className="text-sm text-white/60">{form.color}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isUpdating || !form.name.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
