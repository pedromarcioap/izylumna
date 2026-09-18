import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { LumnaLogo } from '../common/LumnaLogo';
import { validatePassword } from '../../lib/passwordValidation';
import { PasswordStrengthIndicator } from '../common/PasswordStrengthIndicator';
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
          'Autenticado no Izy Lumna Proofing com sucesso.',
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

      // Password Strength Validation
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        setIsLoading(false);
        return;
      }

      const res = await signUp(email, password, fullName, selectedRole);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage('Conta criada com sucesso! Você já está autenticado.');
        onShowToast(
          'Conta Criada com Sucesso!',
          'Seu perfil foi registrado no banco de dados com provisioning automático.',
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
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-white/10 bg-[#140F24]/90 shadow-2xl shadow-black/90 backdrop-blur-2xl">
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Header & Logo Emblem */}
          <div className="text-center space-y-4 flex flex-col items-center">
            <LumnaLogo variant="dark" layout="vertical" size="lg" showBadge={true} />

            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-widest font-mono bg-[#8300E9]/20 text-[#8300E9] dark:text-purple-300 font-extrabold px-3 py-1 rounded-full border border-[#8300E9]/40 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#46BDC6]" />
                <span>Autenticação de Estúdio Supabase</span>
              </span>
              <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Painel seguro para fotógrafos e gestão de cotas de aprovação.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#0A0714] rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-[#8300E9] text-white shadow border border-[#8300E9]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#46BDC6]" />
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
                  ? 'bg-[#8300E9] text-white shadow border border-[#8300E9]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#46BDC6]" />
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
              <label className="block text-xs font-medium text-zinc-300">
                Senha de Acesso *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Ex: Senha@123 (Mínimo 8 caract.)' : 'Sua senha'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0A0714] border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#8300E9] focus:ring-1 focus:ring-[#8300E9]/50 transition-colors"
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

              {/* Password Strength Indicator for Signup */}
              {mode === 'signup' && password && (
                <PasswordStrengthIndicator password={password} />
              )}
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Perfil de Acesso Solicitado
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#8300E9]"
                >
                  <option value="photographer">Fotógrafo Profissional</option>
                  <option value="user">Usuário Comum / Cliente</option>
                </select>
                <p className="text-[10px] text-zinc-400">
                  * A atribuição ou alteração de funções administrativas é realizada exclusivamente por um Administrador.
                </p>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-[#0A0714] text-[#8300E9] focus:ring-[#8300E9]/40"
                  />
                  <span>Lembrar de mim</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDemoCreds}
                  className="text-[#46BDC6] hover:text-[#46BDC6]/80 underline font-medium text-[11px]"
                >
                  Preencher Exemplo
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full py-3 bg-[#8300E9] hover:bg-[#8300E9]/90 text-white font-bold rounded-xl shadow-lg shadow-[#8300E9]/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Concluir Cadastro</span>
                  <UserCheck className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer return link */}
          <div className="pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onReturnToClient}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <span>Retornar para área de visualização do cliente</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
