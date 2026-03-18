'use client';

import { useState, useCallback } from 'react';
import {
  Star,
  Send,
  AlertCircle,
  Loader2,
  Gift,
  PartyPopper,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import type { Survey } from '@/app/survey-builder/types';
import { submitSurveyResponse, claimReward } from '@/actions/survey';

// ── Answer types ──────────────────────────────────────────
type AnswerValue = number | string | string[];
type Answers = Record<string, AnswerValue>;

interface SurveyFormProps {
  survey: Survey;
  surveyId?: string;
}

// ── Main Component ────────────────────────────────────────
export default function SurveyForm({ survey, surveyId }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reward state
  const [responseId, setResponseId] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const hasReward =
    survey.rewardType && survey.rewardType !== 'none' && survey.rewardText;

  const primaryColor = survey.primaryColor || '#6366f1';
  const tintBg = `${primaryColor}14`;

  // ── Derived State ───────────────────────────────────────
  const answeredCount = survey.questions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;
  const progressPercent = survey.questions.length > 0
    ? Math.round((answeredCount / survey.questions.length) * 100)
    : 0;

  // ── Updater ───────────────────────────────────────────
  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: false }));
  }, []);

  // ── Validation & Submit ───────────────────────────────
  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    for (const q of survey.questions) {
      if (q.isRequired) {
        const a = answers[q.id];
        const isEmpty =
          a === undefined || a === '' || (Array.isArray(a) && a.length === 0);
        if (isEmpty) {
          newErrors[q.id] = true;
          hasError = true;
        }
      }
    }

    if (hasError) {
      setErrors(newErrors);
      const firstErrorId = survey.questions.find((q) => newErrors[q.id])?.id;
      if (firstErrorId) {
        document
          .getElementById(`q-${firstErrorId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    if (surveyId) {
      const result = await submitSurveyResponse(surveyId, answers);
      setIsSubmitting(false);
      if (result.success) {
        setResponseId(result.responseId);
        setIsSubmitted(true);
      } else {
        setSubmitError(result.error);
      }
    } else {
      console.log('📊 Respuestas (demo):', JSON.stringify(answers, null, 2));
      await new Promise((r) => setTimeout(r, 1000));
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  // ── Claim reward handler ──────────────────────────────
  const handleClaim = async () => {
    if (!contactInfo.trim() || !responseId) return;
    setIsClaiming(true);
    const result = await claimReward(responseId, contactInfo.trim());
    setIsClaiming(false);
    if (result.success) {
      setIsClaimed(true);
    }
  };

  // ── Reward Screen (after submit, if reward configured) ─
  if (isSubmitted && hasReward && !isClaimed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-white to-white px-6 py-12">
        <div className="w-full max-w-sm text-center">
          {/* Reward image */}
          {survey.rewardImageUrl && (
            <div className="mx-auto mb-6 overflow-hidden rounded-2xl shadow-lg">
              <img
                src={survey.rewardImageUrl}
                alt="Premio"
                className="h-48 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
            <Gift size={30} className="text-white" />
          </div>

          {/* Badge */}
          <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
            {survey.rewardType === 'discount' ? '🎉 Descuento' : '🎁 Sorteo'}
          </span>

          {/* Reward text */}
          <h1 className="mb-2 text-2xl font-extrabold text-slate-800">
            {survey.rewardText}
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            Gracias por completar la encuesta.
          </p>

          {/* Contact capture */}
          {survey.requireContact ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-600">
                Déjanos tu contacto para reclamar tu premio:
              </p>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="WhatsApp o Email"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-center text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={handleClaim}
                disabled={isClaiming || !contactInfo.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
              >
                {isClaiming ? (
                  <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                ) : (
                  <><PartyPopper size={16} /> Reclamar Premio</>
                )}
              </button>
            </div>
          ) : (
            // No contact required — just show a done button
            <button
              type="button"
              onClick={() => setIsClaimed(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <PartyPopper size={16} /> ¡Genial, entendido!
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Final Thank You (no reward, or after claiming) ────
  if (isSubmitted && (!hasReward || isClaimed)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-100">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-800">
            {isClaimed ? '¡Listo, premio reclamado!' : '¡Gracias por tu opinión!'}
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-slate-500">
            {isClaimed
              ? 'Te contactaremos pronto. ¡Gracias por participar!'
              : 'Tu respuesta nos ayuda a mejorar. Apreciamos mucho tu tiempo.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Top Progress Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[6px] bg-slate-200">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%`, backgroundColor: primaryColor }}
        />
      </div>

      {/* Unified Header */}
      <div
        className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
      >
        {/* Cover Image Background */}
        {survey.coverImageUrl && (
          <>
            <img
              src={survey.coverImageUrl}
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

        {!surveyId && (
          <button
            onClick={() => window.location.href = '/'}
            className="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 backdrop-blur-sm"
            title="Volver"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Header Content */}
        <div className="relative z-10 mx-auto max-w-md text-center">
          {survey.logoUrl && (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-white flex items-center justify-center shadow-md border p-1 overflow-hidden">
              <img
                src={survey.logoUrl}
                alt="Logo"
                className="max-w-full max-h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white drop-shadow-sm">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-white/90 drop-shadow-sm font-medium">{survey.description}</p>
          )}
        </div>
      </div>

      {/* Cards container */}
      <div className={`mx-auto max-w-md space-y-4 sm:space-y-5 px-4 -mt-6 relative z-20`}>
        {survey.questions.map((q, idx) => {
          const a = answers[q.id];
          const isAnswered = a !== undefined && a !== '' && (!Array.isArray(a) || a.length > 0);

          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${errors[q.id] ? 'ring-2 ring-red-400 ring-offset-1' : 'ring-0'
                }`}
            >
              {/* Subtle indicator left border if answered */}
              <div
                className="absolute bottom-0 left-0 top-0 w-1.5 transition-colors duration-300"
                style={{ backgroundColor: isAnswered ? primaryColor : 'transparent' }}
              />

              <p className="mb-2 text-base font-bold leading-snug text-slate-800">
                <span className="mr-2 text-sm" style={{ color: primaryColor }}>
                  {idx + 1}.
                </span>
                {q.title}
                {q.isRequired && (
                  <span className="ml-1" style={{ color: primaryColor }}>
                    *
                  </span>
                )}
              </p>

              {errors[q.id] && (
                <p className="mb-3 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle size={12} /> Esta pregunta es obligatoria
                </p>
              )}

              {q.type === 'rating_stars' && (
                <RatingStars value={(answers[q.id] as number) ?? 0} onChange={(v) => setAnswer(q.id, v)} />
              )}
              {q.type === 'nps' && (
                <NpsButtons
                  value={(answers[q.id] as number) ?? -1}
                  onChange={(v) => setAnswer(q.id, v)}
                  primaryColor={primaryColor}
                  tintBg={tintBg}
                  scaleMax={q.scaleMax || 10}
                />
              )}
              {q.type === 'likert' && (
                <LikertScale
                  value={(answers[q.id] as number) ?? 0}
                  onChange={(v) => setAnswer(q.id, v)}
                  primaryColor={primaryColor}
                  tintBg={tintBg}
                />
              )}
              {q.type === 'single_choice' && (
                <ChoiceButtons
                  options={q.options ?? []}
                  selected={answers[q.id] as string | undefined}
                  onChange={(v) => setAnswer(q.id, v)}
                  multi={false}
                  primaryColor={primaryColor}
                  tintBg={tintBg}
                />
              )}
              {q.type === 'multiple_choice' && (
                <ChoiceButtons
                  options={q.options ?? []}
                  selected={answers[q.id] as string[] | undefined}
                  onChange={(v) => setAnswer(q.id, v)}
                  multi={true}
                  primaryColor={primaryColor}
                  tintBg={tintBg}
                />
              )}
              {q.type === 'text_open' && (
                <FocusTextarea
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(val) => setAnswer(q.id, val)}
                  primaryColor={primaryColor}
                />
              )}
              {/* ── Linear Scale (0-10) ────────────────────── */}
              {q.type === 'linear_scale' && (
                <NpsButtons
                  value={(answers[q.id] as number) ?? -1}
                  onChange={(v) => setAnswer(q.id, v)}
                  primaryColor={primaryColor}
                  tintBg={tintBg}
                  isGenericScale={true} // Nueva prop para quitar los textos de NPS
                />
              )}

              {/* ── CSAT (Caritas) ──────────────────────────── */}
              {q.type === 'csat' && (
                <CsatButtons
                  value={(answers[q.id] as number) ?? 0}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              )}
            </div>
          );
        })}

        {/* Reward teaser */}
        {hasReward && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
            <Gift size={24} className="flex-shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-700">
              Completa la encuesta y recibe una recompensa 🎁
            </p>
          </div>
        )}
      </div>

      {/* Sticky Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          {submitError && (
            <p className="mb-2 text-center text-xs font-medium text-red-500">{submitError}</p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 8px 24px -6px ${primaryColor}66, 0 4px 10px -4px ${primaryColor}80`
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
          >
            {isSubmitting ? (
              <><Loader2 size={20} className="animate-spin" /> Enviando...</>
            ) : (
              <><Send size={18} /> Enviar mis respuestas</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-3 flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="group rounded-lg p-1 transition-transform active:scale-90"
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <Star
            size={36}
            className={`transition-colors ${star <= value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-slate-300 group-hover:text-amber-300'
              }`}
          />
        </button>
      ))}
    </div>
  );
}

function NpsButtons({
  value,
  onChange,
  primaryColor,
  tintBg,
  isGenericScale = false,
  scaleMax = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  primaryColor: string;
  tintBg: string;
  isGenericScale?: boolean;
  scaleMax?: 7 | 10;
}) {
  const range = scaleMax === 7
    ? [1, 2, 3, 4, 5, 6, 7]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="mt-3 w-full">
      {/* Contenedor dinámico: Grid estricto para 7, Flex wrap para 10 */}
      <div
        className={
          scaleMax === 7
            ? 'grid grid-cols-7 gap-1 sm:gap-2'
            : 'flex flex-wrap justify-center gap-1.5 sm:gap-2'
        }
      >
        {range.map((n) => {
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              // Clases de botón dinámicas: Ancho fluido para 7, tamaño fijo para 10
              className={`flex items-center justify-center rounded-xl border-2 text-sm font-bold transition-all active:scale-90 ${scaleMax === 7
                  ? 'w-full h-10 sm:h-12 sm:text-base'
                  : 'h-10 w-10 sm:h-11 sm:w-11 sm:text-base'
                }`}
              style={
                isSelected
                  ? {
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#fff',
                    boxShadow: `0 8px 16px -4px ${primaryColor}66`
                  }
                  : {
                    borderColor: '#e2e8f0',
                    backgroundColor: '#fff',
                    color: '#475569'
                  }
              }
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Etiquetas de ayuda visual */}
      <div className="mt-3 flex justify-between px-1">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
            {/* Si NO es genérico (es NPS), muestra Probabilidad. Si es genérico, muestra Pésimo */}
            {!isGenericScale ? 'Nada probable' : 'Pésimo'}
          </span>
          <span className="text-[9px] font-medium text-slate-300">Nota {range[0]}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 text-right">
            {/* Si NO es genérico (es NPS), muestra Probabilidad. Si es genérico, muestra Excelente */}
            {!isGenericScale ? 'Muy probable' : 'Excelente'}
          </span>
          <span className="text-[9px] font-medium text-slate-300">Nota {range[range.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}
function LikertScale({
  value,
  onChange,
  primaryColor,
  tintBg,
}: {
  value: number;
  onChange: (v: number) => void;
  primaryColor: string;
  tintBg: string;
}) {
  const options = [
    { label: 'Muy en desacuerdo', val: 1 },
    { label: 'En desacuerdo', val: 2 },
    { label: 'Neutral', val: 3 },
    { label: 'De acuerdo', val: 4 },
    { label: 'Muy de acuerdo', val: 5 },
  ];

  return (
    <div className="mt-4 w-full">
      {/* Contenedor de burbujas horizontales */}
      <div className="flex justify-between items-center relative mb-2">
        {/* Línea de conexión de fondo */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0" />

        {options.map((opt) => (
          <button
            key={opt.val}
            type="button"
            onClick={() => onChange(opt.val)}
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold transition-all active:scale-90"
            style={
              value === opt.val
                ? {
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                  color: '#fff',
                  boxShadow: `0 4px 10px ${primaryColor}40`
                }
                : {
                  borderColor: '#e2e8f0',
                  backgroundColor: '#fff',
                  color: '#64748b'
                }
            }
          >
            {opt.val}
          </button>
        ))}
      </div>

      {/* Etiquetas de los extremos para contexto */}
      <div className="flex justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 max-w-[60px] leading-tight">
          {options[0].label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 max-w-[60px] text-right leading-tight">
          {options[options.length - 1].label}
        </span>
      </div>
    </div>
  );
}
function ChoiceButtons({
  options,
  selected,
  onChange,
  multi,
  primaryColor,
  tintBg,
}: {
  options: string[];
  selected: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  multi: boolean;
  primaryColor: string;
  tintBg: string;
}) {
  const isSelected = (opt: string) => {
    if (multi) return Array.isArray(selected) && selected.includes(opt);
    return selected === opt;
  };

  const handleClick = (opt: string) => {
    if (multi) {
      const arr = Array.isArray(selected) ? selected : [];
      onChange(arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt]);
    } else {
      onChange(opt);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => handleClick(opt)}
          className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98]"
          style={
            isSelected(opt)
              ? { borderColor: primaryColor, backgroundColor: tintBg, color: primaryColor, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
              : { borderColor: '#e2e8f0', backgroundColor: '#fff', color: '#334155' }
          }
          onMouseEnter={(e) => {
            if (!isSelected(opt)) e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            if (!isSelected(opt)) e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          <span
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${multi ? 'rounded' : 'rounded-full'
              } border-2 transition-colors`}
            style={
              isSelected(opt)
                ? { borderColor: primaryColor, backgroundColor: primaryColor }
                : { borderColor: '#cbd5e1', backgroundColor: '#fff' }
            }
          >
            {isSelected(opt) && (
              <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 6 5 9 10 3" />
              </svg>
            )}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FocusTextarea Component
// ═══════════════════════════════════════════════════════════
function FocusTextarea({
  value,
  onChange,
  primaryColor,
}: {
  value: string;
  onChange: (val: string) => void;
  primaryColor: string;
}) {
  const [focused, setFocused] = useState(false);
  const ringColor = `${primaryColor}25`; // ~15% opacity

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="Escribe tu respuesta..."
      rows={4}
      className="mt-2 w-full resize-none rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:bg-white"
      style={
        focused
          ? {
            borderColor: primaryColor,
            boxShadow: `0 0 0 4px ${ringColor}`,
          }
          : {
            borderColor: '#e2e8f0', // slate-200
          }
      }
    />
  );
}
// ── CsatButtons Component (Caritas) ──────────────────────
function CsatButtons({
  value,
  onChange
}: {
  value: number;
  onChange: (v: number) => void
}) {
  const emojis = [
    { label: 'Muy mal', icon: '😡', val: 1 },
    { label: 'Mal', icon: '🙁', val: 2 },
    { label: 'Neutral', icon: '😐', val: 3 },
    { label: 'Bien', icon: '🙂', val: 4 },
    { label: 'Excelente', icon: '😍', val: 5 },
  ];

  return (
    <div className="mt-4 flex justify-between gap-1 px-1">
      {emojis.map((emoji) => (
        <button
          key={emoji.val}
          type="button"
          onClick={() => onChange(emoji.val)}
          className="group flex flex-col items-center gap-2 transition-all active:scale-90"
        >
          <span
            className={`text-4xl transition-all duration-300 ${value === emoji.val
              ? 'scale-125 filter-none opacity-100 drop-shadow-md'
              : 'grayscale opacity-40 hover:grayscale-0 hover:opacity-100'
              }`}
          >
            {emoji.icon}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${value === emoji.val ? 'text-slate-800' : 'text-slate-400'
            }`}>
            {emoji.label}
          </span>
        </button>
      ))}
    </div>
  );
}