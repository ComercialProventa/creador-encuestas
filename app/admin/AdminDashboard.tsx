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
  Code,
  Copy,
  Check,
  LogOut,
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
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Encuestas</h1>
          <p className="text-sm text-slate-500">
            {surveys.length}{' '}
            {surveys.length === 1 ? 'encuesta creada' : 'encuestas creadas'}
          </p>
        </div>
        <Link
          href="/survey-builder"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:brightness-110"
        >
          <Plus size={18} />
          Crear Nueva Encuesta
        </Link>
      </div>

      {/* Empty */}
      {surveys.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-20 text-center">
          <Inbox size={48} className="mb-4 text-slate-300" />
          <p className="text-lg font-semibold text-slate-500">Aún no tienes encuestas</p>
          <p className="mt-1 text-sm text-slate-400">Crea tu primera encuesta para comenzar.</p>
        </div>
      )}

      {/* Survey Cards */}
      <div className="space-y-4">
        {surveys.map((s) => (
          <div
            key={s.id}
            className="group flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Color dot + Info */}
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: s.primary_color }}
              />
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-800">{s.title}</h2>
                {s.description && (
                  <p className="mt-0.5 truncate text-sm text-slate-500">{s.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(s.created_at).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquareText size={12} />
                    {s.response_count} {s.response_count === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <Link
                href={`/survey-builder?id=${s.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              >
                <Pencil size={14} />
                Editar
              </Link>
              <button
                type="button"
                onClick={() => handleOpenJson(s.id)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <Code size={14} />
                JSON
              </button>
              <Link
                href={`/dashboard?survey_id=${s.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
              >
                <BarChart3 size={14} />
                Analítica
              </Link>
              <button
                type="button"
                onClick={() => setShareModal(s)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-600"
              >
                <Share2 size={14} />
                Compartir
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(s.id)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
