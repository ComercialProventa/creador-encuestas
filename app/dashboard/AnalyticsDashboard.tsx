'use client';

import { useEffect, useState, useCallback } from 'react';
import MockDataPanel from './MockDataPanel';
import ReportePDFButton from './ReportePDF';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Users,
  TrendingUp,
  Star,
  MessageSquareText,
  Loader2,
  Inbox,
  Gift,
  Download,
  Activity
} from 'lucide-react';
import {
  fetchSurveyAnalytics,
  type SurveyAnalytics,
  type ProcessedQuestion,
  type Lead,
} from '@/lib/analytics';

// ── Color palette ─────────────────────────────────────────
const COLORS = ['#6366f1', '#a855f7', '#14b8a6', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#8b5cf6'];
const NPS_COLORS = { promoters: '#10b981', passives: '#f59e0b', detractors: '#ef4444' };

// ═══════════════════════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════════════════════
interface DashboardProps {
  surveyId: string;
}

export default function AnalyticsDashboard({ surveyId }: DashboardProps) {
  const [data, setData] = useState<SurveyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setData(null);
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSurveyAnalytics(surveyId).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [surveyId, refreshKey]);

  const handleExportCsv = () => {
    window.open(`/api/export-csv?surveyId=${surveyId}`, '_blank');
  };

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
             <div className="absolute h-16 w-16 animate-ping rounded-full bg-indigo-100 opacity-75"></div>
             <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-indigo-100/50">
                <Loader2 size={28} className="animate-spin text-indigo-600" />
             </div>
          </div>
          <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Cargando analíticas</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-red-100 bg-white p-8 px-12 text-center shadow-xl shadow-red-100/50">
          <p className="text-sm font-bold text-red-600 uppercase tracking-widest">{error ?? 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  const { survey, totalResponses, questions } = data;
  const isEmpty = totalResponses === 0;

  // Calculate Global NPS
  const globalNps = (() => {
    const npsQuestions = questions.filter((q) => q.type === 'nps');
    if (npsQuestions.length === 0) return null;

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let totalNps = 0;

    for (const q of npsQuestions) {
      const scaleMax = q.scaleMax === 7 ? 7 : 10;
      for (const a of q.answers) {
        const score = Number(a);
        if (isNaN(score)) continue;
        totalNps++;
        if (scaleMax === 10) {
          if (score >= 9) promoters++;
          else if (score >= 7) passives++;
          else detractors++;
        } else {
          // Scale 1 to 7
          if (score === 7) promoters++;
          else if (score >= 5) passives++;
          else detractors++;
        }
      }
    }

    if (totalNps === 0) return null;

    const pPercent = Math.round((promoters / totalNps) * 100);
    const passPercent = Math.round((passives / totalNps) * 100);
    const dPercent = Math.round((detractors / totalNps) * 100);
    const score = pPercent - dPercent;

    return { score, promoters: pPercent, passives: passPercent, detractors: dPercent, total: totalNps };
  })();

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] font-[family-name:var(--font-geist-sans)] selection:bg-indigo-500/30">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[90rem] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/20">
                <Activity size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">{survey.title}</h1>
                <p className="text-xs font-medium text-slate-500 line-clamp-1 max-w-xl">{survey.description}</p>
              </div>
            </div>

            {!isEmpty && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="group flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow"
                >
                  <Download size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  CSV
                </button>
                <ReportePDFButton data={data} />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* ── KPIs ─────────────────────────────────────── */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            icon={<Users size={22} strokeWidth={2.5} />}
            label="Total Respuestas"
            value={String(totalResponses)}
            color="indigo"
          />
          <KpiCard
            icon={<MessageSquareText size={22} strokeWidth={2.5} />}
            label="Preguntas Evaluadas"
            value={String(questions.length)}
            color="violet"
          />

          {globalNps && (
            <div className="group relative flex flex-col justify-center gap-4 overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 sm:col-span-2 lg:col-span-1">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-bl from-slate-50 to-transparent opacity-50 transition-transform group-hover:scale-110"></div>
              
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">NPS Global</h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-4xl font-black tracking-tighter ${globalNps.score > 0 ? 'text-emerald-500' : globalNps.score < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {globalNps.score > 0 ? '+' : ''}{globalNps.score}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">score</span>
                  </div>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${globalNps.score > 0 ? 'from-emerald-400 to-emerald-600 shadow-emerald-500/30' : globalNps.score < 0 ? 'from-red-400 to-red-600 shadow-red-500/30' : 'from-amber-400 to-orange-500 shadow-amber-500/30'} text-white shadow-lg`}>
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Progress Bars */}
              <div className="relative z-10 w-full mt-2">
                <div className="mb-2.5 flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-red-500">{globalNps.detractors}% Detr.</span>
                  <span className="text-amber-500">{globalNps.passives}% Pasivos</span>
                  <span className="text-emerald-500">{globalNps.promoters}% Prom.</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100/80 shadow-inner">
                  <div style={{ width: `${globalNps.detractors}%` }} className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000" />
                  <div style={{ width: `${globalNps.passives}%` }} className="bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-1000" />
                  <div style={{ width: `${globalNps.promoters}%` }} className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Empty state ──────────────────────────────── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed border-slate-300/60 bg-white/50 px-6 py-32 text-center backdrop-blur-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-400">
               <Inbox size={40} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Aún no hay respuestas</h2>
            <p className="mt-2 max-w-sm text-sm font-medium text-slate-500 leading-relaxed">Comparte el enlace de tu encuesta o el código QR para empezar a recolectar datos valiosos en tiempo real.</p>
          </div>
        )}

        {/* ── Question Charts ──────────────────────────── */}
        {!isEmpty && (
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} surveyId={surveyId} />
            ))}
          </div>
        )}

        {/* ── Captured Leads Table ───────────────────────── */}
        {!isEmpty && data?.leads && data.leads.length > 0 && (
          <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Gift size={20} className="fill-amber-500" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-slate-800">Recompensas Reclamadas</h2>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">Listado de contactos (Leads) obtenidos mediante el premio de la encuesta.</p>
              </div>
              <div className="flex h-10 items-center rounded-full bg-slate-100 px-4 text-xs font-bold text-slate-600">
                {data.leads.length} Leads
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Información de Contacto</th>
                    <th className="px-8 py-5 text-right">Fecha de Captura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.leads.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-8 py-5 font-semibold text-slate-800">
                        {lead.contactInfo}
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 text-right font-medium text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Mock Data Panel ─────────────────────────────── */}
      <div className="mx-auto max-w-[90rem] px-4 pb-16 sm:px-6 lg:px-8">
        <MockDataPanel surveyId={surveyId} onDataChanged={reload} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KPI Card - Premium Version
// ═══════════════════════════════════════════════════════════
const COLOR_MAP: Record<string, string> = {
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
  violet: 'from-violet-500 to-purple-600 shadow-violet-500/30',
  emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  amber: 'from-amber-400 to-orange-500 shadow-amber-500/30',
  red: 'from-rose-500 to-red-600 shadow-rose-500/30',
};

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-b from-slate-50 to-transparent opacity-50 transition-transform group-hover:scale-110"></div>
      <div className="relative z-10 flex items-center gap-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${COLOR_MAP[color] ?? COLOR_MAP.indigo}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Question Card (delegates to chart type)
// ═══════════════════════════════════════════════════════════
function QuestionCard({ question, surveyId }: { question: ProcessedQuestion; surveyId: string }) {
  const { type, title, answers } = question;

  if (answers.length === 0) {
    return (
      <Card title={title} count={0}>
        <div className="flex h-40 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-400">Sin respuestas aún</p>
        </div>
      </Card>
    );
  }

  // Base layout components for premium look
  switch (type) {
    case 'rating_stars': return <RatingStarsChart question={question} />;
    case 'nps': return <NpsChart question={question} />;
    case 'linear_scale': return <LinearScaleChart question={question} />;
    case 'likert': return <LikertChart question={question} />;
    case 'csat': return <CsatChart question={question} />;
    case 'single_choice':
    case 'multiple_choice': return <ChoiceChart question={question} />;
    case 'text_open': return <TextOpenList question={question} surveyId={surveyId} />;
    default: return null;
  }
}

function Card({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="group flex flex-col rounded-[2rem] border border-slate-200/60 bg-white p-7 shadow-sm transition-all duration-500 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/40">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-relaxed text-slate-700">{title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {count} Resp.
        </span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Custom Tooltip Premium
// ═══════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value ?? data.votos;
    const name = data.name;
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-200/50">
        <p className="text-xs font-bold text-slate-500 mb-2">{name}</p>
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-slate-800">{value} <span className="text-xs font-semibold text-slate-400">votos</span></span>
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-600">
            {percent}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// ── Recharts Common Configs
const gridProps = { strokeDasharray: "4 4", stroke: "#f1f5f9", vertical: false };
const axisProps = { tick: { fontSize: 11, fontWeight: 600, fill: "#94a3b8" }, axisLine: false, tickLine: false };

// ═══════════════════════════════════════════════════════════
// Rating Stars Chart
// ═══════════════════════════════════════════════════════════
function RatingStarsChart({ question }: { question: ProcessedQuestion }) {
  const counts = [0, 0, 0, 0, 0];
  let sum = 0, total = 0;
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 1 && n <= 5) { counts[n - 1]++; sum += n; total++; }
  }

  const avg = total > 0 ? (sum / total).toFixed(1) : '—';
  const chartData = counts.map((count, i) => ({ name: `${i + 1} Estrellas`, votos: count }));

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
           <Star size={26} className="fill-amber-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-tighter text-slate-800">{avg}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Promedio general</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
          <CartesianGrid {...gridProps} horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="name" {...axisProps} width={80} />
          <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#fbbf24" radius={[0, 8, 8, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// NPS / 0-10 Chart
// ═══════════════════════════════════════════════════════════
function NpsChart({ question }: { question: ProcessedQuestion }) {
  const scores = question.answers.map(Number).filter((n) => !isNaN(n));
  const scaleMax = question.scaleMax === 7 ? 7 : 10;
  
  const counts = Array(scaleMax + 1).fill(0);
  let promoters = 0, passives = 0, detractors = 0, total = 0;

  for (const score of scores) {
    if (score >= 0 && score <= scaleMax) {
      counts[score]++; total++;
      if (scaleMax === 10) {
        if (score >= 9) promoters++; else if (score >= 7) passives++; else detractors++;
      } else {
        if (score === 7) promoters++; else if (score >= 5) passives++; else detractors++;
      }
    }
  }

  const chartData = counts.map((count, i) => {
    let color = NPS_COLORS.detractors; 
    if (scaleMax === 10) {
      if (i >= 7 && i <= 8) color = NPS_COLORS.passives;
      if (i >= 9) color = NPS_COLORS.promoters;
    } else {
      if (i === 0) return null;
      if (i >= 5 && i <= 6) color = NPS_COLORS.passives;
      if (i === 7) color = NPS_COLORS.promoters;
    }
    return { name: `${i}`, votos: count, fill: color };
  }).filter((x) => x !== null);

  const npsScore = total > 0 ? Math.round((promoters / total) * 100) - Math.round((detractors / total) * 100) : 0;

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-black text-2xl ${npsScore > 0 ? 'bg-emerald-100 text-emerald-600' : npsScore < 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          {npsScore > 0 ? '+' : ''}{npsScore}
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-slate-800">Score Específico</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Promoter Score</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" radius={[8, 8, 8, 8]} barSize={32}>
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Linear Scale Chart
// ═══════════════════════════════════════════════════════════
function LinearScaleChart({ question }: { question: ProcessedQuestion }) {
  const scaleMax = question.scaleMax === 7 ? 7 : 10;
  const scaleMin = 1;

  let sum = 0, total = 0;
  for (const a of question.answers) {
    const n = Number(a);
    if (!isNaN(n) && n >= scaleMin && n <= scaleMax) { sum += n; total++; }
  }
  
  const avg = total > 0 ? (sum / total).toFixed(1) : '—';
  
  const counts = Array(scaleMax + 1).fill(0);
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= scaleMin && n <= scaleMax) counts[n]++;
  }

  const chartData = counts.map((count, i) => ({ name: `${i}`, votos: count })).slice(scaleMin);

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500">
          <TrendingUp size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-tighter text-slate-800">{avg} <span className="text-sm font-bold text-slate-400">/ {scaleMax}</span></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Promedio Escala</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Likert Chart
// ═══════════════════════════════════════════════════════════
function LikertChart({ question }: { question: ProcessedQuestion }) {
  const LIKERT_LABELS: Record<number, string> = {
    1: 'Muy en desacuerdo', 2: 'En desacuerdo', 3: 'Neutral', 4: 'De acuerdo', 5: 'Muy de acuerdo',
  };

  const counts = [0, 0, 0, 0, 0];
  let sum = 0, total = 0;
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 1 && n <= 5) { counts[n - 1]++; sum += n; total++; }
  }

  const avg = total > 0 ? (sum / total).toFixed(1) : '—';
  const chartData = counts.map((count, i) => ({ name: LIKERT_LABELS[i + 1], votos: count }));

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-500">
          <TrendingUp size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-tighter text-slate-800">{avg} <span className="text-sm font-bold text-slate-400">/ 5</span></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nivel de Acuerdo</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid {...gridProps} horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="name" {...axisProps} width={130} />
          <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#a855f7" radius={[0, 8, 8, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Choice Chart (Single & Multiple)
// ═══════════════════════════════════════════════════════════
function ChoiceChart({ question }: { question: ProcessedQuestion }) {
  const countMap = new Map<string, number>();
  for (const a of question.answers) {
    let values: string[];
    try { const parsed = JSON.parse(a); values = Array.isArray(parsed) ? parsed : [a]; } 
    catch { values = [a]; }
    for (const v of values) countMap.set(v, (countMap.get(v) ?? 0) + 1);
  }

  const pieData = Array.from(countMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <Card title={question.title} count={question.answers.length}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%" cy="50%"
            innerRadius={65} outerRadius={100}
            paddingAngle={4}
            dataKey="value" stroke="none"
            label={({ name = '', value }) => `${name.length > 12 ? name.slice(0, 12) + '…' : name} (${value})`}
            labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          >
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<CustomTooltip total={question.answers.length} />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle" iconSize={8}
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// CSAT Chart (Caritas)
// ═══════════════════════════════════════════════════════════
function CsatChart({ question }: { question: ProcessedQuestion }) {
  const CSAT_LABELS: Record<number, { emoji: string; label: string }> = {
    1: { emoji: '😡', label: 'Malo' },
    2: { emoji: '🙁', label: 'Regular' },
    3: { emoji: '😐', label: 'Neutral' },
    4: { emoji: '🙂', label: 'Bueno' },
    5: { emoji: '😍', label: 'Excelente' },
  };

  const counts = [0, 0, 0, 0, 0];
  let sum = 0, total = 0;
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 1 && n <= 5) { counts[n - 1]++; sum += n; total++; }
  }

  const chartData = counts.map((count, i) => ({ name: CSAT_LABELS[i + 1].label, votos: count, emoji: CSAT_LABELS[i + 1].emoji }));
  let maxIdx = 0;
  for (let i = 1; i < 5; i++) if (counts[i] > counts[maxIdx]) maxIdx = i;

  const topEmoji = total > 0 ? CSAT_LABELS[maxIdx + 1].emoji : '—';
  const topLabel = total > 0 ? CSAT_LABELS[maxIdx + 1]?.label : 'Sin respuestas';

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-inner shadow-sky-200/50">
          <span className="drop-shadow-sm">{topEmoji}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-slate-800 capitalize">{topLabel}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sentimiento Mayoritario</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: -10 }}>
          <CartesianGrid {...gridProps} horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="name" {...axisProps} width={80} />
          <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#0ea5e9" radius={[0, 8, 8, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Text Open List
// ═══════════════════════════════════════════════════════════
function TextOpenList({ question, surveyId }: { question: ProcessedQuestion; surveyId: string }) {
  const latest = question.answers.slice(-10).reverse();

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-2 mb-6 pointer-events-auto custom-scrollbar">
        {latest.map((text, i) => (
          <div key={i} className="rounded-2xl border border-slate-100/60 bg-slate-50/50 p-5 text-sm font-medium leading-relaxed text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
             &ldquo;{text}&rdquo;
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 border-t border-slate-100 pt-6">
        {question.answers.length > 10 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Últimas 10 de {question.answers.length}
          </p>
        )}
        <a 
          href={`/survey/${surveyId}/comments`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-6 py-3 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20"
        >
          Ver todos los comentarios
        </a>
      </div>
    </Card>
  );
}
