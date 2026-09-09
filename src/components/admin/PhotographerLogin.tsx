import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { loginPhotographer, DEFAULT_PHOTOGRAPHER_PASSWORD, getPhotographerProfile } from '../../lib/auth';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Camera,
  Sparkles,
  UserCheck
} from 'lucide-react';

export interface PhotographerLoginProps {
  onLoginSuccess: () => void;
  onReturnToClient: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PhotographerLogin: React.FC<PhotographerLoginProps> = ({
  onLoginSuccess,
  onReturnToClient,
  onShowToast
}) => {
  const profile = getPhotographerProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginPhotographer(email, password, rememberMe);
      setIsLoading(false);

      if (result.success) {
        onShowToast(
          'Bem-vindo de volta!',
          `Autenticado como ${result.session?.profile.name || 'Fotógrafo'}. Painel liberado.`,
          'success'
        );
        onLoginSuccess();
      } else {
        setError(result.error || 'Credenciais inválidas. Tente novamente.');
      }
    }, 250);
  };

  const handleFillDemoCreds = () => {
    setEmail(profile.email);
    setPassword(DEFAULT_PHOTOGRAPHER_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-zinc-800 bg-zinc-900/90 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Studio Brand & Security Emblem */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-widest font-mono text-amber-400/90 font-semibold flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acesso Exclusivo do Fotógrafo</span>
              </span>
              <h1 className="font-serif text-2xl font-bold text-zinc-100 mt-1">
                Lumina Studio
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Entre com seu login e senha para acessar a gestão de ensaios, cotas de clientes e faturamento de fotos extras.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail ou Usuário"
              type="text"
              placeholder="fotografo@lumina.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="username"
              autoFocus
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500/40"
                />
                <span>Lembrar de mim</span>
              </label>

              <button
                type="button"
                onClick={handleFillDemoCreds}
                className="text-amber-400/90 hover:text-amber-300 underline font-medium text-[11px]"
              >
                Preencher Demo
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 animate-in fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="amber"
              size="lg"
              className="w-full text-sm font-semibold shadow-lg shadow-amber-500/20"
              disabled={isLoading || !email.trim() || !password}
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar no Painel do Fotógrafo'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Demo helper card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850 text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Credenciais Padrão</span>
              </span>
              <button
                type="button"
                onClick={handleFillDemoCreds}
                className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-mono border border-amber-500/30 transition-colors"
              >
                Inserir
              </button>
            </div>
            <div className="font-mono text-[11px] text-zinc-400 space-y-0.5">
              <div>E-mail: <span className="text-zinc-200">{profile.email}</span></div>
              <div>Senha: <span className="text-zinc-200">admin123</span></div>
            </div>
          </div>

          {/* Switch to client view */}
          <div className="pt-2 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={onReturnToClient}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Você é um cliente? Ir para o <strong>Portal de Aprovação</strong></span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
