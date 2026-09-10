import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserPlus,
  User,
  CheckCircle2,
  AlertCircle
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
  const { signInWithPassword, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('photographer');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = await signInWithPassword(email, password);
      setIsLoading(false);

      if (res.success) {
        onShowToast(
          'Bem-vindo de volta!',
          'Autenticado via Supabase Auth com sucesso.',
          'success'
        );
        onLoginSuccess();
      } else {
        setError(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } else {
      if (!fullName.trim()) {
        setError('Por favor, informe seu nome completo.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve conter no mínimo 6 caracteres.');
        setIsLoading(false);
        return;
      }

      const res = await signUp(email, password, fullName, selectedRole);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage('Conta criada com sucesso! Você já está autenticado.');
        onShowToast(
          'Conta Criada com Sucesso!',
          'Seu perfil foi registrado no banco de dados com provisioning automático de função.',
          'success'
        );
        onLoginSuccess();
      } else {
        setError(res.error || 'Erro ao realizar cadastro.');
      }
    }
  };

  const handleFillDemoCreds = () => {
    setEmail('admin@lumina.com');
    setPassword('admin123');
    setFullName('Lucas Silveira');
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-brand-dark/50 bg-walnut-900 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Header & Emblem */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-widest font-mono bg-brand-accent text-brand-dark font-extrabold px-2.5 py-0.5 rounded border border-[#4F3926]/30 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Autenticação Oficial Supabase Auth</span>
              </span>
              <h1 className="font-serif text-2xl font-bold text-walnut-100 mt-2">
                IZY LUMNA Studio
              </h1>
              <p className="text-xs text-walnut-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Acesso seguro via RBAC para administradores, fotógrafos e gestão de cotas.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-walnut-950 rounded-xl border border-brand-dark/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-brand-primary text-white shadow border border-brand-primary/60'
                  : 'text-walnut-400 hover:text-walnut-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-brand-primary text-white shadow border border-brand-primary/60'
                  : 'text-walnut-400 hover:text-walnut-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Nome Completo *"
                type="text"
                placeholder="Ex: Lucas Silveira"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="E-mail *"
              type="email"
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
              <label className="block text-xs font-medium text-walnut-300">
                Senha de Acesso *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-walnut-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-walnut-950 border border-brand-dark/50 text-sm text-walnut-100 placeholder-walnut-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-walnut-500 hover:text-walnut-300 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-walnut-300">
                  Função / Papel Solicitado
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full py-2.5 px-3 rounded-xl bg-walnut-950 border border-brand-dark/50 text-xs text-walnut-200 focus:outline-none focus:border-brand-primary"
                >
                  <option value="photographer">Fotógrafo Profissional</option>
                  <option value="user">Usuário Comum / Cliente</option>
                  <option value="admin">Administrador (Sujeito à validação)</option>
                </select>
                <p className="text-[11px] text-walnut-400">
                  * Nota: O 1º usuário registrado no banco de dados torna-se Administrador automaticamente.
                </p>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-walnut-400 hover:text-walnut-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-brand-dark bg-walnut-950 text-brand-primary focus:ring-brand-primary/40"
                  />
                  <span>Lembrar de mim</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDemoCreds}
                  className="text-brand-emerald hover:text-brand-emerald/80 underline font-medium text-[11px]"
                >
                  Preencher Exemplo
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-brand-emerald/15 border border-brand-emerald/40 text-xs text-brand-emerald flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold shadow-lg shadow-[#01743F]/25"
              disabled={isLoading || !email.trim() || !password}
            >
              <span>
                {isLoading
                  ? 'Processando...'
                  : mode === 'login'
                  ? 'Entrar no Painel'
                  : 'Finalizar Cadastro'}
              </span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Switch to client view */}
          <div className="pt-2 border-t border-brand-dark/50 text-center">
            <button
              type="button"
              onClick={onReturnToClient}
              className="text-xs text-walnut-400 hover:text-walnut-200 transition-colors inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Você é um cliente? Ir para o <strong>Portal de Aprovação por PIN</strong></span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
