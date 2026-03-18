import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import AnalyticsDashboard from './AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Dashboard — Analíticas de encuesta',
  description: 'Visualiza las respuestas y métricas de tu encuesta.',
};

// ── Fetch the most recent survey to show by default ───────
async function getLatestSurveyId(): Promise<string | null> {
  const { data } = await supabase
    .from('surveys')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (data as { id: string } | null)?.id ?? null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ survey_id?: string }>;
}) {
  const params = await searchParams;
  const surveyId = params.survey_id ?? (await getLatestSurveyId());

  if (!surveyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          No hay encuestas creadas. Crea una primero en{' '}
          <a href="/survey-builder" className="font-medium text-indigo-600 underline">
            Survey Builder
          </a>
          .
        </p>
      </div>
    );
  }

  return <AnalyticsDashboard surveyId={surveyId} />;
}
