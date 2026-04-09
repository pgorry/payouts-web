import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';

interface FileDropZoneProps {
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  accept?: string;
}

export function FileDropZone({ onFileLoaded, accept = '.xls,.xlsx' }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        onFileLoaded(e.target.result, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-teal bg-teal/5'
          : fileName
            ? 'border-emerald/50 bg-emerald/5'
            : 'border-border-accent hover:border-teal/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {fileName ? (
        <div>
          <div className="text-emerald text-lg font-medium mb-1">✓ {fileName}</div>
          <div className="text-text-muted text-sm">Click or drop to replace</div>
        </div>
      ) : (
        <div>
          <div className="text-3xl mb-2">📁</div>
          <div className="text-text-muted">
            Drop your XLS file here or <span className="text-teal underline">browse</span>
          </div>
        </div>
      )}
    </div>
  );
}
