'use server';

import { createClient } from '@/lib/supabase/server';

// ── Types ─────────────────────────────────────────────────
interface QuestionInput {
  id: string;
  title: string;
  type: string;
  isRequired: boolean;
  options?: string[];
  scaleMax?: number;
}

interface SurveyInput {
  id?: string;
  title: string;
  description: string;
  company?: string;
  primaryColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rewardType?: string;
  rewardText?: string;
  rewardImageUrl?: string;
  requireContact?: boolean;
  couponImageUrl?: string;
}

type ActionResult =
  | { success: true; surveyId: string }
  | { success: false; error: string };

type SubmitResult =
  | { success: true; responseId: string }
  | { success: false; error: string };

// ═══════════════════════════════════════════════════════════
// 1. saveSurvey
// ═══════════════════════════════════════════════════════════
export async function saveSurvey(
  surveyData: SurveyInput,
  questionsData: QuestionInput[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    let surveyId = surveyData.id;

    if (surveyId) {
      // ── Update survey ──────────────────────────────────
      const { error: surveyError } = await supabase
        .from('surveys')
        .update({
          title: surveyData.title,
          description: surveyData.description,
          company: surveyData.company || null,
          primary_color: surveyData.primaryColor ?? '#6366f1',
          logo_url: surveyData.logoUrl || null,
          cover_image_url: surveyData.coverImageUrl || null,
          reward_type: surveyData.rewardType ?? 'none',
          reward_text: surveyData.rewardText || null,
          reward_image_url: surveyData.rewardImageUrl || null,
          require_contact: surveyData.requireContact ?? false,
          coupon_image_url: surveyData.couponImageUrl || null, // <-- AÑADIDO AQUÍ
        })
        .eq('id', surveyId);

      if (surveyError) {
        return {
          success: false,
          error: surveyError?.message ?? 'Error al actualizar la encuesta.',
        };
      }

      // Delete existing questions to replace them
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('survey_id', surveyId);

      if (deleteError) {
        return {
          success: false,
          error: deleteError.message ?? 'Error al actualizar las preguntas.',
        };
      }
    } else {
      // ── Insert survey ──────────────────────────────────
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          company: surveyData.company || null,
          primary_color: surveyData.primaryColor ?? '#6366f1',
          logo_url: surveyData.logoUrl || null,
          cover_image_url: surveyData.coverImageUrl || null,
          reward_type: surveyData.rewardType ?? 'none',
          reward_text: surveyData.rewardText || null,
          reward_image_url: surveyData.rewardImageUrl || null,
          require_contact: surveyData.requireContact ?? false,
          coupon_image_url: surveyData.couponImageUrl || null, // <-- AÑADIDO AQUÍ
        })
        .select('id')
        .single();

      if (surveyError || !survey) {
        return {
          success: false,
          error: surveyError?.message ?? 'Error al crear la encuesta.',
        };
      }

      surveyId = survey.id as string;
    }

    // ── Bulk-insert questions ──────────────────────────
    const questionsPayload = questionsData.map((q, index) => ({
      id: q.id,
      survey_id: surveyId,
      title: q.title,
      type: q.type,
      is_required: q.isRequired,
      options: q.options ?? null,
      scale_max: q.scaleMax || 10,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsPayload);

    if (questionsError) {
      return {
        success: false,
        error: questionsError.message,
      };
    }

    return { success: true, surveyId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 2. submitSurveyResponse
// ═══════════════════════════════════════════════════════════
export async function submitSurveyResponse(
  surveyId: string,
  answersMap: Record<string, string | number | string[]>,
  honeypot?: string
): Promise<SubmitResult> {
  try {
    // Seguridad: Si el campo invisible de bot está lleno, ignoramos silenciosamente
    if (honeypot) {
      console.warn("Bot detectado (Honeypot lleno)");
      return { success: true, responseId: 'bot-filtered' };
    }

    const supabase = await createClient();
    // ── Insert response ─────────────────────────────────
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({ survey_id: surveyId })
      .select('id')
      .single();

    if (responseError || !response) {
      return {
        success: false,
        error: responseError?.message ?? 'Error al registrar la respuesta.',
      };
    }

    const responseId = response.id as string;

    // ── Bulk-insert answers ─────────────────────────────
    const answersPayload = Object.entries(answersMap).map(
      ([questionId, value]) => ({
        response_id: responseId,
        question_id: questionId,
        value: Array.isArray(value) ? JSON.stringify(value) : String(value),
      })
    );

    if (answersPayload.length > 0) {
      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersPayload);

      if (answersError) {
        return {
          success: false,
          error: answersError.message,
        };
      }
    }

    return { success: true, responseId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 3. fetchAllSurveys (for Admin panel)
// ═══════════════════════════════════════════════════════════
export interface SurveyListItem {
  id: string;
  title: string;
  description: string;
  company?: string | null;
  created_at: string;
  response_count: number;
  primary_color: string;
  logo_url: string | null;
}

export async function fetchAllSurveys(): Promise<{
  data: SurveyListItem[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    // Optimizamos: Pedimos las encuestas y el conteo de respuestas en UNA sola consulta (Join/Aggregate)
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('*, responses(count)')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const items: SurveyListItem[] = (surveys ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description ?? '',
      company: s.company ?? null,
      created_at: s.created_at,
      response_count: s.responses[0]?.count ?? 0,
      primary_color: s.primary_color ?? '#6366f1',
      logo_url: s.logo_url ?? null,
    }));

    return { data: items, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 4. deleteSurvey
// ═══════════════════════════════════════════════════════════
export async function deleteSurvey(
  surveyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 5. fetchSurveyById (for public form)
// ═══════════════════════════════════════════════════════════
export interface SurveyWithQuestions {
  id: string;
  title: string;
  description: string;
  company: string | null;
  primary_color: string;
  logo_url: string | null;
  cover_image_url: string | null;
  reward_type: string;
  reward_text: string | null;
  reward_image_url: string | null;
  require_contact: boolean;
  coupon_image_url?: string | null;
  questions: {
    id: string;
    title: string;
    type: string;
    is_required: boolean;
    options: string[] | null;
    scaleMax: 7 | 10;
    order_index: number;
  }[];
}

export async function fetchSurveyById(
  surveyId: string
): Promise<{ data: SurveyWithQuestions | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: survey, error: sErr } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (sErr || !survey) {
      return { data: null, error: sErr?.message ?? 'Encuesta no encontrada.' };
    }

    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index', { ascending: true });

    if (qErr) return { data: null, error: qErr.message };

    return {
      data: {
        id: survey.id,
        title: survey.title,
        description: survey.description ?? '',
        company: survey.company ?? null,
        primary_color: survey.primary_color ?? '#6366f1',
        logo_url: survey.logo_url ?? null,
        cover_image_url: survey.cover_image_url ?? null,
        reward_type: survey.reward_type ?? 'none',
        reward_text: survey.reward_text ?? null,
        reward_image_url: survey.reward_image_url ?? null,
        require_contact: survey.require_contact ?? false,
        coupon_image_url: survey.coupon_image_url ?? null, // <-- AÑADIDO AQUÍ
        questions: (questions ?? []).map((q: Record<string, unknown>) => ({
          id: q.id as string,
          title: q.title as string,
          type: q.type as string,
          is_required: q.is_required as boolean,
          options: q.options as string[] | null,
          scaleMax: (q.scale_max as 7 | 10) || 10,
          order_index: q.order_index as number,
        })),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 6. claimReward (save contact info on response)
// ═══════════════════════════════════════════════════════════
export async function claimReward(
  responseId: string,
  contactInfo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('responses')
      .update({ contact_info: contactInfo })
      .eq('id', responseId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido.',
    };
  }
}

