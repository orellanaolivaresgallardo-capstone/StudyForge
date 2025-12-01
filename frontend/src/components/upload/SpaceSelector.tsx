// frontend/src/components/upload/SpaceSelector.tsx
/**
 * Space selection list component
 */
import type { StudySpaceResponse } from "@/types";

interface SpaceSelectorProps {
  spaces: StudySpaceResponse[];
  selectedIds: string[];
  onToggleSpace: (spaceId: string) => void;
}

export function SpaceSelector({
  spaces,
  selectedIds,
  onToggleSpace,
}: SpaceSelectorProps) {
  if (spaces.length === 0) {
    return (
      <div className="text-center py-6 text-slate-300 text-sm">
        No tienes espacios de estudio. Crea uno arriba para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {spaces.map((space) => (
        <label
          key={space.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(space.id)}
            onChange={() => onToggleSpace(space.id)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
          />
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: space.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{space.name}</p>
            {space.description && (
              <p className="text-xs text-slate-300 truncate">
                {space.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
