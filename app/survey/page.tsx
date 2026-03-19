import type { Metadata } from 'next';
import type { Survey, Question } from '@/app/survey-builder/types';
import { fetchSurveyById } from '@/actions/survey';
import SurveyForm from './SurveyForm';

export const metadata: Metadata = {
  title: 'Encuesta — Tu opinión importa',
  description: 'Responde esta breve encuesta y ayúdanos a mejorar.',
};

// ── Mock survey data (used when no survey_id is provided) ──
const MOCK_SURVEY: Survey = {
  title: 'Encuesta de Satisfacción',
  description:
    'Queremos conocer tu experiencia. Solo te tomará 1 minuto. ¡Gracias!',
  questions: [
    {
      id: 'q1-stars',
      title: '¿Cómo calificarías la atención recibida?',
      type: 'rating_stars',
      isRequired: true,
    },
    {
      id: 'q2-nps',
      title: '¿Qué tan probable es que nos recomiendes a un amigo?',
      type: 'nps',
      isRequired: true,
    },
    {
      id: 'q3-single',
      title: '¿Cuál fue el motivo principal de tu visita?',
      type: 'single_choice',
      options: ['Almorzar', 'Cenar', 'Café o postre', 'Reunión de trabajo'],
      isRequired: true,
    },
    {
      id: 'q4-multi',
      title: '¿Qué aspectos destacarías?',
      type: 'multiple_choice',
      options: [
        'Calidad de la comida',
        'Rapidez del servicio',
        'Ambiente y decoración',
        'Relación precio/calidad',
      ],
      isRequired: false,
    },
    {
      id: 'q5-text',
      title: '¿Algún comentario o sugerencia adicional?',
      type: 'text_open',
      isRequired: false,
    },
  ],
  // Demo reward
  rewardType: 'discount',
  rewardText: '¡Ganaste un 10% de descuento!',
  requireContact: true,
};

export default async function SurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ survey_id?: string }>;
}) {
  const params = await searchParams;
  const surveyId = params.survey_id;

  if (!surveyId) {
    return <SurveyForm survey={MOCK_SURVEY} />;
  }

  const { data, error } = await fetchSurveyById(surveyId);

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Encuesta no encontrada</p>
          <p className="mt-1 text-sm text-slate-400">
            Es posible que haya sido eliminada o que el enlace sea incorrecto.
          </p>
        </div>
      </div>
    );
  }

  const survey: Survey = {
    title: data.title,
    description: data.description,
    questions: data.questions.map(
      (q): Question => {
        const finalScaleMax = (q as any).scaleMax || 10;
        console.log(`[DEBUG PUBLIC FORM] Question: "${q.title}" | raw scaleMax from fetch: ${(q as any).scaleMax} | mapped finalScaleMax: ${finalScaleMax}`);
        return {
          id: q.id,
          title: q.title,
          type: q.type as Question['type'],
          isRequired: q.is_required,
          options: q.options ?? undefined,
          scaleMax: finalScaleMax,
        };
      }
    ),
    rewardType: (data.reward_type as Survey['rewardType']) ?? 'none',
    rewardText: data.reward_text ?? undefined,
    rewardImageUrl: data.reward_image_url ?? undefined,
    requireContact: data.require_contact ?? false,
    primaryColor: data.primary_color ?? '#6366f1',
    logoUrl: data.logo_url ?? undefined,
    coverImageUrl: data.cover_image_url ?? undefined,
  };

  console.log('[DEBUG PUBLIC FORM] Final Survey questions array passed to SurveyForm:', survey.questions.map(q => ({ title: q.title.substring(0, 15), scaleMax: q.scaleMax })));

  return <SurveyForm survey={survey} surveyId={surveyId} />;
}
