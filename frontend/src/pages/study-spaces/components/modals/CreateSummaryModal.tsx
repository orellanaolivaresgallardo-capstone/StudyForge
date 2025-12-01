/**
 * Modal for creating summary from document
 */
import { Modal } from '@/components';
import type { DocumentResponse, ExpertiseLevel } from '@/types';
import { EXPERTISE_LEVELS } from '@/constants/expertise';

interface CreateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentResponse | null;
  expertiseLevel: ExpertiseLevel;
  onExpertiseLevelChange: (level: ExpertiseLevel) => void;
  onSubmit: () => Promise<void>;
  isCreating: boolean;
}

export function CreateSummaryModal({
  isOpen,
  onClose,
  document,
  expertiseLevel,
  onExpertiseLevelChange,
  onSubmit,
  isCreating,
}: CreateSummaryModalProps) {
  if (!document) return null;

  const levels: ExpertiseLevel[] = ['basico', 'medio', 'avanzado'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar Resumen"
      size="sm"
      showCloseButton={!isCreating}
      allowClose={!isCreating}
    >
      <div className="space-y-6">
        <div>
          <p className="text-slate-100 mb-2">
            Documento: <strong>{document.title}</strong>
          </p>
          <p className="text-sm text-slate-300">
            Se generará un resumen automáticamente usando IA
          </p>
        </div>

        <div>
          <label className="block text-slate-100 font-semibold mb-3">
            Nivel de Expertise
          </label>
          <div className="space-y-2">
            {levels.map((level) => {
              const config = EXPERTISE_LEVELS[level];
              return (
                <label
                  key={level}
                  className={`
                    flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${expertiseLevel === level
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="expertise"
                    value={level}
                    checked={expertiseLevel === level}
                    onChange={() => onExpertiseLevelChange(level)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white capitalize">{config.label}</div>
                    <div className="text-sm text-slate-300 mt-1">{config.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={isCreating}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {isCreating ? 'Generando...' : 'Generar Resumen'}
          </button>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
