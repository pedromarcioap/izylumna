import { PhotographerProfile, PhotographerSession } from '../types';

export const DEFAULT_PHOTOGRAPHER_PROFILE: PhotographerProfile = {
  id: 'photo-admin-1',
  name: 'Lucas Silveira',
  email: 'fotografo@lumina.com',
  studioName: 'Lumina Studio Fotografia',
  phone: '(11) 98765-4321',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  defaultWatermarkText: 'PROVA • LUMINA STUDIO • PROVA',
  defaultExtraPrice: 30
};

export const DEFAULT_PHOTOGRAPHER_PASSWORD = 'admin123';

const PROFILE_KEY = 'lumina_photographer_profile_v1';
const CREDS_KEY = 'lumina_photographer_creds_v1';
const SESSION_KEY = 'lumina_photographer_session_v1';

export function getStoredCredentials(): { email: string; passwordHash: string } {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse credentials', e);
  }
  // Initialize default
  const defaultCreds = {
    email: DEFAULT_PHOTOGRAPHER_PROFILE.email.toLowerCase(),
    passwordHash: DEFAULT_PHOTOGRAPHER_PASSWORD
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(defaultCreds));
  return defaultCreds;
}

export function getPhotographerProfile(): PhotographerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse profile', e);
  }
  // Default profile
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PHOTOGRAPHER_PROFILE));
  return DEFAULT_PHOTOGRAPHER_PROFILE;
}

export function savePhotographerProfile(profile: PhotographerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  // Keep email in credentials in sync if changed
  const creds = getStoredCredentials();
  if (creds.email !== profile.email.toLowerCase()) {
    localStorage.setItem(
      CREDS_KEY,
      JSON.stringify({ ...creds, email: profile.email.toLowerCase() })
    );
  }
  // Update session profile if currently authenticated
  const session = getPhotographerSession();
  if (session.isAuthenticated) {
    savePhotographerSession({ ...session, profile });
  }
}

export function getPhotographerSession(): PhotographerSession {
  try {
    // Check localStorage first (rememberMe) then sessionStorage
    const localRaw = localStorage.getItem(SESSION_KEY);
    if (localRaw) {
      const parsed: PhotographerSession = JSON.parse(localRaw);
      if (parsed.isAuthenticated) return parsed;
    }

    const sessionRaw = sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      const parsed: PhotographerSession = JSON.parse(sessionRaw);
      if (parsed.isAuthenticated) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse photographer session', e);
  }

  return {
    isAuthenticated: false,
    profile: getPhotographerProfile()
  };
}

export function savePhotographerSession(session: PhotographerSession): void {
  const serialized = JSON.stringify(session);
  if (session.rememberMe) {
    localStorage.setItem(SESSION_KEY, serialized);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.removeItem(SESSION_KEY);
  }
}

export function loginPhotographer(
  emailInput: string,
  passwordInput: string,
  rememberMe = true
): { success: boolean; error?: string; session?: PhotographerSession } {
  const creds = getStoredCredentials();
  const normalizedEmail = emailInput.trim().toLowerCase();

  // Allow login by exact email or username "fotografo" or "admin"
  const isEmailMatch =
    normalizedEmail === creds.email.toLowerCase() ||
    normalizedEmail === 'fotografo' ||
    normalizedEmail === 'admin';

  if (!isEmailMatch) {
    return { success: false, error: 'E-mail ou usuário do fotógrafo não encontrado.' };
  }

  if (passwordInput !== creds.passwordHash) {
    return { success: false, error: 'Senha incorreta. Verifique suas credenciais.' };
  }

  const profile = getPhotographerProfile();
  const session: PhotographerSession = {
    isAuthenticated: true,
    token: `token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    loginTime: new Date().toISOString(),
    rememberMe,
    profile
  };

  savePhotographerSession(session);
  return { success: true, session };
}

export function logoutPhotographer(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function changePhotographerPassword(
  currentPasswordInput: string,
  newPasswordInput: string
): { success: boolean; error?: string } {
  const creds = getStoredCredentials();

  if (currentPasswordInput !== creds.passwordHash) {
    return { success: false, error: 'A senha atual informada está incorreta.' };
  }

  if (!newPasswordInput || newPasswordInput.length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  localStorage.setItem(
    CREDS_KEY,
    JSON.stringify({ ...creds, passwordHash: newPasswordInput })
  );

  return { success: true };
}

export function resetPhotographerToDefaults(): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PHOTOGRAPHER_PROFILE));
  localStorage.setItem(
    CREDS_KEY,
    JSON.stringify({
      email: DEFAULT_PHOTOGRAPHER_PROFILE.email.toLowerCase(),
      passwordHash: DEFAULT_PHOTOGRAPHER_PASSWORD
    })
  );
  logoutPhotographer();
}
