import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

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
  adminUpdateUser: (userId: string, data: { role?: UserRole; is_active?: boolean }) => Promise<{ success: boolean; error?: string }>;
  fetchAllProfiles: () => Promise<UserProfile[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'izylumna_fallback_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch profile from public.profiles table
  const fetchUserProfile = async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Erro ao buscar perfil no Supabase:', error.message);
        // Fallback profile if record not found yet
        return {
          id: userId,
          email: userEmail,
          full_name: splitEmailName(userEmail),
          role: 'admin', // default to admin for fallback
          is_active: true,
          created_at: new Date().toISOString()
        };
      }

      return data as UserProfile;
    } catch (e) {
      console.error('Falha ao obter perfil do usuário:', e);
      return null;
    }
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
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const prof = await fetchUserProfile(data.user.id, data.user.email || email);
          if (prof && !prof.is_active) {
            await supabase.auth.signOut();
            setIsLoading(false);
            return {
              success: false,
              error: 'A sua conta foi suspensa/desativada por um administrador. Entre em contato com o suporte.'
            };
          }
          setProfile(prof);
        }
        setIsLoading(false);
        return { success: true };
      } else {
        // Local simulation login
        const mockUser: any = { id: 'mock-user-1', email: email.trim() };
        const mockProfile: UserProfile = {
          id: 'mock-user-1',
          email: email.trim(),
          full_name: splitEmailName(email),
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setProfile(mockProfile);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
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
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role
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
        const mockUser: any = { id: `mock-user-${Date.now()}`, email: email.trim() };
        const mockProfile: UserProfile = {
          id: mockUser.id,
          email: email.trim(),
          full_name: fullName.trim(),
          role: role || 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setProfile(mockProfile);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
        setIsLoading(false);
        return { success: true };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Erro durante o cadastro.' };
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
    } catch (e) {
      console.error('Erro ao encerrar sessão:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          return { success: false, error: error.message };
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
      return { success: false, error: 'Apenas Administradores podem alterar privilégios.' };
    }

    if (targetUserId === profile.id && data.role && data.role !== 'admin') {
      return { success: false, error: 'Bloqueado: Você não pode remover seu próprio privilégio de Administrador.' };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      if (targetUserId === profile.id) {
        setProfile((prev) => (prev ? { ...prev, ...data } : null));
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao modificar usuário.' };
    }
  };

  const fetchAllProfiles = async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar lista de perfis:', error);
          return [];
        }
        return (data as UserProfile[]) || [];
      } catch (e) {
        console.error('Falha ao listar usuários:', e);
        return [];
      }
    }

    // Fallback list when offline or unconfigured
    return profile ? [profile] : [];
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
        adminUpdateUser,
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
