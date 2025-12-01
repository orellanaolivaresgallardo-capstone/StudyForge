/**
 * Modal for adding resources (summaries or documents) to study space
 */
import { Modal, LoadingSpinner } from '@/components';
import type { SummaryResponse, DocumentResponse } from '@/types';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'summary' | 'document';
  resources: (SummaryResponse | DocumentResponse)[];
  isLoading: boolean;
  onAddResource: (id: string) => Promise<void>;
}

export function AddResourceModal({
  isOpen,
  onClose,
  type,
  resources,
  isLoading,
  onAddResource,
}: AddResourceModalProps) {
  const title = `Agregar ${type === 'summary' ? 'Resumen' : 'Documento'}`;
  const emptyMessage = `No hay ${type === 'summary' ? 'resúmenes' : 'documentos'} disponibles para agregar`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="sm" />
        </div>
      ) : resources.length === 0 ? (
        <p className="text-slate-300 text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              onClick={() => onAddResource(resource.id)}
              className="border border-white/20 hover:border-violet-500 rounded-xl p-4 cursor-pointer transition-colors bg-white/5 hover:bg-white/10"
            >
              <h3 className="font-semibold text-white">{resource.title}</h3>
              {'file_name' in resource && (
                <p className="text-sm text-slate-300 mt-1">{resource.file_name}</p>
              )}
              {'topics' in resource && resource.topics && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {resource.topics.slice(0, 3).map((topic: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-1 rounded text-xs"
                    >
                      {topic}
                    </span>
                  ))}
                  {resource.topics.length > 3 && (
                    <span className="px-2 py-1 bg-white/10 text-slate-300 rounded text-xs">
                      +{resource.topics.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
