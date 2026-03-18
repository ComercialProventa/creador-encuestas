'use client';

import { Plus, X } from 'lucide-react';

interface OptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

export default function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const addOption = () => {
    onChange([...options, `Opción ${options.length + 1}`]);
  };

  const updateOption = (index: number, value: string) => {
    onChange(options.map((opt, i) => (i === index ? value : opt)));
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Opciones
      </p>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
            {index + 1}
          </span>
          <input
            type="text"
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            placeholder={`Opción ${index + 1}`}
            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={() => removeOption(index)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Eliminar opción"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
      >
        <Plus size={14} />
        Agregar opción
      </button>
    </div>
  );
}
