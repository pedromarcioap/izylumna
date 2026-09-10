import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, UserRole } from '../../types';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  Users,
  Search,
  ShieldCheck,
  Camera,
  User,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

export interface UserManagementViewProps {
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onShowToast }) => {
  const { profile: currentUserProfile, adminUpdateUser, fetchAllProfiles } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const loadUsers = async () => {
    setIsLoading(true);
    const list = await fetchAllProfiles();
    setUsers(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const queryLower = searchQuery.toLowerCase();
    const nameMatch = u.full_name ? u.full_name.toLowerCase().includes(queryLower) : false;
    const emailMatch = u.email.toLowerCase().includes(queryLower);
    const matchesSearch = nameMatch || emailMatch;

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'suspended' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.id === currentUserProfile?.id && newRole !== 'admin') {
      onShowToast(
        'Ação Bloqueada',
        'Você não pode remover seu próprio privilégio de Administrador para evitar bloqueio acidental.',
        'warning'
      );
      return;
    }

    const res = await adminUpdateUser(targetUser.id, { role: newRole });
    if (res.success) {
      onShowToast(
        'Função Atualizada',
        `A função de ${targetUser.email} foi alterada para "${newRole}".`,
        'success'
      );
      loadUsers();
    } else {
      onShowToast('Erro ao Atualizar', res.error || 'Falha ao alterar função.', 'error');
    }
  };

  const handleToggleStatus = async (targetUser: UserProfile) => {
    if (targetUser.id === currentUserProfile?.id) {
      onShowToast(
        'Ação Bloqueada',
        'Você não pode suspender sua própria conta de Administrador.',
        'warning'
      );
      return;
    }

    const nextStatus = !targetUser.is_active;
    const res = await adminUpdateUser(targetUser.id, { is_active: nextStatus });

    if (res.success) {
      onShowToast(
        nextStatus ? 'Acesso Ativado' : 'Acesso Suspenso',
        `O status da conta de ${targetUser.email} foi alterado para ${nextStatus ? 'Ativo' : 'Suspenso'}.`,
        nextStatus ? 'success' : 'info'
      );
      loadUsers();
    } else {
      onShowToast('Erro ao Atualizar Status', res.error || 'Falha ao modificar conta.', 'error');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </span>
        );
      case 'photographer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold">
            <Camera className="w-3.5 h-3.5" />
            <span>Fotógrafo</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono font-medium">
            <User className="w-3.5 h-3.5" />
            <span>Usuário</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
              Gestão de Usuários & Administradores
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Controle de acesso por funções (RBAC), alteração de privilégios e suspensão de contas no Supabase.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers} className="text-xs self-start md:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Lista</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas as Funções</option>
            <option value="admin">Administradores</option>
            <option value="photographer">Fotógrafos</option>
            <option value="user">Usuários Comuns</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="suspended">Apenas Suspensos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/90 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Usuário / E-mail</th>
                <th className="py-3.5 px-4">Função (Role)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Data de Cadastro</th>
                <th className="py-3.5 px-4 text-right">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <span>Carregando perfis do Supabase...</span>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    <span>Nenhum usuário encontrado com os filtros selecionados.</span>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((userItem) => {
                  const isSelf = userItem.id === currentUserProfile?.id;

                  return (
                    <tr key={userItem.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {userItem.avatar_url ? (
                            <img
                              src={sanitizeImageUrl(userItem.avatar_url)}
                              alt={userItem.full_name || userItem.email}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = PLACEHOLDER_IMAGE;
                              }}
                              className="w-8 h-8 rounded-full object-cover border border-amber-500/30"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                              {(userItem.full_name || userItem.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                              <span>{userItem.full_name || 'Sem nome'}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400">{userItem.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(userItem.role)}

                          {/* Role Selector dropdown */}
                          <select
                            value={userItem.role}
                            onChange={(e) => handleRoleChange(userItem, e.target.value as UserRole)}
                            disabled={isSelf}
                            title={isSelf ? 'Você não pode alterar sua própria função de admin' : 'Alterar privilégios'}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="admin">Promover a Admin</option>
                            <option value="photographer">Fotógrafo</option>
                            <option value="user">Usuário Comum</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {userItem.is_active ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ativo</span>
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" className="gap-1 bg-red-500/10 text-red-400 border-red-500/20">
                            <XCircle className="w-3 h-3" />
                            <span>Suspenso</span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                        {userItem.created_at
                          ? new Date(userItem.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : 'Indisponível'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {userItem.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => handleToggleStatus(userItem)}
                              className="text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                              title={isSelf ? 'Você não pode suspender a si mesmo' : 'Suspender acesso'}
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              <span>Suspender</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(userItem)}
                              className="text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              <span>Ativar</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Exibindo <strong className="text-zinc-200">{paginatedUsers.length}</strong> de{' '}
            <strong className="text-zinc-200">{filteredUsers.length}</strong> usuários cadastrados
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="text-xs p-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-zinc-300">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="text-xs p-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
