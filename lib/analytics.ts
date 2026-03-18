import { supabase } from '@/lib/supabase';

// ── Raw DB types ──────────────────────────────────────────
interface DbQuestion {
  id: string;
  survey_id: string;
  title: string;
  type: string;
  is_required: boolean;
  options: string[] | null;
  order_index: number;
}

interface DbAnswer {
  id: string;
  response_id: string;
  question_id: string;
  value: string;
}

interface DbSurvey {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface DbLead {
  id: string;
  created_at: string;
  contact_info: string;
}

// ── Processed types (for the dashboard) ───────────────────
export interface ProcessedQuestion {
  id: string;
  title: string;
  type: string;
  options: string[] | null;
  answers: string[]; // raw answer values for this question
}

export interface Lead {
  id: string;
  contactInfo: string;
  createdAt: string;
}

export interface SurveyAnalytics {
  survey: { id: string; title: string; description: string; createdAt: string };
  totalResponses: number;
  npsScore: number | null; // -100 to 100, null if no NPS question
  questions: ProcessedQuestion[];
  leads: Lead[];
}

// ── Fetch & process ───────────────────────────────────────
export async function fetchSurveyAnalytics(
  surveyId: string
): Promise<{ data: SurveyAnalytics | null; error: string | null }> {
  try {
    // 1. Survey
    const { data: survey, error: surveyErr } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (surveyErr || !survey) {
      return { data: null, error: surveyErr?.message ?? 'Encuesta no encontrada.' };
    }

    const s = survey as DbSurvey;

    // 2. Questions (ordered)
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index', { ascending: true });

    if (qErr) return { data: null, error: qErr.message };
    const qs = (questions ?? []) as DbQuestion[];

    // 3. Responses count
    const { count: totalResponses, error: rErr } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId);

    if (rErr) return { data: null, error: rErr.message };

    // 4. All answers for this survey's questions
    const questionIds = qs.map((q) => q.id);
    let allAnswers: DbAnswer[] = [];

    if (questionIds.length > 0) {
      const { data: ans, error: aErr } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', questionIds);

      if (aErr) return { data: null, error: aErr.message };
      allAnswers = (ans ?? []) as DbAnswer[];
    }

    // 5. Group answers by question
    const answersByQuestion = new Map<string, string[]>();
    for (const a of allAnswers) {
      const arr = answersByQuestion.get(a.question_id) ?? [];
      arr.push(a.value);
      answersByQuestion.set(a.question_id, arr);
    }

    // 6. Build processed questions
    const processedQuestions: ProcessedQuestion[] = qs.map((q) => ({
      id: q.id,
      title: q.title,
      type: q.type,
      options: q.options,
      answers: answersByQuestion.get(q.id) ?? [],
    }));

    // 7. Compute NPS
    const npsQuestion = processedQuestions.find((q) => q.type === 'nps');
    let npsScore: number | null = null;

    if (npsQuestion && npsQuestion.answers.length > 0) {
      const scores = npsQuestion.answers.map(Number).filter((n) => !isNaN(n));
      const total = scores.length;
      if (total > 0) {
        const promoters = scores.filter((n) => n >= 9).length;
        const detractors = scores.filter((n) => n <= 6).length;
        npsScore = Math.round(((promoters - detractors) / total) * 100);
      }
    }

    // 8. Fetch Leads (responses with contact_info)
    const { data: leadsData, error: lErr } = await supabase
      .from('responses')
      .select('id, created_at, contact_info')
      .eq('survey_id', surveyId)
      .not('contact_info', 'is', null)
      .order('created_at', { ascending: false });

    if (lErr) return { data: null, error: lErr.message };

    const leads: Lead[] = (leadsData as DbLead[]).map((r) => ({
      id: r.id,
      contactInfo: r.contact_info,
      createdAt: r.created_at,
    }));

    return {
      data: {
        survey: {
          id: s.id,
          title: s.title,
          description: s.description,
          createdAt: s.created_at,
        },
        totalResponses: totalResponses ?? 0,
        npsScore,
        questions: processedQuestions,
        leads,
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
