'use client';

import { useState } from 'react';
import { FlaskConical, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { generateMockResponses, type Sentiment } from '@/actions/seed';
import { clearMockResponses } from '@/actions/seed';

interface MockDataPanelProps {
  surveyId: string;
  onDataChanged?: () => void; // callback to refresh parent data
}

const SENTIMENT_OPTIONS: { value: Sentiment; label: string; emoji: string; description: string }[] = [
  { value: 'positive', label: 'Positivo', emoji: '😍', description: 'Respuestas mayormente altas / satisfechas' },
  { value: 'neutral',  label: 'Neutro',   emoji: '😐', description: 'Respuestas centradas, promedio' },
  { value: 'negative', label: 'Negativo', emoji: '😡', description: 'Respuestas bajas / insatisfechas' },
  { value: 'mixed',    label: 'Mixto',    emoji: '🎲', description: 'Distribución aleatoria sin sesgo' },
];

const COUNT_PRESETS = [10, 50, 100, 200, 500];

export default function MockDataPanel({ surveyId, onDataChanged }: MockDataPanelProps) {
  const [count, setCount] = useState<number>(100);
  const [sentiment, setSentiment] = useState<Sentiment>('mixed');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    const confirmText = prompt(`¡ALERTA MÁXIMA!\n\nVas a inyectar ${count} respuestas simuladas en esta encuesta, lo que alterará las métricas visibles.\n\nPara confirmar esta acción, escribe exactamente la palabra: GENERAR`);
    
    if (confirmText !== 'GENERAR') {
      alert('🔒 Operación cancelada. (No escribiste "GENERAR" correctamente)');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await generateMockResponses({ surveyId, count, sentiment });
      if (res.success) {
        setResult({ ok: true, message: `✅ Se insertaron ${res.inserted} respuestas correctamente.` });
        onDataChanged?.();
      } else {
        setResult({ ok: false, message: `Error: ${res.error}` });
      }
    } catch (e: any) {
      setResult({ ok: false, message: e.message ?? 'Error desconocido.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const confirmText = prompt(`¡PELIGRO CRÍTICO DE PÉRDIDA DE DATOS!\n\nEsta acción ELIMINARÁ PARA SIEMPRE TODAS las respuestas (tanto reales como falsas) de esta encuesta. Es absolutamente irreversible.\n\nPara confirmar la destrucción total de los datos, escribe la palabra: ELIMINAR`);
    
    if (confirmText !== 'ELIMINAR') {
      alert('🔒 Operación de borrado masivo abortada por seguridad.');
      return;
    }

    setClearing(true);
    setResult(null);
    try {
      const res = await clearMockResponses(surveyId);
      if (res.success) {
        setResult({ ok: true, message: `🗑️ Se borraron TODAS las respuestas correctamente.` });
        onDataChanged?.();
      } else {
        setResult({ ok: false, message: `Error al borrar: ${res.error}` });
      }
    } catch (e: any) {
      setResult({ ok: false, message: e.message ?? 'Error desconocido.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
          <FlaskConical size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Generador de Datos de Prueba</h2>
          <p className="text-xs text-slate-500">Inserta respuestas simuladas para probar el Dashboard</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Count selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Cantidad de Respuestas
          </label>
          <div className="flex flex-wrap gap-2">
            {COUNT_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
                  count === n
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              placeholder="Otro"
            />
          </div>
        </div>

        {/* Sentiment selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Sesgo / Sentimiento
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SENTIMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSentiment(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                  sentiment === opt.value
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className={`text-xs font-bold ${sentiment === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] leading-tight text-slate-400 hidden sm:block">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || clearing}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FlaskConical size={16} />
            )}
            {loading ? `Generando ${count} respuestas...` : `Generar ${count} respuestas`}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading || clearing}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
          >
            {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {clearing ? 'Borrando...' : 'Limpiar todo'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
              result.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {result.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
