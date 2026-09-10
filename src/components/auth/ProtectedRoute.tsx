import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PhotographerLogin } from '../admin/PhotographerLogin';
import { Loader2, ShieldAlert } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  onReturnToClient?: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onReturnToClient,
  onShowToast
}) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Verificando sessão de autenticação...</p>
      </div>
    );
  }

  if (!user || !profile || !profile.is_active) {
    return (
      <PhotographerLogin
        onLoginSuccess={() => {}}
        onReturnToClient={onReturnToClient || (() => {})}
        onShowToast={onShowToast || (() => {})}
      />
    );
  }

  return <>{children}</>;
};

export interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, fallback }) => {
  const { user, profile, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Validando permissões de administrador...</p>
      </div>
    );
  }

  if (!user || !profile || !isAdmin) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="max-w-lg mx-auto my-12 p-8 rounded-2xl bg-zinc-900/90 border border-red-500/30 text-center shadow-2xl backdrop-blur-xl space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-zinc-100">Acesso Restrito a Administradores</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Você está autenticado como <strong className="text-zinc-200">{profile?.email}</strong> com a função de{' '}
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-semibold uppercase text-[10px]">
            {profile?.role || 'user'}
          </span>
          . Esta área exige privilégios de Administrador.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
