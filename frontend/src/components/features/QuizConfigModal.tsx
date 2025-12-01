// frontend/src/components/QuizConfigModal.tsx
/**
 * Modal reutilizable para configurar la generación de quizzes.
 * Usado desde SummaryDetailPage y StudySpaceDetailPage.
 */
import { useState, useEffect } from "react";
import { Modal } from "@/components";

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (numQuestions: number) => Promise<void>;
  isGenerating: boolean;
  title?: string;
  description: string | React.ReactNode;
}

export function QuizConfigModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  title = "Generar cuestionario",
  description,
}: QuizConfigModalProps) {
  const [quizQuestions, setQuizQuestions] = useState(10);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setQuizQuestions(10);
      setValidationError(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    // Validación client-side
    if (quizQuestions < 5 || quizQuestions > 30) {
      setValidationError("El número de preguntas debe estar entre 5 y 30");
      return;
    }

    setValidationError(null);
    await onGenerate(quizQuestions);
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      showCloseButton={!isGenerating}
      allowClose={!isGenerating}
    >
      <div className="space-y-6">
        {/* Descripción */}
        <p className="text-slate-100">
          {description}
        </p>

        {/* Input de número de preguntas */}
        <div>
          <label className="block text-slate-100 font-semibold mb-2">
            Número de preguntas
          </label>
          <input
            type="number"
            min="5"
            max="30"
            value={quizQuestions}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setQuizQuestions(10);
                setValidationError(null);
                return;
              }
              const num = Number(value);
              if (!isNaN(num)) {
                setQuizQuestions(Math.min(30, Math.max(5, num)));
                setValidationError(null);
              }
            }}
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (isNaN(value) || value < 5) {
                setQuizQuestions(5);
              } else if (value > 30) {
                setQuizQuestions(30);
              }
              setValidationError(null);
            }}
            disabled={isGenerating}
            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/20 text-white focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
          <p className="text-xs text-slate-300 mt-1">
            Entre 5 y 30 preguntas (recomendado: 10)
          </p>
          {validationError && (
            <p className="text-xs text-red-400 mt-1">{validationError}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generando..." : "Generar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
