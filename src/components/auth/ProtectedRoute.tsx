import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PhotographerLogin } from '../admin/PhotographerLogin';
import { Loader2, ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';

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
        <Loader2 className="w-8 h-8 text-[#8300E9] animate-spin mb-3" />
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
  onReturnToClient?: () => void;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, onReturnToClient, fallback }) => {
  const { user, profile, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="w-8 h-8 text-[#8300E9] animate-spin mb-3" />
        <p className="text-sm font-medium">Validando permissões de Administrador...</p>
      </div>
    );
  }

  if (!user || !profile || !isAdmin) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="max-w-lg mx-auto my-16 p-8 rounded-2xl bg-[#120E22] border border-red-500/30 text-center shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Acesso Restrito a Administradores
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Você está autenticado como <strong className="text-white">{profile?.email}</strong> com a função de{' '}
            <span className="px-2 py-0.5 rounded bg-white/10 text-amber-300 font-mono font-bold uppercase text-[10px]">
              {profile?.role === 'user' ? 'Usuário Comum' : profile?.role || 'user'}
            </span>
            . Esta página exige privilégios de <strong>Administrador do Sistema</strong>.
          </p>
        </div>

        {onReturnToClient && (
          <div className="pt-2 flex justify-center">
            <Button
              onClick={onReturnToClient}
              variant="outline"
              className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Voltar ao Portal do Cliente</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export interface StaffRouteProps {
  children: React.ReactNode;
  onReturnToClient?: () => void;
  fallback?: React.ReactNode;
}

export const StaffRoute: React.FC<StaffRouteProps> = ({ children, onReturnToClient, fallback }) => {
  const { user, profile, isPhotographer, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="w-8 h-8 text-[#8300E9] animate-spin mb-3" />
        <p className="text-sm font-medium">Validando permissões da equipe...</p>
      </div>
    );
  }

  if (!user || !profile || (!isPhotographer && profile?.role === 'user')) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="max-w-lg mx-auto my-16 p-8 rounded-2xl bg-[#120E22] border border-amber-500/30 text-center shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Área Exclusiva para Fotógrafos & Admins
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Sua conta (<strong className="text-white">{profile?.email}</strong>) possui a função de{' '}
            <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono font-bold uppercase text-[10px]">
              Usuário Comum / Cliente
            </span>
            . O acesso às ferramentas de gerenciamento do estúdio é restrito aos fotógrafos e administradores.
          </p>
        </div>

        {onReturnToClient && (
          <div className="pt-2 flex justify-center">
            <Button
              onClick={onReturnToClient}
              variant="outline"
              className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Voltar para Minhas Seleções</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
