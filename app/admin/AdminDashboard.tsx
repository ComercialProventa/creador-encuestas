'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  BarChart3,
  Share2,
  Trash2,
  Loader2,
  ClipboardList,
  X,
  Calendar,
  MessageSquareText,
  Inbox,
  ArrowLeft,
  Pencil,
  Check,
  LogOut,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Code,
  Copy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAllSurveys,
  deleteSurvey,
  fetchSurveyById,
  type SurveyListItem,
} from '@/actions/survey';
import QRCodeGenerator from '@/components/QRCodeGenerator';

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState<SurveyListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [jsonModal, setJsonModal] = useState<boolean>(false);
  const [fullJson, setFullJson] = useState<any>(null);
  const [loadingJson, setLoadingJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleOpenJson = async (id: string) => {
    setJsonModal(true);
    setLoadingJson(true);
    setFullJson(null);
    setCopiedJson(false);
    
    const { data } = await fetchSurveyById(id);
    if (data) {
      const exportData = {
        title: data.title,
        description: data.description,
        primary_color: data.primary_color,
        logo_url: data.logo_url,
        cover_image_url: data.cover_image_url,
        reward_type: data.reward_type,
        reward_text: data.reward_text,
        reward_image_url: data.reward_image_url,
        require_contact: data.require_contact,
        questions: data.questions.map(q => ({
          title: q.title,
          type: q.type,
          isRequired: q.is_required,
          options: q.options
        }))
      };
      setFullJson(exportData);
    }
    setLoadingJson(false);
  };

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllSurveys();
    setSurveys(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const result = await deleteSurvey(id);
    setDeleting(false);
    setDeleteConfirm(null);
    if (result.success) {
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mis Encuestas</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Gestiona {surveys.length}{' '}
            {surveys.length === 1 ? 'encuesta activa' : 'encuestas activas'}
          </p>
        </div>
        <Link
          href="/survey-builder"
          className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition-all active:scale-95 hover:shadow-xl hover:brightness-110"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          Crear Nueva Encuesta
        </Link>
      </div>

      {/* Empty */}
      {surveys.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-xl py-24 text-center ring-1 ring-slate-100 shadow-sm transition-all">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100/80 shadow-inner">
            <Inbox size={32} className="text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-700">Aún no tienes encuestas</p>
          <p className="mt-2 text-sm max-w-sm text-slate-500">Diseña tu primera encuesta con IA o desde cero y empieza a recolectar datos valiosos hoy.</p>
          <Link
            href="/survey-builder"
            className="mt-8 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Empezar ahora <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* Survey Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((s) => (
          <div
            key={s.id}
            className="group relative flex flex-col rounded-3xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/50 hover:ring-indigo-100"
          >
            {/* Top Color Banner */}
            <div 
              className="h-2 w-full transition-opacity group-hover:opacity-80" 
              style={{ backgroundColor: s.primary_color }}
            />
            
            <div className="p-6 flex flex-col flex-grow">
              {/* Header */}
              <div className="flex items-start justify-between min-w-0 gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-slate-800" title={s.title}>{s.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500" title={s.description}>
                    {s.description || 'Sin descripción'}
                  </p>
                </div>
                {s.logo_url && (
                  <img src={s.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-50 ring-1 ring-slate-100 shrink-0" />
                )}
              </div>

              {/* Badges / Stats */}
              <div className="mt-auto pt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-indigo-700">
                  <TrendingUp size={14} className="text-indigo-500" />
                  {s.response_count} {s.response_count === 1 ? 'respuesta' : 'respuestas'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(s.created_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions Footer (Scrollable horizontally on very small screens, wrapped normally) */}
            <div className="mt-2 border-t border-slate-100 bg-slate-50/50 p-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={`/survey?survey_id=${s.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Ver</span>
              </Link>

              <Link
                href={`/dashboard?survey_id=${s.id}`}
                className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm ring-1 ring-indigo-600 transition-all hover:bg-indigo-700"
              >
                <BarChart3 size={14} />
                <span className="hidden sm:inline">Analítica</span>
              </Link>

              <button
                type="button"
                onClick={() => setShareModal(s)}
                className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-violet-50 hover:text-violet-600 hover:ring-violet-200"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Compartir</span>
              </button>

              <div className="col-span-3 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 my-1 mx-1"></div>

              <Link
                href={`/survey-builder?id=${s.id}`}
                className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-200"
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Editar</span>
              </Link>
              
              <button
                type="button"
                onClick={() => handleOpenJson(s.id)}
                className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-slate-100 hover:text-slate-800"
              >
                <Code size={14} />
                <span className="hidden sm:inline">JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirm(s.id)}
                className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] sm:text-xs font-bold text-red-500 shadow-sm ring-1 ring-red-100 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Borrar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Compartir encuesta</h3>
              <button
                type="button"
                onClick={() => setShareModal(null)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 truncate text-sm font-medium text-slate-500">{shareModal.title}</p>
            <QRCodeGenerator
              url={
                typeof window !== 'undefined'
                  ? `${window.location.origin}/survey?survey_id=${shareModal.id}`
                  : `/survey?survey_id=${shareModal.id}`
              }
              primaryColor={shareModal.primary_color}
              logoUrl={shareModal.logo_url ?? undefined}
              title={shareModal.title}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">¿Eliminar encuesta?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta acción eliminará la encuesta y todas sus respuestas. No se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-70"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {jsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Visualizar JSON</h3>
              <button
                type="button"
                onClick={() => setJsonModal(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            
            {loadingJson ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
            ) : fullJson ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(JSON.stringify(fullJson, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 active:scale-95"
                >
                  {copiedJson ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedJson ? 'Copiado' : 'Copiar'}
                </button>
                <pre className="max-h-96 overflow-auto rounded-xl bg-slate-900 p-5 text-sm font-mono text-emerald-400 shadow-inner">
                  <code>{JSON.stringify(fullJson, null, 2)}</code>
                </pre>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm font-medium text-red-500">
                Error al cargar el JSON.
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]">
      {/* Esfera de luz de fondo para dar estilo Premium */}
      <div className="absolute top-0 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/10 mix-blend-multiply blur-[120px] pointer-events-none" />
      <div className="absolute top-40 -right-40 -z-10 h-[400px] w-[400px] rounded-full bg-violet-400/10 mix-blend-multiply blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              title="Volver al Inicio"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                <ClipboardList size={18} className="text-white" />
              </div>
              <h1 className="text-base font-bold text-slate-800">Panel de Control</h1>
            </div>
          </div>
          
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">{children}</main>
    </div>
  );
}
