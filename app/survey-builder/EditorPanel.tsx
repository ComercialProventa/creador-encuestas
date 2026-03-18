'use client';

import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import {
  Question,
  QuestionType,
  QuestionTypeLabels,
  createEmptyQuestion,
} from './types';
import OptionsEditor from './OptionsEditor';

interface EditorPanelProps {
  surveyTitle: string;
  surveyDescription: string;
  questions: Question[];
  onSurveyTitleChange: (title: string) => void;
  onSurveyDescriptionChange: (description: string) => void;
  onQuestionsChange: (questions: Question[]) => void;
}

export default function EditorPanel({
  surveyTitle,
  surveyDescription,
  questions,
  onSurveyTitleChange,
  onSurveyDescriptionChange,
  onQuestionsChange,
}: EditorPanelProps) {
  // ── Helpers ──────────────────────────────────────────────
  const updateQuestion = (id: string, patch: Partial<Question>) => {
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const changeType = (id: string, type: QuestionType) => {
    const needsOptions = type === 'single_choice' || type === 'multiple_choice' || type === 'likert';

    onQuestionsChange(
      questions.map((q) => {
        if (q.id === id) {
          // Si elige likert, rellenamos automáticamente
          if (type === 'likert') {
            return {
              ...q,
              type,
              options: ["Muy en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Muy de acuerdo"]
            };
          }
          // Comportamiento normal para el resto
          return {
            ...q,
            type,
            options: needsOptions ? q.options ?? ['Opción 1'] : undefined,
          };
        }
        return q;
      })
    );
  };

  const addQuestion = () => {
    onQuestionsChange([...questions, createEmptyQuestion()]);
  };

  const duplicateQuestion = (id: string) => {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) return;
    const clone: Question = {
      ...questions[idx],
      id: crypto.randomUUID(),
      options: questions[idx].options ? [...questions[idx].options!] : undefined,
    };
    const next = [...questions];
    next.splice(idx + 1, 0, clone);
    onQuestionsChange(next);
  };

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    const next = [...questions];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onQuestionsChange(next);
  };

  const updateOptions = (id: string, options: string[]) => {
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, options } : q))
    );
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Survey Info ─────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Información de la encuesta
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Título
            </label>
            <input
              type="text"
              value={surveyTitle}
              onChange={(e) => onSurveyTitleChange(e.target.value)}
              placeholder="Ej: Encuesta de satisfacción"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              value={surveyDescription}
              onChange={(e) => onSurveyDescriptionChange(e.target.value)}
              placeholder="Breve descripción para el encuestado..."
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>

      {/* ── Question Cards ──────────────────────────────── */}
      {questions.map((q, idx) => (
        <div
          key={q.id}
          className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Badge + Grip */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical
                size={16}
                className="text-slate-300 transition-colors group-hover:text-slate-500"
              />
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                Pregunta {idx + 1}
              </span>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveQuestion(q.id, 'up')}
                disabled={idx === 0}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Mover arriba"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(q.id, 'down')}
                disabled={idx === questions.length - 1}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Mover abajo"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => duplicateQuestion(q.id)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                title="Duplicar pregunta"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Eliminar pregunta"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={q.title}
            onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
            placeholder="Escribe tu pregunta aquí..."
            className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />

          {/* Type + Required row */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={q.type}
              onChange={(e) =>
                changeType(q.id, e.target.value as QuestionType)
              }
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {(
                Object.entries(QuestionTypeLabels) as [
                  QuestionType,
                  string,
                ][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
              <input
                type="checkbox"
                checked={q.isRequired}
                onChange={(e) =>
                  updateQuestion(q.id, { isRequired: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Obligatoria
            </label>
          </div>

          {/* Conditional Options Editor */}
          {/* ── Scale Selector (Conditional) ────────────────── */}
          {(q.type === 'nps' || q.type === 'linear_scale') && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Escala de medición
                </span>
                <span className="text-xs text-indigo-400">
                  Selecciona el rango de notas para esta pregunta
                </span>
              </div>
              <select
                value={q.scaleMax || 10}
                onChange={(e) =>
                  updateQuestion(q.id, { scaleMax: parseInt(e.target.value) as 7 | 10 })
                }
                className="ml-auto rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value={10}>0 a 10 (Estándar Global)</option>
                <option value={7}>1 a 7 (Estándar Chile)</option>
              </select>
            </div>
          )}
          {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'likert') && (
            <OptionsEditor
              options={q.options ?? []}
              onChange={(opts) => updateOptions(q.id, opts)}
            />
          )}
        </div>
      ))}

      {/* ── Add Question Button ─────────────────────────── */}
      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-medium text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Plus size={18} />
        Agregar nueva pregunta
      </button>
    </div>
  );
}
