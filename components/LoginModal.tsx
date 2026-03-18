'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      onClose();
      router.push('/admin');
      router.refresh(); // Refresh to ensure server components get the latest auth state
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-opacity">
      <div 
        className="relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white/95 p-8 text-left shadow-2xl shadow-indigo-900/20 ring-1 ring-slate-200/50 backdrop-blur-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/50">
            <Lock size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Acceso Admin</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa tus credenciales para administrar la plataforma.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="admin@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600 ring-1 ring-red-100/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 md:px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50 hover:shadow-xl hover:brightness-110"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
