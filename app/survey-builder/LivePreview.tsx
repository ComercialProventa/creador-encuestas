'use client';

import { Star } from 'lucide-react';
import { Question } from './types';

interface LivePreviewProps {
  surveyTitle: string;
  surveyDescription: string;
  questions: Question[];
  primaryColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

export default function LivePreview({
  surveyTitle,
  surveyDescription,
  questions,
  primaryColor = '#6366f1',
  logoUrl,
  coverImageUrl,
}: LivePreviewProps) {
  // Compute a lighter tint for hover effects
  const tintBg = `${primaryColor}14`; // 8% opacity hex

  return (
    <div className="flex justify-center lg:sticky lg:top-6">
      {/* Phone frame */}
      <div className="flex w-full max-w-[380px] flex-col rounded-[2.5rem] border-4 border-slate-800 bg-slate-800 p-2 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto mb-2 h-6 w-28 rounded-full bg-slate-900" />

        {/* Screen */}
        <div className="flex min-h-[600px] flex-col rounded-[2rem] bg-white overflow-hidden">
          {/* Unified Header */}
          <div
            className="relative px-5 pb-5 pt-6"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
          >
            {/* Cover Image Background */}
            {coverImageUrl && (
              <>
                <img
                  src={coverImageUrl}
                  alt="Portada"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-slate-900/40" />
              </>
            )}

            {/* Header Content */}
            <div className="relative z-10 text-center">
              {logoUrl && (
                <div className="relative w-14 h-14 mx-auto mb-3 rounded-full bg-white flex items-center justify-center shadow-md border p-1 overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h2 className="text-lg font-extrabold text-white drop-shadow-sm leading-tight">
                {surveyTitle || 'Título de la encuesta'}
              </h2>
              {(surveyDescription || !surveyTitle) && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/90 drop-shadow-sm font-medium">
                  {surveyDescription || 'La descripción aparecerá aquí...'}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 px-4 py-4">
            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-4">
                  <Star size={24} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  Agrega preguntas para ver la vista previa
                </p>
              </div>
            )}

            {questions.map((q, idx) => (
              <div key={q.id} className="space-y-2">
                <p className="text-[13px] font-semibold text-slate-800">
                  {idx + 1}. {q.title || 'Pregunta sin título'}
                  {q.isRequired && (
                    <span className="ml-1" style={{ color: primaryColor }}>*</span>
                  )}
                </p>

                {/* ── Rating Stars ─────────────────────── */}
                {q.type === 'rating_stars' && (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={26}
                        className="cursor-pointer text-amber-400 transition-transform hover:scale-110"
                        fill={star <= 3 ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                )}

                {/* ── NPS / Linear Scale (Dinámico 7 o 10) ────────── */}
                {(q.type === 'nps' || q.type === 'linear_scale') && (
                  <div className="mt-2">
                    {/* Usamos un grid que se adapta: 7 columnas para Chile, 6 para el estándar global */}
                    <div className={`grid gap-1.5 ${q.scaleMax === 7 ? 'grid-cols-7' : 'grid-cols-6'}`}>
                      {(q.scaleMax === 7
                        ? [1, 2, 3, 4, 5, 6, 7]
                        : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                      ).map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-400 transition-all shadow-sm"
                          style={n === (q.scaleMax === 7 ? 7 : 10) ? { borderColor: primaryColor, color: primaryColor, backgroundColor: tintBg } : {}}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    {/* Etiquetas dinámicas pequeñas para el preview */}
                    <div className="mt-1.5 flex justify-between px-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                      <span>{q.type === 'nps' ? 'Nada probable' : 'Pésimo'}</span>
                      <span>{q.type === 'nps' ? 'Muy probable' : 'Excelente'}</span>
                    </div>
                  </div>
                )}
                {/* ── CSAT (Caritas) ──────────────────────────────── */}
                {q.type === 'csat' && (
                  <div className="flex justify-between px-2 pt-1">
                    {['😡', '🙁', '😐', '🙂', '😍'].map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        className="text-[30px] transition-transform active:scale-90 hover:scale-125"
                        title={`Opción ${i + 1}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Single Choice ────────────────────── */}
                {(q.type === 'single_choice' || q.type === 'likert') && (
                  <div className="space-y-1.5">
                    {(q.options ?? []).map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors"
                        style={{ ['--hover-bg' as string]: tintBg }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = tintBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300">
                          <span className="h-2 w-2 rounded-full" />
                        </span>
                        {opt || `Opción ${oi + 1}`}
                      </label>
                    ))}
                  </div>
                )}

                {/* ── Multiple Choice ──────────────────── */}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-1.5">
                    {(q.options ?? []).map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = tintBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 border-slate-300" />
                        {opt || `Opción ${oi + 1}`}
                      </label>
                    ))}
                  </div>
                )}

                {/* ── Text Open ─────────────────────────── */}
                {q.type === 'text_open' && (
                  <textarea
                    disabled
                    placeholder="Respuesta del encuestado..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-400"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          {questions.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                disabled
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                Enviar respuestas
              </button>
            </div>
          )}
        </div>

        {/* Home bar */}
        <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-slate-600" />
      </div>
    </div>
  );
}
