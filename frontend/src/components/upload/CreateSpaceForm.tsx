// frontend/src/components/upload/CreateSpaceForm.tsx
/**
 * Form for creating a new study space
 */
import { ColorPicker } from "./ColorPicker";

interface CreateSpaceFormProps {
  name: string;
  description: string;
  color: string;
  colors: string[];
  isCreating: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onColorChange: (color: string) => void;
  onSubmit: () => void;
}

export function CreateSpaceForm({
  name,
  description,
  color,
  colors,
  isCreating,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onSubmit,
}: CreateSpaceFormProps) {
  return (
    <div className="space-y-3 rounded-xl bg-white/5 border border-white/10 p-4">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Nombre del espacio *"
        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Descripción (opcional)"
        rows={2}
        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
      />
      <ColorPicker
        colors={colors}
        selectedColor={color}
        onColorSelect={onColorChange}
      />
      <button
        onClick={onSubmit}
        disabled={!name.trim() || isCreating}
        className="w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold transition-colors"
      >
        {isCreating ? "Creando..." : "Crear espacio"}
      </button>
    </div>
  );
}
