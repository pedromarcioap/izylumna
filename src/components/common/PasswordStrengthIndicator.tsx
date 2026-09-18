import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { validatePassword } from '../../lib/passwordValidation';

export interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showChecklist?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword,
  showChecklist = true
}) => {
  if (!password) return null;

  const result = validatePassword(password, confirmPassword);
  const { requirements, score, label } = result;

  // Determine progress bar color
  let barColor = 'bg-red-500';
  let textColor = 'text-red-400';
  if (score > 80) {
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
  } else if (score > 60) {
    barColor = 'bg-purple-500';
    textColor = 'text-purple-400';
  } else if (score > 40) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400 flex items-center gap-1">
            {score >= 80 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            Força da Senha:
          </span>
          <span className={`font-bold uppercase ${textColor}`}>{label}</span>
        </div>

        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/10 flex">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      {showChecklist && (
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400 block mb-1">
            Requisitos Obrigatórios da Senha:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {/* 1. Min length */}
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                requirements.minLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {requirements.minLength ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              )}
              <span>No mínimo 8 caracteres</span>
            </div>

            {/* 2. Uppercase */}
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                requirements.hasUppercase ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {requirements.hasUppercase ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              )}
              <span>Letra Maiúscula (A-Z)</span>
            </div>

            {/* 3. Lowercase */}
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                requirements.hasLowercase ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {requirements.hasLowercase ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              )}
              <span>Letra Minúscula (a-z)</span>
            </div>

            {/* 4. Number */}
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                requirements.hasNumber ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {requirements.hasNumber ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              )}
              <span>Número (0-9)</span>
            </div>

            {/* 5. Special Character */}
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                requirements.hasSpecialChar ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {requirements.hasSpecialChar ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              )}
              <span>Caractere especial (!@#$...)</span>
            </div>

            {/* 6. Matching Passwords */}
            {confirmPassword !== undefined && (
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  requirements.passwordsMatch ? 'text-emerald-400 font-medium' : 'text-zinc-500'
                }`}
              >
                {requirements.passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
                )}
                <span>Senhas coincidem</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
