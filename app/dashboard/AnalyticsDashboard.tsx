'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import {
  fetchSurveyAnalytics,
  type SurveyAnalytics,
  type ProcessedQuestion,
  type Lead,
} from '@/lib/analytics';

// ── Color palette ─────────────────────────────────────────
const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
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
  }, [surveyId]);

  const handleExportCsv = () => {
    window.open(`/api/export-csv?surveyId=${surveyId}`, '_blank');
  };

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600">{error ?? 'Error desconocido'}</p>
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{survey.title}</h1>
                <p className="text-sm text-slate-500">{survey.description}</p>
              </div>
            </div>

            {!isEmpty && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600"
              >
                <Download size={16} />
                Exportar a CSV
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── KPIs ─────────────────────────────────────── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            icon={<Users size={20} />}
            label="Total Respuestas"
            value={String(totalResponses)}
            color="indigo"
          />
          <KpiCard
            icon={<MessageSquareText size={20} />}
            label="Preguntas"
            value={String(questions.length)}
            color="violet"
          />

          {globalNps && (
            <div className="flex flex-col justify-center gap-3 rounded-2xl bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1 border border-slate-100">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl 
                  ${globalNps.score > 0 ? 'bg-emerald-50 text-emerald-600' : globalNps.score < 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}
                >
                  {globalNps.score > 0 ? '+' : ''}
                  {globalNps.score}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">NPS Global</h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">{globalNps.total} respuestas NPS</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="w-full">
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-red-500">{globalNps.detractors}% Detractores</span>
                  <span className="text-amber-500">{globalNps.passives}% Pasivos</span>
                  <span className="text-emerald-500">{globalNps.promoters}% Promotores</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div style={{ width: `${globalNps.detractors}%` }} className="bg-red-500 transition-all duration-1000" />
                  <div style={{ width: `${globalNps.passives}%` }} className="bg-amber-400 transition-all duration-1000" />
                  <div style={{ width: `${globalNps.promoters}%` }} className="bg-emerald-500 transition-all duration-1000" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Empty state ──────────────────────────────── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-20 text-center">
            <Inbox size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-semibold text-slate-500">Aún no hay respuestas</p>
            <p className="mt-1 text-sm text-slate-400">Comparte tu encuesta para empezar a recibir datos.</p>
          </div>
        )}

        {/* ── Question Charts ──────────────────────────── */}
        {!isEmpty && (
          <div className="grid gap-6 md:grid-cols-2">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}

        {/* ── Captured Leads Table ───────────────────────── */}
        {!isEmpty && data?.leads && data.leads.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-amber-500" />
                <h2 className="text-base font-bold text-slate-800">Leads & Recompensas Reclamadas</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">Contactos capturados a través del premio final.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Contacto (Email / WhatsApp)</th>
                    <th className="px-6 py-3 font-semibold text-right">Fecha de reclamo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.leads.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {lead.contactInfo}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KPI Card
// ═══════════════════════════════════════════════════════════
const COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${COLOR_MAP[color] ?? COLOR_MAP.indigo}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Question Card (delegates to chart type)
// ═══════════════════════════════════════════════════════════
function QuestionCard({ question }: { question: ProcessedQuestion }) {
  const { type, title, answers } = question;

  if (answers.length === 0) {
    return (
      <Card title={title} count={0}>
        <p className="py-8 text-center text-sm text-slate-400">Sin respuestas aún</p>
      </Card>
    );
  }

  switch (type) {
    case 'rating_stars':
      return <RatingStarsChart question={question} />;
    case 'nps':
      return <NpsChart question={question} />;
    case 'linear_scale':
      return <LinearScaleChart question={question} />;
    case 'likert':
      return <LikertChart question={question} />;
    case 'csat':
      return <CsatChart question={question} />;
    case 'single_choice':
    case 'multiple_choice':
      return <ChoiceChart question={question} />;
    case 'text_open':
      return <TextOpenList question={question} />;
    default:
      return null;
  }
}

function Card({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <p className="mt-1 text-xs font-medium text-slate-400">Respuestas: {count}</p>
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Custom Tooltip
// ═══════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value ?? data.votos;
    const name = data.name;
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

    return (
      <div className="rounded-lg border border-slate-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold text-slate-800">{name}</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600">{value} votos</span>
          <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold text-indigo-600">
            {percent}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════
// Rating Stars Chart
// ═══════════════════════════════════════════════════════════
function RatingStarsChart({ question }: { question: ProcessedQuestion }) {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star
  let sum = 0;
  let total = 0;

  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 1 && n <= 5) {
      counts[n - 1]++;
      sum += n;
      total++;
    }
  }

  const avg = total > 0 ? (sum / total).toFixed(1) : '—';
  const chartData = counts.map((count, i) => ({
    name: `${i + 1} ★`,
    votos: count,
  }));

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-4 flex items-center gap-2">
        <Star size={28} className="fill-amber-400 text-amber-400" />
        <span className="text-3xl font-bold text-slate-800">{avg}</span>
        <span className="text-sm text-slate-400">/ 5 promedio</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={40} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#f59e0b" radius={[0, 6, 6, 0]} />
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
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let total = 0;

  for (const score of scores) {
    if (score >= 0 && score <= scaleMax) {
      counts[score]++;
      total++;
      if (scaleMax === 10) {
        if (score >= 9) promoters++;
        else if (score >= 7) passives++;
        else detractors++;
      } else {
        if (score === 7) promoters++;
        else if (score >= 5) passives++;
        else detractors++;
      }
    }
  }

  const chartData = counts.map((count, i) => {
    let color = NPS_COLORS.detractors; 
    if (scaleMax === 10) {
      if (i >= 7 && i <= 8) color = NPS_COLORS.passives;
      if (i >= 9) color = NPS_COLORS.promoters;
    } else {
      if (i === 0) return null; // 0 is not valid in 1-7 scale
      if (i >= 5 && i <= 6) color = NPS_COLORS.passives;
      if (i === 7) color = NPS_COLORS.promoters;
    }

    return {
      name: `${i}`,
      votos: count,
      fill: color
    };
  }).filter((x) => x !== null);

  const pPercent = total > 0 ? Math.round((promoters / total) * 100) : 0;
  const dPercent = total > 0 ? Math.round((detractors / total) * 100) : 0;
  const npsScore = pPercent - dPercent;

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl 
          ${npsScore > 0 ? 'bg-emerald-50 text-emerald-600' : npsScore < 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}
        >
          {npsScore > 0 ? '+' : ''}{npsScore}
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-800">Score de la Pregunta</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Promoter Score</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
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
  const normalizeTo10 = (x: number) => ((x - 1) * 10) / 6;

  let sum = 0;
  let total = 0;

  for (const a of question.answers) {
    const n = Number(a);
    if (!isNaN(n)) {
       const normVal = scaleMax === 7 ? normalizeTo10(n) : n;
       sum += normVal;
       total++;
    }
  }
  
  const avg = total > 0 ? (sum / total).toFixed(1) : '—';
  
  const counts = Array(scaleMax + 1).fill(0);
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 0 && n <= scaleMax) {
      counts[n]++;
    }
  }

  const chartData = counts.map((count, i) => ({
    name: `${i}`,
    votos: count,
  }));
  
  if (scaleMax === 7) chartData.shift(); // remove 0 index

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-4 flex items-center gap-3">
        <TrendingUp size={28} className="text-indigo-500" />
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-tight text-slate-800">{avg} <span className="text-lg font-bold text-slate-400">/ 10</span></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {scaleMax === 7 ? 'Promedio Normalizado Base 10' : 'Promedio Base 10'}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
    1: '1 - Muy en desacuerdo',
    2: '2 - En desacuerdo',
    3: '3 - Neutral',
    4: '4 - De acuerdo',
    5: '5 - Muy de acuerdo',
  };

  const counts = [0, 0, 0, 0, 0]; // 1 to 5
  let sum = 0;
  let total = 0;
  
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 1 && n <= 5) {
      counts[n - 1]++;
      sum += n;
      total++;
    }
  }

  const avg = total > 0 ? (sum / total).toFixed(1) : '—';
  const chartData = counts.map((count, i) => ({
    name: LIKERT_LABELS[i + 1],
    votos: count,
  }));

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-4 flex items-center gap-3">
        <TrendingUp size={28} className="text-violet-500" />
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-tight text-slate-800">{avg} <span className="text-lg font-bold text-slate-400">/ 5</span></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Promedio Nivel de Acuerdo</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Choice Chart (Single & Multiple)
// ═══════════════════════════════════════════════════════════
function ChoiceChart({ question }: { question: ProcessedQuestion }) {
  // Count occurrences (multiple_choice stores JSON arrays)
  const countMap = new Map<string, number>();

  for (const a of question.answers) {
    let values: string[];
    try {
      const parsed = JSON.parse(a);
      values = Array.isArray(parsed) ? parsed : [a];
    } catch {
      values = [a];
    }
    for (const v of values) {
      countMap.set(v, (countMap.get(v) ?? 0) + 1);
    }
  }

  const pieData = Array.from(countMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card title={question.title} count={question.answers.length}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            label={({ name = '', percent = 0, value }) =>
              `${name.length > 15 ? name.slice(0, 15) + '…' : name} (${value})`
            }
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={question.answers.length} />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Text Open List
// ═══════════════════════════════════════════════════════════
function TextOpenList({ question }: { question: ProcessedQuestion }) {
  const latest = question.answers.slice(-10).reverse();

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {latest.map((text, i) => (
          <div
            key={i}
            className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700"
          >
             &ldquo;{text}&rdquo;
          </div>
        ))}
      </div>
      {question.answers.length > 10 && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Mostrando las últimas 10 de {question.answers.length} respuestas
        </p>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// CSAT Chart (Caritas)
// ═══════════════════════════════════════════════════════════
function CsatChart({ question }: { question: ProcessedQuestion }) {
  const CSAT_LABELS: Record<number, { emoji: string; label: string }> = {
    1: { emoji: '😡', label: '1 - Muy mal' },
    2: { emoji: '🙁', label: '2 - Mal' },
    3: { emoji: '😐', label: '3 - Neutral' },
    4: { emoji: '🙂', label: '4 - Bien' },
    5: { emoji: '😍', label: '5 - Excelente' },
  };

  const counts = [0, 0, 0, 0, 0];
  let sum = 0;
  let total = 0;
  for (const a of question.answers) {
    const n = Number(a);
    if (n >= 1 && n <= 5) {
      counts[n - 1]++;
      sum += n;
      total++;
    }
  }

  const chartData = counts.map((count, i) => ({
    name: CSAT_LABELS[i + 1].label,
    votos: count,
  }));

  let maxIdx = 0;
  for (let i = 1; i < 5; i++) {
    if (counts[i] > counts[maxIdx]) maxIdx = i;
  }
  const topEmoji = total > 0 ? CSAT_LABELS[maxIdx + 1].emoji : '—';
  const topLabel = total > 0 ? CSAT_LABELS[maxIdx + 1]?.label.split(' - ')[1] : 'Sin respuestas';

  return (
    <Card title={question.title} count={question.answers.length}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-3xl shadow-sm">
          <span className="drop-shadow-sm">{topEmoji}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-800 capitalize">{topLabel}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sentimiento Principal</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip total={question.answers.length} />} />
          <Bar dataKey="votos" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
