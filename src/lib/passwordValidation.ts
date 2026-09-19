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

/**
 * Utility function to get a cryptographically secure random integer in range [0, max - 1].
 * Uses Web Crypto API (crypto.getRandomValues) and prevents modulo bias.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const cryptoObj =
    typeof window !== 'undefined' && window.crypto
      ? window.crypto
      : typeof crypto !== 'undefined'
      ? crypto
      : undefined;

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % max);
    let randomVal: number;
    do {
      cryptoObj.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);
    return randomVal % max;
  }

  // Fallback for environments lacking Web Crypto API
  return Math.floor(Math.random() * max);
}

/**
 * Generates a cryptographically secure random password meeting all password entropy and policy requirements.
 * Ensures inclusion of uppercase, lowercase, numeric, and special characters.
 * Validates the generated password against validatePassword before returning.
 * 
 * @param length Minimum length of the password (default: 16)
 */
export function generateSecurePassword(length: number = 16): string {
  const targetLength = Math.max(length, 12);
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz';
  const numberChars = '23456789';
  const specialChars = '!@#$%^&*()_+-=[]{}';
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  // Guarantee at least one character from each required set
  const requiredChars = [
    uppercaseChars[getSecureRandomInt(uppercaseChars.length)],
    lowercaseChars[getSecureRandomInt(lowercaseChars.length)],
    numberChars[getSecureRandomInt(numberChars.length)],
    specialChars[getSecureRandomInt(specialChars.length)]
  ];

  // Fill the remainder from the unified set
  const remainingLength = targetLength - requiredChars.length;
  const restChars: string[] = [];
  for (let i = 0; i < remainingLength; i++) {
    restChars.push(allChars[getSecureRandomInt(allChars.length)]);
  }

  // Combine and perform Fisher-Yates shuffle securely
  const combined = [...requiredChars, ...restChars];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  const generatedPassword = combined.join('');

  // Assert validation compliance defensively
  const validation = validatePassword(generatedPassword);
  if (!validation.isValid) {
    return generateSecurePassword(targetLength);
  }

  return generatedPassword;
}

/**
 * Generates a cryptographically secure numeric PIN (default 6 digits).
 */
export function generateSecurePin(length: number = 6): string {
  const digits = '0123456789';
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result.push(digits[getSecureRandomInt(digits.length)]);
  }
  return result.join('');
}

/**
 * Generates a cryptographically secure alphanumeric token (default 32 chars).
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result.push(chars[getSecureRandomInt(chars.length)]);
  }
  return result.join('');
}

