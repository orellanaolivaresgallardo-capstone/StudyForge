import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuizResponse } from '@/types';

export interface QuizCardProps {
  quiz: QuizResponse;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/quizzes/${quiz.id}/attempt`);
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'text-green-400';
    if (level <= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return 'Fácil';
    if (level <= 3) return 'Medio';
    return 'Difícil';
  };

  const getSourceIcon = () => {
    if (quiz.source_type === 'study_space') { // NEW: Updated value
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (quiz.source_type === 'summary') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    // source_type === 'document' (NEW: Updated from 'file')
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getSourceLabel = () => {
    switch (quiz.source_type) {
      case 'study_space':
        return 'Espacio';
      case 'summary':
        return 'Resumen';
      case 'document':
        return 'Documento';
      default:
        return 'Desconocido';
    }
  };

  const getSourceName = () => {
    if (!quiz.source_names) return null;

    // Get the first available source name from the JSONB object
    if (quiz.source_type === 'study_space' && quiz.source_names.space) {
      return quiz.source_names.space;
    }
    if (quiz.source_type === 'summary' && quiz.source_names.summary) {
      return quiz.source_names.summary;
    }
    if (quiz.source_type === 'document' && quiz.source_names.document) {
      return quiz.source_names.document;
    }

    return null;
  };

  return (
    <div
      onClick={handleClick}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/70 hover:border-brand-500/50 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors flex-1 line-clamp-2 break-words" title={quiz.title}>
          {quiz.title}
        </h3>
        <span className={`text-sm font-medium ${getDifficultyColor(quiz.difficulty_level)} ml-3 flex-shrink-0`}>
          {getDifficultyLabel(quiz.difficulty_level)}
        </span>
      </div>

      {/* Origin Info - NEW: Source Type Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
          {getSourceIcon()}
          {getSourceLabel()}
        </span>
        {getSourceName() && (
          <span className="text-sm text-slate-100 truncate" title={getSourceName() || undefined}>
            {getSourceName()}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-slate-200 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{quiz.num_questions} preguntas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{quiz.num_attempts} intentos</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{new Date(quiz.created_at).toLocaleDateString('es-ES')}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
