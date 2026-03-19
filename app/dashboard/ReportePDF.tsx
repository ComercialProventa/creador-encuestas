'use client';

import { useRef, useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { SurveyAnalytics, ProcessedQuestion } from '@/lib/analytics';

// ── Helpers ───────────────────────────────────────────────
function calcNpsBreakdown(questions: ProcessedQuestion[]) {
  const npsQs = questions.filter((q) => q.type === 'nps');
  let promoters = 0, passives = 0, detractors = 0, totalNps = 0;
  for (const q of npsQs) {
    const scaleMax = q.scaleMax === 7 ? 7 : 10;
    for (const a of q.answers) {
      const n = Number(a);
      if (isNaN(n)) continue;
      totalNps++;
      if (scaleMax === 10) {
        if (n >= 9) promoters++;
        else if (n >= 7) passives++;
        else detractors++;
      } else {
        if (n === 7) promoters++;
        else if (n >= 5) passives++;
        else detractors++;
      }
    }
  }
  if (totalNps === 0) return null;
  const pPct = Math.round((promoters / totalNps) * 100);
  const passPct = Math.round((passives / totalNps) * 100);
  const dPct = Math.round((detractors / totalNps) * 100);
  return { score: pPct - dPct, promoters: pPct, passives: passPct, detractors: dPct, total: totalNps };
}

function calcAvg(answers: string[], scaleMax: number): number | null {
  const min = 1;
  let sum = 0, count = 0;
  for (const a of answers) {
    const n = Number(a);
    if (!isNaN(n) && n >= min && n <= scaleMax) { sum += n; count++; }
  }
  return count > 0 ? sum / count : null;
}

function countOptions(answers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of answers) {
    let vals: string[];
    try { const p = JSON.parse(a); vals = Array.isArray(p) ? p : [a]; }
    catch { vals = [a]; }
    for (const v of vals) map.set(v, (map.get(v) ?? 0) + 1);
  }
  return map;
}

// ── Sub-components for the report (Premium Design) ────────
function Divider() {
  return <div style={{ height: 1, background: '#f1f5f9', margin: '28px 0' }} />;
}

function KpiBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: 24, padding: '24px 20px', textAlign: 'center'
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function NpsBar({ p, pa, d }: { p: number; pa: number; d: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
        <span style={{ color: '#ef4444' }}>{d}% Detractores</span>
        <span style={{ color: '#f59e0b' }}>{pa}% Pasivos</span>
        <span style={{ color: '#10b981' }}>{p}% Promotores</span>
      </div>
      <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', display: 'flex', background: '#f1f5f9' }}>
        <div style={{ width: `${d}%`, background: '#ef4444' }} />
        <div style={{ width: `${pa}%`, background: '#f59e0b' }} />
        <div style={{ width: `${p}%`, background: '#10b981' }} />
      </div>
    </div>
  );
}

function ScaleBar({ value, max, color = '#6366f1' }: { value: number; max: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 12, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', minWidth: 44, textAlign: 'right' }}>
        {value.toFixed(1)}<span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>/{max}</span>
      </span>
    </div>
  );
}

function ChoiceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
        <span style={{ color: '#334155', fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#64748b', fontWeight: 800 }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

// ── Hidden PDF Template ────────────────────────────────────
export function ReportePDFTemplate({ data, id }: { data: SurveyAnalytics; id: string }) {
  const { survey, totalResponses, questions, leads } = data;
  const nps = calcNpsBreakdown(questions);

  const dateStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const linearQs = questions.filter((q) => q.type === 'linear_scale');
  const npsQs = questions.filter((q) => q.type === 'nps');
  const starQs = questions.filter((q) => q.type === 'rating_stars');
  const choiceQs = questions.filter((q) => q.type === 'single_choice' || q.type === 'multiple_choice');
  const likertQs = questions.filter((q) => q.type === 'likert' || q.type === 'csat');
  const textQs = questions.filter((q) => q.type === 'text_open');

  const PALETTE = ['#6366f1', '#a855f7', '#14b8a6', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#8b5cf6'];

  return (
    <div
      id={id}
      style={{
        width: 794, // ~A4 at 96dpi
        background: '#f8fafc', // Very subtle off-white premium background
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: '#1e293b',
        boxSizing: 'border-box',
      }}
    >
      {/* ======================= COVER PAGE (HEADER + KPIs + NPS) ======================= */}
      <div className="pdf-page-block" style={{ background: '#f8fafc', paddingTop: 56, paddingBottom: 24 }}>
        
        {/* SECTION: HEADER */}
        <div style={{ padding: '0 52px 24px 52px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', borderRadius: 12, padding: '8px 16px', marginBottom: 12 }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Reporte de Satisfacción
                </span>
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.1, letterSpacing: -1 }}>
                {survey.title}
              </h1>
              {survey.description && (
                <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b', marginTop: 8, maxWidth: 450, lineHeight: 1.5 }}>{survey.description}</p>
              )}
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8', paddingTop: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <div style={{ fontWeight: 800, color: '#475569', fontSize: 11 }}>{dateStr}</div>
              <div style={{ marginTop: 4 }}>Informe generado automáticamente</div>
              <div style={{ marginTop: 2, color: '#6366f1' }}>{totalResponses} respuestas analizadas</div>
            </div>
          </div>
        </div>

        {/* SECTION: KPIs */}
        <div style={{ padding: '0 52px 24px 52px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Indicadores Clave de Rendimiento
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <KpiBox label="Respuestas" value={String(totalResponses)} sub="encuestados" color="#6366f1" />
            {nps && (
              <KpiBox
                label="NPS Global"
                value={(nps.score > 0 ? '+' : '') + nps.score}
                sub={`${nps.total} encuestas`}
                color={nps.score > 0 ? '#10b981' : nps.score < 0 ? '#ef4444' : '#f59e0b'}
              />
            )}
            {nps && <KpiBox label="Promotores" value={`${nps.promoters}%`} sub="satisfechos" color="#10b981" />}
            {nps && <KpiBox label="Detractores" value={`${nps.detractors}%`} sub="insatisfechos" color="#ef4444" />}
            {leads.length > 0 && <KpiBox label="Leads" value={String(leads.length)} sub="contactos capturados" color="#f59e0b" />}
          </div>
        </div>

        {/* SECTION: NPS BREAKDOWN */}
        {nps && (
          <div style={{ padding: '0 52px' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              Distribución NPS Global
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: nps.score > 0 ? '#10b981' : nps.score < 0 ? '#ef4444' : '#f59e0b' }}>
                    {nps.score > 0 ? '+' : ''}{nps.score}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 12 }}>
                    Net Promoter Score
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <NpsBar p={nps.promoters} pa={nps.passives} d={nps.detractors} />
                </div>
              </div>

              {/* EDUCATION: ¿QUÉ ES EL NPS? */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '20px 24px', marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  ¿CÓMO INTERPRETAR SU NET PROMOTER SCORE (NPS)?
                </div>
                <div style={{ fontSize: 9.5, color: '#475569', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0 }}>
                    El <strong>Net Promoter Score (NPS)</strong> es el estándar global para medir la lealtad y satisfacción de sus clientes. Su objetivo principal es responder a la pregunta de cuán probable es que sus clientes recomienden su producto, servicio o marca a un conocido.
                  </p>
                  <p style={{ margin: 0 }}>
                    El cálculo se realiza restando el porcentaje de clientes insatisfechos o <strong>Detractores</strong> (quienes calificaron del 0 al 6 y dañarán la marca con el boca a boca negativo) al porcentaje de clientes altamente leales o <strong>Promotores</strong> (quienes calificaron con 9 o 10 y recomendarán activamente la empresa). Los clientes <strong>Pasivos</strong> (calificación de 7 a 8) se cuentan en el volumen total pero no afectan el puntaje final, ya que no son leales a largo plazo pero tampoco hablan mal del servicio.
                  </p>
                  <p style={{ margin: 0, fontWeight: 800, color: '#334155', marginTop: 4 }}>
                    Rangos de Evaluación y Puntuaciones: Un puntaje que va de -100 a +100. Tener un valor mayor a cero siempre significa que tiene más clientes leales que perjudiciales, lo cual es de vital importancia:
                  </p>
                  
                  <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 2 }}>Rango Negativo: -100 a -1 (Crítico)</div>
                      <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4 }}>Existen más clientes dispuestos a hablar negativamente de su negocio que recomendándolo. Su marca está perdiendo clientes. Requiere atención e implementación de mejoras inmediatas en el servicio a cliente.</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: 2 }}>Rango de 0 a 30 (Bueno)</div>
                      <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4 }}>Es un resultado aceptable. Tienen más clientes felices que molestos, pero hay un margen muy grande de mejora para asegurar la lealtad a largo plazo o para superar a competidores directos.</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#10b981', marginBottom: 2 }}>Rango de 31 a 70 (Excelente)</div>
                      <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4 }}>La gran mayoría de sus clientes recomiendan activamente su negocio e impulsan de gran manera el crecimiento orgánico (boca a boca). Demuestra un posicionamiento sumamente sólido en clientes satisfechos.</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#8b5cf6', marginBottom: 2 }}>Rango de 71 a 100 (Clase Mundial)</div>
                      <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4 }}>Un estatus alcanzado únicamente por las mejores y más queridas empresas a nivel global. Generación masiva de recomendación. Nivel de retención casi absoluto.</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 8.5, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                    * Nota metodológica: Aunque el estándar internacional utiliza una escala del 0 al 10, la plataforma ajusta rigurosamente el cálculo estadístico a una <strong>{`escala local ${(survey as any).scale_max ? `de 1 a ${(survey as any).scale_max}` : 'adaptada'}`}</strong> para ajustarse a las normativas de evaluación del país, garantizando la misma validez internacional del resultado final.
                  </div>
                </div>
              </div>
              
              {npsQs.length > 1 && (
                <>
                <div style={{ height: 1, background: '#f1f5f9', margin: '24px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {npsQs.map((q) => {
                    const sm = q.scaleMax === 7 ? 7 : 10;
                    let p = 0, pa = 0, d = 0, t = 0;
                    for (const a of q.answers) {
                      const n = Number(a); if (isNaN(n)) continue; t++;
                      if (sm === 10) { if (n >= 9) p++; else if (n >= 7) pa++; else d++; }
                      else { if (n === 7) p++; else if (n >= 5) pa++; else d++; }
                    }
                    const sc = t > 0 ? Math.round(((p - d) / t) * 100) : 0;
                    return (
                      <div key={q.id} style={{ background: '#f8fafc', borderRadius: 16, padding: '16px 20px' }}>
                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 8, fontWeight: 700 }}>{q.title}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: sc > 0 ? '#10b981' : sc < 0 ? '#ef4444' : '#f59e0b' }}>
                          {sc > 0 ? '+' : ''}{sc}
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Score (1–{sm})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* SECTION: ESCALAS LINEALES */}
      {linearQs.length > 0 && (
        <div className="pdf-page-block" style={{ padding: '24px 52px', background: '#f8fafc' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Escalas Lineales
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px 32px' }}>
            {linearQs.map((q, idx) => {
              const sm = q.scaleMax === 7 ? 7 : 10;
              const avg = calcAvg(q.answers, sm);
              const isLast = idx === linearQs.length - 1;
              return (
                <div key={q.id} style={{ marginBottom: isLast ? 0 : 24, borderBottom: isLast ? 'none' : '1px dashed #f1f5f9', paddingBottom: isLast ? 0 : 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{q.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{q.answers.length} resp.</span>
                  </div>
                  {avg !== null
                    ? <ScaleBar value={avg} max={sm} color="#6366f1" />
                    : <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin datos</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: ESTRELLAS */}
      {starQs.length > 0 && (
        <div className="pdf-page-block" style={{ padding: '24px 52px', background: '#f8fafc' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Reseñas en Estrellas
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px 32px' }}>
            {starQs.map((q, idx) => {
              const avg = calcAvg(q.answers, 5);
              const isLast = idx === starQs.length - 1;
              return (
                <div key={q.id} style={{ marginBottom: isLast ? 0 : 24, borderBottom: isLast ? 'none' : '1px dashed #f1f5f9', paddingBottom: isLast ? 0 : 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{q.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{q.answers.length} resp.</span>
                  </div>
                  {avg !== null
                    ? <ScaleBar value={avg} max={5} color="#f59e0b" />
                    : <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin datos</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: LIKERT / CSAT */}
      {likertQs.length > 0 && (
        <div className="pdf-page-block" style={{ padding: '24px 52px', background: '#f8fafc' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Nivel de Acuerdo & Satisfacción (CSAT)
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px 32px' }}>
            {likertQs.map((q, idx) => {
              const avg = calcAvg(q.answers, 5);
              const isLast = idx === likertQs.length - 1;
              return (
                <div key={q.id} style={{ marginBottom: isLast ? 0 : 24, borderBottom: isLast ? 'none' : '1px dashed #f1f5f9', paddingBottom: isLast ? 0 : 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{q.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{q.answers.length} resp.</span>
                  </div>
                  {avg !== null
                    ? <ScaleBar value={avg} max={5} color="#a855f7" />
                    : <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin datos</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTIONS: OPCIONES (One block per question to avoid cuts) */}
      {choiceQs.length > 0 && (
        <>
          {choiceQs.map((q, qi) => {
            const map = countOptions(q.answers);
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            const total = q.answers.length;
            return (
              <div key={q.id} className="pdf-page-block" style={{ padding: '24px 52px', background: '#f8fafc' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                  Elección de Opciones
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px 32px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 16 }}>{q.title}</div>
                  {sorted.slice(0, 8).map(([label, count], i) => (
                    <ChoiceBar key={i} label={label} count={count} total={total} color={PALETTE[(qi + i) % PALETTE.length]} />
                  ))}
                  {sorted.length > 8 && (
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginTop: 12, textAlign: 'center', background: '#f8fafc', padding: '8px', borderRadius: 8 }}>
                      +{sorted.length - 8} opciones adicionales omitidas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* SECTIONS: RESPUESTAS ABIERTAS */}
      {textQs.length > 0 && (
        <div className="pdf-page-block" style={{ padding: '24px 52px', background: '#f8fafc' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Anexo Oficial
          </div>
          
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginBottom: 12 }}>
              Revisar Comentarios Íntegros
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, maxWidth: 500, margin: '0 auto 20px auto', lineHeight: 1.5 }}>
              Para garantizar una lectura limpia y eficiente del reporte directivo, los bloques extensos de respuestas de texto libre se han transferido a su propia vista digital.
            </div>
            {/* The URL will be dynamic based on window.location */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 16, display: 'inline-block', color: '#4f46e5', fontWeight: 700, fontSize: 13, wordBreak: 'break-all' }}>
               {typeof window !== 'undefined' ? `${window.location.origin}/survey/${survey.id}/comments` : `/survey/${survey.id}/comments`}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: FOOTER */}
      <div className="pdf-page-block" style={{ padding: '0 52px 48px 52px', background: '#f8fafc' }}>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Reporte Confidencial</span>
          <span style={{ letterSpacing: 0.5 }}>Generado automáticamente el {dateStr}</span>
        </div>
      </div>
    </div>
  );
}

// ── Export Button ──────────────────────────────────────────
interface ReportePDFButtonProps {
  data: SurveyAnalytics;
}

export default function ReportePDFButton({ data }: ReportePDFButtonProps) {
  const [generating, setGenerating] = useState(false);
  const templateId = 'reporte-pdf-hidden';

  const handleExportPDF = () => {
    setGenerating(true);

    // Utilizamos setTimeout para ceder el hilo principal (Event Loop) y permitir
    // que el botón de React se renderice en estado "Cargando..." antes de bloquear el CPU.
    setTimeout(async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const wrapper = document.getElementById(templateId);
        if (!wrapper) throw new Error('PDF template not found');

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();    // 210mm
        const pageHeight = pdf.internal.pageSize.getHeight();  // 297mm

        // Find all the discrete blocks we created
        const blocks = wrapper.querySelectorAll('.pdf-page-block');
        
        let currentYMm = 0;
        let isFirstPage = true;

        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i] as HTMLElement;
          
          // Render this specific block with 3x scale for ultra-crisp Retina-level resolution
          const canvas = await html2canvas(block, {
            scale: 3, 
            useCORS: true,
            backgroundColor: '#f8fafc',
            logging: false,
            windowWidth: 794,
          });

          // Calculate how much vertical space this block takes in the PDF
          const blockWidthMm = pageWidth;
          const blockHeightMm = (canvas.height * pageWidth) / canvas.width;

          // If block doesn't fit on the current page (and it's not the very top of a new page already)
          if (currentYMm + blockHeightMm > pageHeight && currentYMm > 0) {
            pdf.addPage();
            currentYMm = 0;
            isFirstPage = false;
          }

          // What if a single block is larger than a whole page?
          if (blockHeightMm > pageHeight) {
            // We have to slice the block itself into multiple pages
            let sliceY = 0;
            while (sliceY < blockHeightMm) {
              const h = Math.min(pageHeight - currentYMm, blockHeightMm - sliceY);
              const hPx = (h * canvas.width) / pageWidth;
              const startPx = (sliceY * canvas.width) / pageWidth;

              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = hPx;
              const ctx = sliceCanvas.getContext('2d');
              ctx?.drawImage(canvas, 0, startPx, canvas.width, hPx, 0, 0, canvas.width, hPx);

              // Compress as JPEG to drastically drop MB weighting and speed up scrolling
              pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, currentYMm, blockWidthMm, h);
              
              sliceY += h;
              currentYMm += h;
              
              if (sliceY < blockHeightMm) {
                pdf.addPage();
                currentYMm = 0;
                isFirstPage = false;
              }
            }
          } else {
            // Normal fit
            // Compress as JPEG (85% quality) to radically reduce file size vs lossless PNG
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, currentYMm, blockWidthMm, blockHeightMm);
            currentYMm += blockHeightMm;
          }
        }

        const filename = data.survey.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        pdf.save(`reporte-${filename}.pdf`);
      } catch (err) {
        console.error('Error generando PDF:', err);
        alert('Error al generar el PDF. Revisa la consola para más detalles.');
      } finally {
        setGenerating(false);
      }
    }, 150);
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          zIndex: -1,
        }}
      >
        <ReportePDFTemplate data={data} id={templateId} />
      </div>

      <button
        type="button"
        onClick={handleExportPDF}
        disabled={generating}
        className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-75 disabled:hover:translate-y-0"
      >
        {generating ? (
          <Loader2 size={16} className="animate-spin text-white/80" />
        ) : (
          <FileDown size={16} className="text-white/90" />
        )}
        {generating ? 'Generando PDF...' : 'Descargar Informe'}
      </button>
    </>
  );
}
