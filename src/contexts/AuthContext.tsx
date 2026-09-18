import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole, PhotographerProfile } from '../types';
import { logoutPhotographer, savePhotographerProfile, savePhotographerSession } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPhotographer: boolean;
  isSupabaseConnected: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminUpdateUser: (userId: string, data: { role?: UserRole; is_active?: boolean }) => Promise<{ success: boolean; error?: string }>;
  adminCreateUser: (data: { email: string; password?: string; fullName: string; role: UserRole; phone?: string }) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  fetchAllProfiles: () => Promise<UserProfile[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'izylumna_fallback_auth_user_v1';
const LOCAL_PROFILES_KEY = 'izylumna_local_profiles_v2';

const isValidUUID = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getStoredProfiles = (): UserProfile[] => {
    try {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Erro ao ler perfis locais:', e);
    }
    return [];
  };

  const saveStoredProfiles = (profiles: UserProfile[]) => {
    try {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Erro ao salvar perfis locais:', e);
    }
  };

  // Fetch profile from public.profiles table or local storage
  const fetchUserProfile = async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    const localProfiles = getStoredProfiles();
    const localMatch = localProfiles.find(
      (p) => p.id === userId || (userEmail && p.email.toLowerCase() === userEmail.toLowerCase())
    );

    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return {
            ...(data as UserProfile),
            ...(localMatch && {
              is_active: localMatch.is_active,
              role: localMatch.role
            })
          };
        }
      } catch (e) {
        console.warn('Erro ao buscar perfil no Supabase:', e);
      }
    }

    if (localMatch) {
      return localMatch;
    }

    return {
      id: isValidUUID(userId) ? userId : generateUUID(),
      email: userEmail,
      full_name: splitEmailName(userEmail),
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    };
  };

  const splitEmailName = (email: string) => {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            if (initialSession?.user) {
              const prof = await fetchUserProfile(initialSession.user.id, initialSession.user.email || '');
              if (mounted) setProfile(prof);
            }
          }
        } catch (err) {
          console.error('Erro na inicialização do Supabase Auth:', err);
        } finally {
          if (mounted) setIsLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
              const prof = await fetchUserProfile(currentSession.user.id, currentSession.user.email || '');
              if (mounted) setProfile(prof);
            } else {
              if (mounted) setProfile(null);
            }
            setIsLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Fallback mode when Supabase env vars are missing/placeholder
        try {
          const stored = localStorage.getItem(LOCAL_SESSION_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed.user);
            setProfile(parsed.profile);
          }
        } catch (e) {
          console.error('Erro no fallback local de auth:', e);
        } finally {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const emailClean = email.trim().toLowerCase();
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailClean,
          password
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const prof = await fetchUserProfile(data.user.id, data.user.email || emailClean);
          if (prof && !prof.is_active) {
            await supabase.auth.signOut();
            setIsLoading(false);
            return {
              success: false,
              error: 'A sua conta foi suspensa/desativada por um administrador. Entre em contato com o suporte.'
            };
          }
          setProfile(prof);
          if (prof) {
            const photoProfile: PhotographerProfile = {
              id: prof.id,
              name: prof.full_name || splitEmailName(prof.email),
              email: prof.email,
              studioName: 'Lumina Proofing Studio',
              phone: '',
              avatarUrl: prof.avatar_url || '',
              defaultWatermarkText: 'PROVA • LUMINA STUDIO • PROVA',
              defaultExtraPrice: 30
            };
            savePhotographerProfile(photoProfile);
            savePhotographerSession({
              isAuthenticated: true,
              token: `token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              loginTime: new Date().toISOString(),
              rememberMe: true,
              profile: photoProfile
            });
          }
        }
        setIsLoading(false);
        return { success: true };
      } else {
        // Local simulation login
        const allProfiles = await fetchAllProfiles();
        let matchingProfile = allProfiles.find(
          (p) =>
            p.email.toLowerCase() === emailClean ||
            (emailClean === 'admin' && p.role === 'admin') ||
            (emailClean === 'fotografo' && (p.role === 'photographer' || p.role === 'admin'))
        );

        if (matchingProfile) {
          if (!matchingProfile.is_active) {
            setIsLoading(false);
            return {
              success: false,
              error: 'A sua conta foi suspensa/desativada por um administrador. Entre em contato com o suporte.'
            };
          }
        } else {
          matchingProfile = {
            id: generateUUID(),
            email: emailClean,
            full_name: splitEmailName(emailClean),
            role: allProfiles.length === 0 ? 'admin' : 'photographer',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          const existingLocal = getStoredProfiles();
          saveStoredProfiles([matchingProfile, ...existingLocal.filter((p) => p.email.toLowerCase() !== emailClean)]);
        }

        const mockUser: any = { id: matchingProfile.id, email: matchingProfile.email };
        setUser(mockUser);
        setProfile(matchingProfile);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: mockUser, profile: matchingProfile }));

        // Sync with local photographer session in lib/auth.ts
        const photoProfile: PhotographerProfile = {
          id: matchingProfile.id,
          name: matchingProfile.full_name || splitEmailName(matchingProfile.email),
          email: matchingProfile.email,
          studioName: 'Lumina Proofing Studio',
          phone: '',
          avatarUrl: matchingProfile.avatar_url || '',
          defaultWatermarkText: 'PROVA • LUMINA STUDIO • PROVA',
          defaultExtraPrice: 30
        };
        savePhotographerProfile(photoProfile);
        savePhotographerSession({
          isAuthenticated: true,
          token: `token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          loginTime: new Date().toISOString(),
          rememberMe: true,
          profile: photoProfile
        });

        setIsLoading(false);
        return { success: true };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Erro inesperado durante a autenticação.' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'user'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const emailClean = email.trim().toLowerCase();

      // Prevent registration of existing emails
      const allProfiles = await fetchAllProfiles();
      const existing = allProfiles.find((p) => p.email.toLowerCase() === emailClean);
      if (existing) {
        setIsLoading(false);
        return {
          success: false,
          error: `Este e-mail (${emailClean}) já está cadastrado no sistema. Por favor, utilize a opção "Entrar" com suas credenciais.`
        };
      }

      // Enforce role permission: non-admins cannot assign 'admin' role
      let finalRole: UserRole = role;
      if (role === 'admin' && profile?.role !== 'admin') {
        finalRole = 'photographer';
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: finalRole
            }
          }
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const prof = await fetchUserProfile(data.user.id, data.user.email || email);
          setProfile(prof);
        }
        setIsLoading(false);
        return { success: true };
      } else {
        // Local simulation signup
        const newId = generateUUID();
        const mockUser: any = { id: newId, email: emailClean };
        const mockProfile: UserProfile = {
          id: mockUser.id,
          email: emailClean,
          full_name: fullName.trim(),
          role: finalRole,
          is_active: true,
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setProfile(mockProfile);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));

        const photoProfile: PhotographerProfile = {
          id: mockProfile.id,
          name: mockProfile.full_name || splitEmailName(mockProfile.email),
          email: mockProfile.email,
          studioName: 'Lumina Proofing Studio',
          phone: '',
          avatarUrl: mockProfile.avatar_url || '',
          defaultWatermarkText: 'PROVA • LUMINA STUDIO • PROVA',
          defaultExtraPrice: 30
        };
        savePhotographerProfile(photoProfile);
        savePhotographerSession({
          isAuthenticated: true,
          token: `token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          loginTime: new Date().toISOString(),
          rememberMe: true,
          profile: photoProfile
        });

        setIsLoading(false);
        return { success: true };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Erro durante o cadastro.' };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Você precisa estar autenticado para alterar sua senha.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve conter no mínimo 6 caracteres.' };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Local fallback simulation
      try {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user) {
            parsed.user.updated_at = new Date().toISOString();
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar senha local:', e);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao alterar a senha.' };
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      logoutPhotographer();
    } catch (e) {
      console.error('Erro ao encerrar sessão:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    try {
      if (isSupabaseConfigured && supabase && isValidUUID(user.id)) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.warn('Erro ao atualizar perfil no Supabase:', error.message);
        }
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...(data.full_name !== undefined && { full_name: data.full_name }),
              ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url })
            }
          : null
      );

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao atualizar perfil.' };
    }
  };

  const adminUpdateUser = async (
    targetUserId: string,
    data: { role?: UserRole; is_active?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Somente administradores possuem permissão para alterar funções de usuários.' };
    }

    const isSelf =
      targetUserId === profile.id ||
      (profile.email && targetUserId.toLowerCase() === profile.email.toLowerCase());

    if (isSelf && data.role && data.role !== 'admin') {
      return { success: false, error: 'Bloqueado: Você não pode remover seu próprio privilégio de Administrador.' };
    }

    if (isSelf && data.is_active === false) {
      return { success: false, error: 'Bloqueado: Você não pode suspender sua própria conta.' };
    }

    try {
      if (isSupabaseConfigured && supabase && isValidUUID(targetUserId)) {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId);

        if (error) {
          console.warn('[Supabase Profile Update Note]:', error.message);
        }
      }

      // Always update local profiles storage to persist status/role changes
      const existingLocal = getStoredProfiles();
      const allProfiles = await fetchAllProfiles();
      const targetUser = allProfiles.find(
        (p) => p.id === targetUserId || p.email.toLowerCase() === targetUserId.toLowerCase()
      );

      if (targetUser) {
        const updatedTarget: UserProfile = {
          ...targetUser,
          ...data,
          updated_at: new Date().toISOString()
        };
        const filtered = existingLocal.filter(
          (p) => p.id !== targetUserId && p.email.toLowerCase() !== targetUser.email.toLowerCase()
        );
        saveStoredProfiles([updatedTarget, ...filtered]);
      }

      if (isSelf) {
        setProfile((prev) => (prev ? { ...prev, ...data } : null));
      }

      return { success: true };
    } catch (e: any) {
      console.error('Erro ao modificar usuário:', e);
      return { success: false, error: e.message || 'Erro ao modificar usuário.' };
    }
  };

  const adminCreateUser = async (data: {
    email: string;
    password?: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Somente administradores possuem permissão para criar novos usuários e gerenciar funções.' };
    }

    const emailClean = data.email.trim().toLowerCase();
    const fullNameClean = data.fullName.trim();

    if (!emailClean || !fullNameClean) {
      return { success: false, error: 'E-mail e Nome Completo são obrigatórios.' };
    }

    // Validate email uniqueness
    const allProfiles = await fetchAllProfiles();
    const existingUser = allProfiles.find((p) => p.email.toLowerCase() === emailClean);
    if (existingUser) {
      return {
        success: false,
        error: `Não é possível cadastrar: O e-mail "${emailClean}" já pertence a um usuário cadastrado no sistema.`
      };
    }

    const newProfile: UserProfile = {
      id: generateUUID(),
      email: emailClean,
      full_name: fullNameClean,
      role: data.role || 'photographer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase && isValidUUID(newProfile.id)) {
      try {
        const { error } = await supabase.from('profiles').insert([{
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          role: newProfile.role,
          is_active: true,
          created_at: newProfile.created_at,
          updated_at: newProfile.updated_at
        }]);

        if (error) {
          console.warn('Supabase profile creation fallback note:', error.message);
        }
      } catch (e: any) {
        console.warn('Failed to insert user profile into Supabase:', e);
      }
    }

    // Save to local cache so it immediately reflects in UI
    const existing = getStoredProfiles();
    const filtered = existing.filter((p) => p.email.toLowerCase() !== emailClean);
    const updated = [newProfile, ...filtered];
    saveStoredProfiles(updated);

    return { success: true, user: newProfile };
  };

  const fetchAllProfiles = async (): Promise<UserProfile[]> => {
    let dbProfiles: UserProfile[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbProfiles = data as UserProfile[];
        }
      } catch (e) {
        console.error('Falha ao listar usuários no Supabase:', e);
      }
    }

    const localProfiles = getStoredProfiles();

    // Default mock profiles with valid standard UUIDs
    const defaultTeam: UserProfile[] = [
      profile || {
        id: '00000000-0000-4000-a000-000000000001',
        email: 'admin@lumina.com',
        full_name: 'Lucas Silveira (Admin)',
        role: 'admin',
        is_active: true,
        created_at: '2026-01-15T10:00:00Z'
      },
      {
        id: '00000000-0000-4000-a000-000000000005',
        email: 'contato@luminastudio.com',
        full_name: 'Lumina Studio Admin',
        role: 'admin',
        is_active: true,
        created_at: '2026-01-16T10:00:00Z'
      },
      {
        id: '00000000-0000-4000-a000-000000000002',
        email: 'editor.marcos@luminastudio.com',
        full_name: 'Marcos Oliveira',
        role: 'photographer',
        is_active: true,
        created_at: '2026-02-10T14:30:00Z'
      },
      {
        id: '00000000-0000-4000-a000-000000000003',
        email: 'beatriz.fotografia@luminastudio.com',
        full_name: 'Beatriz Santos',
        role: 'photographer',
        is_active: true,
        created_at: '2026-03-01T09:15:00Z'
      },
      {
        id: '00000000-0000-4000-a000-000000000004',
        email: 'assistente.clara@luminastudio.com',
        full_name: 'Clara Costa',
        role: 'user',
        is_active: false,
        created_at: '2026-04-12T16:00:00Z'
      }
    ];

    // Combine and remove duplicates by email
    const map = new Map<string, UserProfile>();

    defaultTeam.forEach((p) => map.set(p.email.toLowerCase(), p));
    localProfiles.forEach((p) => map.set(p.email.toLowerCase(), p));
    dbProfiles.forEach((p) => map.set(p.email.toLowerCase(), p));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  };

  const isAdmin = profile?.role === 'admin';
  const isPhotographer = profile?.role === 'photographer' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        isPhotographer,
        isSupabaseConnected: isSupabaseConfigured,
        signInWithPassword,
        signUp,
        signOut,
        updateProfile,
        changePassword,
        adminUpdateUser,
        adminCreateUser,
        fetchAllProfiles
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
