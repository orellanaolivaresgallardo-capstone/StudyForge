// frontend/src/pages/documents/components/DocumentsList.tsx
import type { DocumentResponse } from "@/types";

interface Props {
  documents: DocumentResponse[];
  isLoading: boolean;
  onDelete: (id: string, title: string) => void;
}

export function DocumentsList({ documents, isLoading, onDelete }: Props) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0 mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">Mis documentos</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-5 w-1/3 bg-white/10 rounded"></div>
                <div className="h-4 w-2/3 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0 mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">Mis documentos</h2>
        <div className="text-sm text-slate-300">
          Total: <span className="text-white font-medium">{documents.length}</span>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7.5l8.485-4.243a2 2 0 011.03-.257L21 3.75M3 7.5V18a2.25 2.25 0 002.25 2.25H18A2.25 2.25 0 0020.25 18V6M3 7.5l9 4.5 8.25-4.125"
            />
          </svg>
          <div>
            <div className="font-medium text-white">Aún no tienes documentos</div>
            <div className="text-slate-300 text-xs">Sube uno arriba para comenzar</div>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {doc.file_type.toUpperCase()} • {Math.round(doc.file_size_bytes / 1024)} KB
                    {" • "}
                    {new Date(doc.created_at).toLocaleDateString("es-ES")}
                  </p>
                  {doc.study_space_names && doc.study_space_names.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {doc.study_space_names.map((spaceName, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30"
                        >
                          <svg
                            className="w-3 h-3 inline mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          {spaceName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onDelete(doc.id, doc.title)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
