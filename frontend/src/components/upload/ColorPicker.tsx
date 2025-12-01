// frontend/src/components/upload/ColorPicker.tsx
/**
 * Color picker component for study space creation
 */
interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPicker({
  colors,
  selectedColor,
  onColorSelect,
}: ColorPickerProps) {
  return (
    <div>
      <label className="block text-xs text-slate-300 mb-2">Color</label>
      <div className="flex gap-2 flex-wrap">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-8 h-8 rounded-lg transition-all ${
              selectedColor === color
                ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
