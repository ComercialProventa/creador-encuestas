'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Settings, Loader2, ClipboardList, Zap, BarChart3, Gift, Code, Info, X, Lock, LogOut } from 'lucide-react';
import LoginModal from '@/components/LoginModal';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'ai' | 'json'>('ai');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [showJsonDocs, setShowJsonDocs] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsAdmin(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsNavigating(true);
    router.push(`/survey-builder?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleGenerateJson = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.title || !parsed.questions || !Array.isArray(parsed.questions)) {
        setJsonError('El JSON debe contener al menos "title" y un arreglo de "questions".');
        return;
      }
      setIsNavigating(true);
      sessionStorage.setItem('surveyDraft', jsonInput);
      router.push('/survey-builder');
    } catch (e) {
      setJsonError('El formato JSON es inválido. Verifica la sintaxis.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 selection:bg-indigo-500/30">
      {/* ── Decorative Ambient Backgrounds (Glassmorphism) ── */}
      <div className="pointer-events-none absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-400/20 mix-blend-multiply blur-[120px] will-change-transform"></div>
      <div className="pointer-events-none absolute right-[-5%] top-[10%] h-[400px] w-[400px] rounded-full bg-violet-400/20 mix-blend-multiply blur-[100px] will-change-transform"></div>
      <div className="pointer-events-none absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-purple-300/20 mix-blend-multiply blur-[150px] will-change-transform"></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {/* ── Top Header / Admin Link ── */}
        <div className="absolute right-6 top-6 sm:right-10 sm:top-10 flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="group flex items-center gap-2 rounded-full border border-red-200/60 bg-white/50 px-4 py-2.5 text-xs font-bold text-red-600 shadow-sm backdrop-blur-md transition-all hover:border-red-300 hover:bg-white/80 hover:text-red-700 hover:shadow-md active:scale-95"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => isAdmin ? router.push('/admin') : setIsLoginOpen(true)}
            className="group flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-md transition-all hover:border-indigo-300 hover:bg-white/80 hover:text-indigo-600 hover:shadow-md active:scale-95"
          >
            <Settings size={16} className={isAdmin ? 'transition-transform group-hover:rotate-45' : ''} />
            <span className="hidden sm:inline">Panel de Control</span>
          </button>
        </div>

        <div className="w-full max-w-4xl text-center">
          {/* ── Logo ── */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl shadow-indigo-600/30 ring-4 ring-white/50 transition-transform duration-500 hover:scale-105 hover:rotate-3">
            <ClipboardList size={36} className="text-white" />
          </div>

          {/* ── Premium Typography Title ── */}
          <h1 className="mx-auto mb-6 max-w-4xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Crea encuestas completas{' '}
            <span className="relative inline-block mt-2 sm:mt-0">
              <span className="relative z-10 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                en segundos
              </span>
              <span className="absolute bottom-1 left-0 -z-10 h-4 w-full skew-x-12 bg-indigo-100 opacity-70"></span>
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl">
            Describe lo que necesitas y nuestra inteligencia artificial diseñará la encuesta perfecta, lista para recolectar opiniones brillantes.
          </p>

          {/* ── Mode Selection Tabs (Glass style) ── */}
          <div className="mx-auto mb-8 flex max-w-sm justify-center rounded-2xl bg-white/40 p-1.5 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-md">
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${mode === 'ai'
                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Con IA
            </button>
            <button
              onClick={() => isAdmin ? setMode('json') : setIsLoginOpen(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${mode === 'json'
                ? 'bg-white text-emerald-600 shadow-md ring-1 ring-slate-100'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Importar JSON
              {!isAdmin && <Lock size={12} className="text-slate-400" />}
            </button>
          </div>

          {/* ── Interactive Input Area ── */}
          <div className="mx-auto max-w-3xl transform transition-all duration-500">
            {mode === 'ai' ? (
              <div className="group relative rounded-3xl bg-white/70 p-2 shadow-2xl shadow-indigo-100/50 ring-1 ring-white backdrop-blur-xl focus-within:bg-white focus-within:shadow-indigo-200/60 transition-all">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                    placeholder="Ej: Encuesta de 5 preguntas para evaluar una cafetería..."
                    className="w-full flex-1 border-none bg-transparent px-6 py-4 text-lg font-semibold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isNavigating || !prompt.trim()}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-indigo-600 hover:shadow-indigo-600/30 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isNavigating ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={18} className="text-indigo-300 group-hover:animate-pulse" />
                        Generar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto max-w-2xl rounded-3xl bg-white/80 p-6 text-left shadow-2xl shadow-emerald-100/50 ring-1 ring-white backdrop-blur-xl transition-all">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-extrabold text-slate-700">Pega el código JSON de tu encuesta</span>
                  <button
                    onClick={() => setShowJsonDocs(true)}
                    className="group inline-flex w-max items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                  >
                    <Info size={14} />
                    <span>Ver Formato</span>
                  </button>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError('');
                  }}
                  className="h-56 w-full resize-none rounded-2xl border-0 bg-slate-900 p-5 font-mono text-sm leading-relaxed text-emerald-400 shadow-inner outline-none ring-1 ring-inset ring-slate-800 transition-shadow focus:ring-2 focus:ring-emerald-500/50 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600"
                  placeholder={'{\n  "title": "Mi Encuesta Custom",\n  "description": "...",\n  "questions": []\n}'}
                />
                {jsonError && (
                  <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 ring-1 ring-red-100">
                    {jsonError}
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleGenerateJson}
                    disabled={!jsonInput.trim() || isNavigating}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isNavigating ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Code size={18} /> Importar Datos
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Feature Cards Grid ── */}
          <div className="mt-28 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Diseño Inteligente',
                desc: 'La IA estructura tus preguntas con las mejores prácticas del mercado al instante.',
                color: 'text-amber-500',
                bg: 'bg-amber-100',
                ring: 'ring-amber-200/50',
              },
              {
                icon: BarChart3,
                title: 'Dashboards en Vivo',
                desc: 'Métricas, gráficos NPS y analíticas interactivas en tiempo real para tu negocio.',
                color: 'text-indigo-600',
                bg: 'bg-indigo-100',
                ring: 'ring-indigo-200/50',
              },
              {
                icon: Gift,
                title: 'Más Respuestas',
                desc: 'Ofrece recompensas y descuentos para incentivar el feedback de tus clientes.',
                color: 'text-emerald-600',
                bg: 'bg-emerald-100',
                ring: 'ring-emerald-200/50',
              },
            ].map(({ icon: Icon, title, desc, color, bg, ring }, i) => (
              <div
                key={title}
                className="group relative flex flex-col items-center rounded-3xl bg-white/60 px-6 py-10 text-center shadow-lg shadow-slate-200/40 ring-1 ring-white backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${bg} ring-4 ${ring} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon size={26} className={color} />
                </div>
                <h3 className="mb-3 text-lg font-extrabold text-slate-800">{title}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-20 text-sm font-bold text-slate-400">
            Sistema de encuestas desarrollado por ProVenta Spa
          </p>
        </div>
      </div>

      {/* ── JSON Docs Modal (Soft backdrop blur) ── */}
      {showJsonDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-indigo-900/20 backdrop-blur-xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">Documentación JSON</h2>
              <button
                onClick={() => setShowJsonDocs(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 text-sm text-slate-600">
              <p className="text-base font-medium leading-relaxed text-slate-500">
                Puedes migrar encuestas desde otros sistemas pegando un JSON. El formato debe contener al menos un <strong className="text-slate-800">title</strong> y un arreglo de <strong className="text-slate-800">questions</strong>.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
                  <h3 className="mb-3 font-bold text-slate-800">Campos de la Encuesta:</h3>
                  <ul className="space-y-2 font-medium">
                    <li><code className="text-indigo-600">title</code> <span className="text-xs text-slate-400">(String, Req)</span></li>
                    <li><code className="text-indigo-600">description</code> <span className="text-xs text-slate-400">(String, Opc)</span></li>
                    <li><code className="text-indigo-600">primary_color</code> <span className="text-xs text-slate-400">("#hex", Opc)</span></li>
                    <li><code className="text-indigo-600">logo_url / cover_image_url</code> <span className="text-xs text-slate-400">(String, Opc)</span></li>
                    <li><code className="text-indigo-600">reward_type</code> <span className="text-xs text-slate-400">(none, discount_code, gift_card)</span></li>
                    <li><code className="text-indigo-600">require_contact</code> <span className="text-xs text-slate-400">(Boolean, pedir datos al final)</span></li>
                    <li><code className="text-indigo-600">questions</code> <span className="text-xs text-slate-400">(Array, Req)</span></li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
                  <h3 className="mb-3 font-bold text-slate-800">Atributos de Pregunta:</h3>
                  <ul className="space-y-2 font-medium">
                    <li><code className="text-emerald-600">title</code> <span className="text-xs text-slate-400">(String, Req)</span></li>
                    <li><code className="text-emerald-600">type</code> <span className="text-xs text-slate-400 text-[10px] block leading-tight mt-1">(text, single_choice, multiple_choice, nps, linear_scale, likert)</span></li>
                    <li><code className="text-emerald-600">isRequired</code> <span className="text-xs text-slate-400">(Boolean)</span></li>
                    <li><code className="text-emerald-600">options</code> <span className="text-xs text-slate-400">(Array of strings)</span></li>
                    <li><code className="text-emerald-600">scaleMax</code> <span className="text-xs text-slate-400">(7 o 10. Solo para nps/linear)</span></li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 p-6 shadow-inner">
                <h3 className="mb-4 font-bold text-white">Ejemplo Completo:</h3>
                <pre className="font-mono text-xs leading-relaxed text-emerald-300 overflow-x-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
                  {`{
  "title": "Evaluación de Servicio VIP",
  "description": "Tu opinión es anónima y nos ayuda a mejorar.",
  "primary_color": "#10b981",
  "reward_type": "discount_code",
  "require_contact": true,
  "questions": [
    {
      "title": "¿Qué servicio utilizaste?",
      "type": "single_choice",
      "options": ["Ventas", "Soporte Técnico"],
      "isRequired": true
    },
    {
      "title": "Del 1 al 7, ¿qué tan satisfecho estás?",
      "type": "linear_scale",
      "scaleMax": 7,
      "isRequired": true
    },
    {
      "title": "Evalúa estos aspectos:",
      "type": "likert",
      "options": ["Rapidez", "Amabilidad"],
      "isRequired": false
    }
  ]
}`}
                </pre>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowJsonDocs(false)}
                className="rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Cerrar Documentación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Login Modal ── */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
