export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch?: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: PasswordRequirements;
  score: number; // 0 to 100
  label: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte' | 'Excelente';
}

export function validatePassword(password: string, confirmPassword?: string): PasswordValidationResult {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch =
    confirmPassword !== undefined ? password === confirmPassword && password.length > 0 : true;

  const errors: string[] = [];

  if (!password) {
    errors.push('A senha de acesso é obrigatória.');
  } else {
    if (!minLength) {
      errors.push('A senha deve conter no mínimo 8 caracteres.');
    }
    if (!hasUppercase) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula (A-Z).');
    }
    if (!hasLowercase) {
      errors.push('A senha deve conter pelo menos uma letra minúscula (a-z).');
    }
    if (!hasNumber) {
      errors.push('A senha deve conter pelo menos um número (0-9).');
    }
    if (!hasSpecialChar) {
      errors.push('A senha deve conter pelo menos um caractere especial (ex: !@#$%^&*).');
    }
    if (confirmPassword !== undefined && confirmPassword.length > 0 && !passwordsMatch) {
      errors.push('A confirmação de senha não coincide com a nova senha digitada.');
    }
  }

  let metCount = 0;
  if (minLength) metCount++;
  if (hasUppercase) metCount++;
  if (hasLowercase) metCount++;
  if (hasNumber) metCount++;
  if (hasSpecialChar) metCount++;

  const score = (metCount / 5) * 100;

  let label: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte' | 'Excelente' = 'Muito Fraca';
  if (score <= 20) label = 'Muito Fraca';
  else if (score <= 40) label = 'Fraca';
  else if (score <= 60) label = 'Média';
  else if (score <= 80) label = 'Forte';
  else label = 'Excelente';

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    requirements: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      passwordsMatch
    },
    score,
    label
  };
}
