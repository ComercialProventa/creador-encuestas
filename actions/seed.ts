'use server';

import { createClient } from '@/lib/supabase/server';

// ── Types ─────────────────────────────────────────────────
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface SeedOptions {
  surveyId: string;
  count: number;          // number of mock responses to insert
  sentiment: Sentiment;   // general bias
}

export interface SeedResult {
  success: boolean;
  inserted: number;
  error?: string;
}

// ─── Text pools by sentiment ──────────────────────────────
const TEXT_POOLS: Record<Sentiment, string[]> = {
  positive: [
    'Todo muy bien, excelente servicio.',
    'Muy satisfecho con la experiencia.',
    'El personal fue muy amable.',
    'Sin dudas volvería a usar el servicio.',
    'Superó mis expectativas, muy recomendable.',
    'Excelente atención y puntualidad.',
    'Muy cómodo y agradable el trayecto.',
    'Servicio impecable, 100% recomendado.',
  ],
  neutral: [
    'El servicio estuvo bien, sin más.',
    'Normal, ni muy bueno ni malo.',
    'Cumplió con lo básico.',
    'Podría mejorar algunos aspectos.',
    'Aceptable, pero hay margen de mejora.',
    'Promedio, nada que destacar.',
  ],
  negative: [
    'El servicio dejó bastante que desear.',
    'Mejorar la puntualidad urgentemente.',
    'La atención fue deficiente.',
    'Tuve problemas durante el trayecto.',
    'No fue lo que esperaba, decepcionante.',
    'Hay muchas cosas por mejorar.',
    'No volvería a usar este servicio.',
  ],
  mixed: [
    'Buena experiencia en general.',
    'Algunas cosas buenas y otras mejorables.',
    'El servicio fue aceptable.',
    'Hay aspectos positivos pero también a mejorar.',
    'Regular, dependiendo del día puede variar.',
    'Excelente atención, pero el tiempo fue largo.',
    'Muy limpio pero algo tardío.',
  ],
};

// ─── Random score generators by sentiment ────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a score in [min, max] biased by sentiment.
 *   positive → upper third   negative → lower third   mixed/neutral → full range
 */
function biasedScore(scaleMin: number, scaleMax: number, sentiment: Sentiment): number {
  const range = scaleMax - scaleMin;
  if (sentiment === 'positive') {
    // Upper 40%
    const low = Math.round(scaleMin + range * 0.6);
    return randomInt(low, scaleMax);
  }
  if (sentiment === 'negative') {
    // Lower 40%
    const high = Math.round(scaleMin + range * 0.4);
    return randomInt(scaleMin, high);
  }
  if (sentiment === 'neutral') {
    // Middle 40%
    const low = Math.round(scaleMin + range * 0.3);
    const high = Math.round(scaleMin + range * 0.7);
    return randomInt(low, high);
  }
  // mixed → full range
  return randomInt(scaleMin, scaleMax);
}

function randomText(sentiment: Sentiment): string {
  const pool = TEXT_POOLS[sentiment];
  return pool[randomInt(0, pool.length - 1)];
}

function randomOptions(options: string[], sentiment: Sentiment, multi: boolean): string | string[] {
  if (!options || options.length === 0) return '';

  if (sentiment === 'positive') {
    // Pick from last half (usually "better" options)
    const mid = Math.floor(options.length / 2);
    const subset = options.slice(mid);
    if (multi) {
      const count = randomInt(1, Math.min(2, subset.length));
      return shuffle(subset).slice(0, count);
    }
    return subset[randomInt(0, subset.length - 1)];
  }
  if (sentiment === 'negative') {
    const mid = Math.ceil(options.length / 2);
    const subset = options.slice(0, mid);
    if (multi) {
      const count = randomInt(1, Math.min(2, subset.length));
      return shuffle(subset).slice(0, count);
    }
    return subset[randomInt(0, subset.length - 1)];
  }
  // neutral / mixed → random
  if (multi) {
    const count = randomInt(1, Math.min(2, options.length));
    return shuffle(options).slice(0, count);
  }
  return options[randomInt(0, options.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════════════════════
// Main action
// ═══════════════════════════════════════════════════════════
export async function generateMockResponses(opts: SeedOptions): Promise<SeedResult> {
  try {
    const supabase = await createClient();
    const { surveyId, count, sentiment } = opts;

    // 1. Fetch questions for this survey
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, type, options, scale_max')
      .eq('survey_id', surveyId)
      .order('order_index', { ascending: true });

    if (qErr || !questions) {
      return { success: false, inserted: 0, error: qErr?.message ?? 'No questions found.' };
    }

    let inserted = 0;

    // 2. Insert `count` responses, BATCHING every 20 to avoid request limits
    const BATCH = 20;
    for (let i = 0; i < count; i += BATCH) {
      const batchSize = Math.min(BATCH, count - i);

      // Build response rows
      const responseRows = Array.from({ length: batchSize }, () => ({
        survey_id: surveyId,
      }));

      const { data: newResponses, error: rErr } = await supabase
        .from('responses')
        .insert(responseRows)
        .select('id');

      if (rErr || !newResponses) {
        return { success: false, inserted, error: rErr?.message ?? 'Failed inserting responses' };
      }

      // Build answer rows for all questions × all responses in batch
      const answerRows: { response_id: string; question_id: string; value: string }[] = [];

      for (const response of newResponses) {
        for (const q of questions) {
          const scaleMax: number = (q.scale_max as number) || 10;
          let value = '';

          switch (q.type) {
            case 'nps': {
              const min = scaleMax === 7 ? 1 : 0;
              value = String(biasedScore(min, scaleMax, sentiment));
              break;
            }
            case 'linear_scale': {
              const min = scaleMax === 7 ? 1 : 1;
              value = String(biasedScore(min, scaleMax, sentiment));
              break;
            }
            case 'rating_stars': {
              value = String(biasedScore(1, 5, sentiment));
              break;
            }
            case 'csat': {
              value = String(biasedScore(1, 5, sentiment));
              break;
            }
            case 'likert': {
              value = String(biasedScore(1, 5, sentiment));
              break;
            }
            case 'single_choice': {
              const opts2 = q.options as string[] | null;
              if (opts2 && opts2.length > 0) {
                value = randomOptions(opts2, sentiment, false) as string;
              }
              break;
            }
            case 'multiple_choice': {
              const opts3 = q.options as string[] | null;
              if (opts3 && opts3.length > 0) {
                const chosen = randomOptions(opts3, sentiment, true) as string[];
                value = JSON.stringify(chosen);
              }
              break;
            }
            case 'text_open': {
              value = randomText(sentiment);
              break;
            }
            default:
              value = '';
          }

          if (value !== '') {
            answerRows.push({
              response_id: response.id,
              question_id: q.id,
              value,
            });
          }
        }
      }

      const { error: aErr } = await supabase.from('answers').insert(answerRows);
      if (aErr) {
        return { success: false, inserted, error: aErr.message };
      }

      inserted += batchSize;
    }

    return { success: true, inserted };
  } catch (err) {
    return {
      success: false,
      inserted: 0,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Clear all responses for a survey (utility for testing)
// ═══════════════════════════════════════════════════════════
export async function clearMockResponses(
  surveyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // answers are cascade-deleted when responses are deleted
    const { error } = await supabase
      .from('responses')
      .delete()
      .eq('survey_id', surveyId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}
