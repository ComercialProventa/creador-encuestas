import type { Metadata } from 'next';
import { Suspense } from 'react';
import SurveyBuilder from './SurveyBuilder';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Survey Builder — Crea tu encuesta',
  description:
    'Constructor visual de encuestas modulares para comercios locales.',
};

export default function SurveyBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      }
    >
      <SurveyBuilder />
    </Suspense>
  );
}
