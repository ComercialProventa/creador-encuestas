import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // anon client
import { createClient } from '@/lib/supabase/server'; // authenticated client

// ── Types ──────────────────────────────────────────────────
interface SurveyData {
  title: string;
  description: string;
}

interface ProcessedCommentGroup {
  questionId: string;
  questionTitle: string;
  answers: string[];
}

export const metadata: Metadata = {
  title: 'Comentarios de Encuesta',
  description: 'Lista completa de comentarios abiertos de la encuesta.',
};

// ── Page Component ─────────────────────────────────────────
export default async function SurveyCommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch survey details (Publicly accessible via RLS)
  const { data: surveyData, error: surveyError } = await supabase
    .from('surveys')
    .select('title, description')
    .eq('id', id)
    .single();

  if (surveyError || !surveyData) {
    notFound();
  }
  const survey = surveyData as SurveyData;

  // 2. Fetch all text_open questions (Publicly accessible via RLS)
  const { data: questionsData, error: qErr } = await supabase
    .from('questions')
    .select('id, title, type')
    .eq('survey_id', id)
    .eq('type', 'text_open')
    .order('order_index', { ascending: true });

  if (qErr || !questionsData || questionsData.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <MessageSquareText size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">Sin Comentarios</h2>
          <p className="mt-2 pl-4 text-slate-500">
            Esta encuesta no contiene preguntas de tipo texto abierto.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch answers. 
  // RLS currently blocks anonymous read access to answers.
  // We try fetching with the authenticated server client (in case the owner is viewing).
  // If we want it truly public, a new RLS policy must be added to allow public SELECT on answers where question.type = 'text_open'.
  const serverClient = await createClient();
  const questionIds = questionsData.map((q) => q.id);

  const { data: answersData, error: aErr } = await serverClient
    .from('answers')
    .select('question_id, value')
    .in('question_id', questionIds);

  let groups: ProcessedCommentGroup[] = [];

  if (!aErr && answersData) {
    const answersByQ = new Map<string, string[]>();
    for (const a of answersData) {
      const arr = answersByQ.get(a.question_id) || [];
      arr.push(a.value);
      answersByQ.set(a.question_id, arr);
    }

    groups = questionsData.map((q) => ({
      questionId: q.id,
      questionTitle: q.title,
      answers: answersByQ.get(q.id) || [],
    }));
  }

  const RlsWarning = aErr ? (
    <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 text-sm font-medium text-amber-800 shadow-sm backdrop-blur-sm">
      <strong className="font-black tracking-tight">Aviso de Privacidad:</strong> Los comentarios están protegidos mediante Row Level Security (RLS) y solo pueden ser leídos de forma segura por el administrador activo de la cuenta. 
      <br/><br/>
      Para hacer que este enlace sea 100% público a terceros (personas sin cuenta), por favor autoriza la lectura anónima en la tabla <code className="rounded bg-amber-100/50 px-1 font-bold text-amber-900">answers</code> filtrando por <code className="rounded bg-amber-100/50 px-1 font-bold text-amber-900">question.type = 'text_open'</code> desde el Editor SQL de tu panel de Supabase.
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)] selection:bg-indigo-500/30">
      <div className="mx-auto max-w-4xl">
        {RlsWarning}

        {/* Header Premium */}
        <header className="mb-14 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/20 ring-4 ring-white">
            <MessageSquareText size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 lg:text-5xl drop-shadow-sm">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="mx-auto mt-5 max-w-2xl text-[15px] font-medium leading-relaxed text-slate-500">
              {survey.description}
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="rounded-full bg-slate-200/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-inner">
              Anexo Oficial de Comentarios Abiertos
            </span>
          </div>
        </header>

        {/* Content Premium */}
        <main className="space-y-10">
          {groups.map((group) => (
            <section 
              key={group.questionId} 
              className="group rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-sm transition-all duration-500 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/40 lg:p-10"
            >
              <div className="mb-8 border-b border-slate-100 pb-5">
                <h2 className="text-xl font-bold leading-snug text-slate-800 lg:text-2xl">
                  {group.questionTitle}
                </h2>
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  {group.answers.length} {group.answers.length === 1 ? 'respuesta' : 'respuestas recolectadas'}
                </div>
              </div>

              {group.answers.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
                  {group.answers.map((text, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl border border-slate-100/60 bg-slate-50/50 p-6 text-[14px] font-medium leading-relaxed text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      <div className="absolute -left-1 -top-1 text-4xl font-serif text-slate-300 opacity-50">&ldquo;</div>
                      <div className="relative z-10">{text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/60 bg-slate-50/30 py-16 text-center">
                  <MessageSquareText size={32} className="text-slate-300 mb-3" />
                  <p className="text-[13px] font-bold tracking-wide text-slate-400">
                    SIN COMENTARIOS AÚN PARA ESTA PREGUNTA
                  </p>
                </div>
              )}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
