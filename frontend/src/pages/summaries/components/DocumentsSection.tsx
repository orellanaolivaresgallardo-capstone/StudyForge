// frontend/src/pages/summaries/components/DocumentsSection.tsx
import { useNavigate } from "react-router-dom";
import type { DocumentResponse } from "@/types";

interface Props {
  document: DocumentResponse | null;
}

export function DocumentsSection({ document }: Props) {
  const navigate = useNavigate();

  if (!document) return null;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Documento fuente
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/documents")}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500 hover:bg-white/10 transition-all text-left group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate">
                {document.title}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                {document.file_type.toUpperCase()} • {(document.file_size_bytes / 1024).toFixed(1)} KB
              </p>
            </div>
            <svg className="w-5 h-5 text-white/50 group-hover:text-violet-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
