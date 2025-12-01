/**
 * Modal for creating a new summary from a document
 */
import { useState } from 'react';
import { Modal } from '@/components';
import { EXPERTISE_LEVELS } from '@/constants/expertise';
import type { DocumentResponse, StudySpaceResponse, ExpertiseLevel } from '@/types';

interface CreateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentResponse[];
  studySpaces: StudySpaceResponse[];
  onSubmit: (data: { documentId: string; spaceId: string; title: string; level: ExpertiseLevel }) => Promise<void>;
  isCreating: boolean;
}

export function CreateSummaryModal({
  isOpen,
  onClose,
  documents,
  studySpaces,
  onSubmit,
  isCreating,
}: CreateSummaryModalProps) {
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('medio');

  const handleClose = () => {
    setSelectedDocId('');
    setSelectedSpaceId('');
    setSummaryTitle('');
    setExpertiseLevel('medio');
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit({
      documentId: selectedDocId,
      spaceId: selectedSpaceId,
      title: summaryTitle,
      level: expertiseLevel,
    });
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear resumen" size="lg">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
            Título (opcional)
          </label>
          <input
            type="text"
            value={summaryTitle}
            onChange={(e) => setSummaryTitle(e.target.value)}
            placeholder="Ej: Resumen de Matemáticas"
            className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
        </div>

        {/* Expertise Level */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
            Nivel de experiencia
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['basico', 'medio', 'avanzado'] as ExpertiseLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setExpertiseLevel(level)}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  expertiseLevel === level
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:border-violet-400/50'
                }`}
              >
                {EXPERTISE_LEVELS[level].label}
              </button>
            ))}
          </div>
        </div>

        {/* Study Space Selection */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
            Espacio de estudio *
          </label>
          {studySpaces.length === 0 ? (
            <div className="text-center py-8 text-slate-300">
              No tienes espacios de estudio. Crea uno primero.
            </div>
          ) : (
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all [&>option]:bg-slate-800 [&>option]:text-white"
            >
              <option value="" className="bg-slate-800 text-white">Selecciona un espacio...</option>
              {studySpaces.map((space) => (
                <option key={space.id} value={space.id} className="bg-slate-800 text-white">
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Document Selection */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
            Selecciona un documento *
          </label>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-300">
              No tienes documentos. Sube algunos primero.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedDocId === doc.id
                      ? 'bg-violet-500/20 border-violet-500/50'
                      : 'bg-white/5 border-white/10 hover:border-violet-400/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedDocId === doc.id
                          ? 'bg-violet-500 border-violet-500'
                          : 'border-white/30'
                      }`}
                    >
                      {selectedDocId === doc.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{doc.title}</p>
                      <p className="text-xs text-slate-300">
                        {doc.file_type.toUpperCase()} •{' '}
                        {(doc.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !selectedDocId || !selectedSpaceId}
            className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Generando...' : 'Generar resumen'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
