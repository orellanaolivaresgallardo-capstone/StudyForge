// frontend/src/pages/documents/components/UploadZone.tsx
import { useState } from "react";

interface Props {
  maxFileSizeMB: number;
  onFileSelect: (file: File) => void;
}

export function UploadZone({ maxFileSizeMB, onFileSelect }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  };

  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
        Sube tu documento
      </h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput")?.click()}
        className={`
          relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? "border-green-500 bg-green-500/10"
            : "border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10"
          }
        `}
      >
        <input
          id="fileInput"
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <p className="text-slate-100">
          Arrastra un <strong>PDF, DOCX, PPTX o TXT</strong> o haz click para seleccionar
        </p>
        <p className="text-xs text-slate-300 mt-1">
          Máximo {maxFileSizeMB} MB por archivo
        </p>
      </div>
    </section>
  );
}
