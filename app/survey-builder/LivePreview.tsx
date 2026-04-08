'use client';

import { useState, useEffect } from 'react';
import { Star, Gift, PartyPopper, Send } from 'lucide-react';
import { Question, type RewardType } from './types';

interface LivePreviewProps {
  surveyTitle: string;
  surveyDescription: string;
  questions: Question[];
  primaryColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rewardType?: RewardType;
  rewardText?: string;
  rewardImageUrl?: string;
  requireContact?: boolean;
}

export default function LivePreview({
  surveyTitle,
  surveyDescription,
  questions,
  primaryColor = '#6366f1',
  logoUrl,
  coverImageUrl,
  rewardType = 'none',
  rewardText = '',
  rewardImageUrl = '',
  requireContact = false,
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<'survey' | 'reward'>('survey');
  const hasReward = rewardType && rewardType !== 'none' && rewardText.trim() !== '';

  useEffect(() => {
    // Si la vista actual es 'reward' pero acabamos de quitar el premio, 
    // forzamos al teléfono a volver a mostrar la encuesta.
    if (!hasReward && viewMode === 'reward') {
      setViewMode('survey');
    }
  }, [hasReward, viewMode]);

  const tintBg = `${primaryColor}14`;

  return (
    <div className="flex flex-col items-center justify-start lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)] space-y-4 pb-4">

      {/* Botones superiores para cambiar vista */}
      {hasReward && (
        <div className="flex w-full max-w-[380px] rounded-xl bg-slate-200 p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('survey')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${viewMode === 'survey'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Encuesta
          </button>
          <button
            onClick={() => setViewMode('reward')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${viewMode === 'reward'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Gift size={14} /> Premio
          </button>
        </div>
      )}


      {/* Phone frame */}
      <div className="flex w-full max-w-[380px] flex-col rounded-[2.5rem] border-4 border-slate-800 bg-slate-800 p-2 shadow-2xl relative flex-1 min-h-[450px]">

        <div className="mx-auto mb-2 h-6 w-28 rounded-full bg-slate-900 absolute left-0 right-0 top-2 z-50" />

        {/* Screen (quitamos el h-[650px] y agregamos flex-1) */}
        <div className="flex flex-col rounded-[2rem] bg-white overflow-hidden relative flex-1">

          {/* ═════════ VISTA 1: ENCUESTA NORMAL ═════════ */}
          {viewMode === 'survey' && (
            <>
              {/* Contenedor escroleable independiente */}
              <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">

                {/* Header */}
                <div
                  className="relative px-5 pb-5 pt-10"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                >
                  {coverImageUrl && (
                    <>
                      <img
                        src={coverImageUrl}
                        alt="Portada"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-slate-900/40" />
                    </>
                  )}
                  <div className="relative z-10 text-center">
                    {logoUrl && (
                      <div className="relative w-14 h-14 mx-auto mb-3 rounded-full bg-white flex items-center justify-center shadow-md border p-1 overflow-hidden">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain rounded-full"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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

                {/* Body / Preguntas */}
                <div className="space-y-4 px-4 py-4">
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

                      {/* Rating Stars */}
                      {q.type === 'rating_stars' && (
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={26}
                              className="text-amber-400"
                              fill={star <= 3 ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      )}

                      {/* NPS / Linear Scale */}
                      {(q.type === 'nps' || q.type === 'linear_scale') && (
                        <div className="mt-2">
                          <div className={`grid gap-1.5 ${q.scaleMax === 7 ? 'grid-cols-7' : 'grid-cols-6'}`}>
                            {(q.scaleMax === 7 ? [1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map((n) => (
                              <button
                                key={n}
                                type="button"
                                className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-400 shadow-sm"
                                style={n === (q.scaleMax === 7 ? 7 : 10) ? { borderColor: primaryColor, color: primaryColor, backgroundColor: tintBg } : {}}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CSAT (Caritas) */}
                      {q.type === 'csat' && (
                        <div className="flex justify-between px-2 pt-1">
                          {['😡', '🙁', '😐', '🙂', '😍'].map((emoji, i) => (
                            <span key={i} className="text-[30px]">{emoji}</span>
                          ))}
                        </div>
                      )}

                      {/* Single Choice / Likert */}
                      {(q.type === 'single_choice' || q.type === 'likert') && (
                        <div className="space-y-1.5">
                          {(q.options ?? []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                              <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300">
                                {oi === 0 && <span className="h-2 w-2 rounded-full bg-slate-400" />}
                              </span>
                              {opt || `Opción ${oi + 1}`}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Multiple Choice */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1.5">
                          {(q.options ?? []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                              <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 border-slate-300 ${oi === 0 ? 'bg-slate-400 border-slate-400' : ''}`} />
                              {opt || `Opción ${oi + 1}`}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text Open */}
                      {q.type === 'text_open' && (
                        <textarea
                          disabled
                          placeholder="Respuesta del encuestado..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AQUI ESTÁ LA OTRA CORRECCIÓN: Footer fijo anclado y con el mismo diseño del original */}
              {questions.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3">
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md opacity-80"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send size={16} /> Enviar respuestas
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═════════ VISTA 2: PANTALLA DE PREMIO ═════════ */}
          {viewMode === 'reward' && hasReward && (
            <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-white to-white px-5 py-10 text-center overflow-y-auto scrollbar-hide">

              {rewardImageUrl && (
                <div className="mx-auto mb-6 w-full overflow-hidden rounded-2xl shadow-lg mt-8">
                  <img
                    src={rewardImageUrl}
                    alt="Premio"
                    className="h-40 w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
                <Gift size={24} className="text-white" />
              </div>

              <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {rewardType === 'discount' ? '🎉 Descuento' : '🎁 Sorteo'}
              </span>

              <h1 className="mb-2 text-xl font-extrabold text-slate-800">
                {rewardText || '¡Configura tu mensaje!'}
              </h1>
              <p className="mb-6 text-xs text-slate-500">
                Gracias por completar la encuesta.
              </p>

              {requireContact ? (
                <div className="w-full space-y-3">
                  <p className="text-xs font-medium text-slate-600">
                    Déjanos tu contacto para reclamar tu premio:
                  </p>
                  <input
                    type="text"
                    placeholder="WhatsApp o Email"
                    disabled
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 text-center text-sm text-slate-400 outline-none"
                  />
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 opacity-90">
                    <PartyPopper size={16} /> Reclamar Premio
                  </button>
                </div>
              ) : (
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 opacity-90">
                  <PartyPopper size={16} /> ¡Genial, entendido!
                </button>
              )}
            </div>
          )}

        </div>

        {/* Home bar */}
        <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-slate-600" />
      </div>
    </div>
  );
}