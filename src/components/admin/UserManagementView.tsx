import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, UserRole } from '../../types';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';
import { validatePassword } from '../../lib/passwordValidation';
import { PasswordStrengthIndicator } from '../common/PasswordStrengthIndicator';
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
  AlertTriangle,
  UserPlus,
  X,
  Mail,
  Phone,
  Send,
  KeyRound,
  ShieldAlert,
  Info
} from 'lucide-react';

export interface UserManagementViewProps {
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onShowToast }) => {
  const { profile: currentUserProfile, adminUpdateUser, adminCreateUser, fetchAllProfiles } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Create User Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'invite' | 'manual'>('invite');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'photographer' as UserRole
  });

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
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      onShowToast(
        'Acesso Negado',
        'Somente Administradores possuem permissão para alterar funções.',
        'warning'
      );
      return;
    }

    const isSelf =
      targetUser.id === currentUserProfile?.id ||
      (currentUserProfile?.email && targetUser.email.toLowerCase() === currentUserProfile.email.toLowerCase());

    if (isSelf && newRole !== 'admin') {
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
    const isSelf =
      targetUser.id === currentUserProfile?.id ||
      (currentUserProfile?.email && targetUser.email.toLowerCase() === currentUserProfile.email.toLowerCase());

    if (isSelf) {
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

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = newUserData.fullName.trim();
    const email = newUserData.email.trim().toLowerCase();
    const phone = newUserData.phone.trim();
    const password = newUserData.password.trim();

    if (!fullName) {
      onShowToast('Campo Obrigatório', 'Por favor, informe o Nome Completo do usuário.', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      onShowToast('E-mail Inválido', 'Por favor, informe um endereço de e-mail com formato válido.', 'warning');
      return;
    }

    if (creationMode === 'manual') {
      if (!password) {
        onShowToast('Senha Obrigatória', 'No modo de definição manual, a senha é estritamente obrigatória.', 'warning');
        return;
      }
      const validation = validatePassword(password);
      if (!validation.isValid) {
        onShowToast('Senha Insegura', validation.errors[0] || 'A senha não atende aos requisitos mínimos de segurança.', 'warning');
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      fullName,
      email,
      role: newUserData.role,
      phone: phone || undefined,
      sendInvite: creationMode === 'invite',
      password: creationMode === 'manual' ? password : undefined,
      mustChangePassword: true
    };

    const res = await adminCreateUser(payload);
    setIsSubmitting(false);

    if (res.success) {
      onShowToast(
        creationMode === 'invite' ? 'Convite de Ativação Enviado!' : 'Usuário Criado com Sucesso!',
        creationMode === 'invite'
          ? `Um e-mail de convite com token temporário foi enviado para "${email}".`
          : `O membro "${fullName}" foi cadastrado com sucesso. A redefinição de senha será exigida no primeiro login.`,
        'success'
      );
      setNewUserData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'photographer'
      });
      setCreationMode('invite');
      setIsCreateModalOpen(false);
      loadUsers();
    } else {
      onShowToast('Erro ao Criar Usuário', res.error || 'Falha ao cadastrar usuário.', 'error');
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
            Controle de acesso por funções (RBAC), criação de novos membros da equipe e suspensão de contas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button variant="outline" size="sm" onClick={loadUsers} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar Lista</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs bg-gradient-to-r from-[#8300E9] to-[#7000C8] hover:brightness-110 text-white font-bold shadow-lg shadow-[#8300E9]/30"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Criar Novo Usuário</span>
          </Button>
        </div>
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
                  const isSelf =
                    userItem.id === currentUserProfile?.id ||
                    (currentUserProfile?.email && userItem.email.toLowerCase() === currentUserProfile.email.toLowerCase());

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
                            disabled={isSelf || currentUserProfile?.role !== 'admin'}
                            title={
                              isSelf
                                ? 'Você não pode alterar sua própria função de admin'
                                : currentUserProfile?.role !== 'admin'
                                ? 'Somente Administradores podem alterar funções'
                                : 'Alterar privilégios'
                            }
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

      {/* Modal: Criar Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#120E22] border border-white/10 shadow-2xl overflow-hidden p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#8300E9]/20 text-[#8300E9] border border-[#8300E9]/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Cadastrar Membro na Equipe</h3>
                  <p className="text-xs text-zinc-400">Adicione dados de acesso e escolha o método de criação seguro.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creation Mode Selector (Abordagem A vs Abordagem B) */}
            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-medium">Método de Criação de Conta</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreationMode('invite')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    creationMode === 'invite'
                      ? 'bg-[#8300E9]/20 border-[#8300E9] text-white ring-1 ring-[#8300E9]'
                      : 'bg-[#0A0714] border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Send className="w-4 h-4 text-purple-400" />
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      Recomendado
                    </span>
                  </div>
                  <span className="font-bold text-xs">Convite por E-mail</span>
                  <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Usuário define sua própria senha no 1º acesso
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMode('manual')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    creationMode === 'manual'
                      ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-[#0A0714] border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                      Senha Manual
                    </span>
                  </div>
                  <span className="font-bold text-xs">Senha com Redefinição</span>
                  <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Redefinição forçada no 1º login (mustChangePassword)
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Nome Completo <span className="text-amber-400">*</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Clara Ribeiro"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  leftIcon={<User className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  E-mail de Acesso <span className="text-amber-400">*</span>
                </label>
                <Input
                  required
                  type="email"
                  placeholder="exemplo@estudio.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">WhatsApp / Telefone</label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              {/* Dynamic Password / Invite Notice Field */}
              {creationMode === 'invite' ? (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3 text-purple-200">
                  <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="block text-white font-medium mb-0.5">Fluxo de Ativação Seguro</strong>
                    Um e-mail com token temporário e link de ativação será enviado. O próprio usuário definirá sua senha no primeiro acesso.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <label className="block text-zinc-200 font-medium">
                      Senha Inicial Estrita <span className="text-amber-400">*</span>
                    </label>
                    <span className="text-[10px] text-amber-300 font-mono">Requer troca no 1º login</span>
                  </div>
                  <Input
                    required
                    type="password"
                    placeholder="Digite uma senha forte e única"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  />
                  {newUserData.password && (
                    <PasswordStrengthIndicator password={newUserData.password} showChecklist={true} />
                  )}
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Nível de Acesso (Função) <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewUserData({ ...newUserData, role: 'photographer' })}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      newUserData.role === 'photographer'
                        ? 'bg-[#8300E9]/20 border-[#8300E9] text-white ring-1 ring-[#8300E9]'
                        : 'bg-[#0A0714] border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="font-bold">Fotógrafo</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Cria e edita galerias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUserData({ ...newUserData, role: 'admin' })}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      newUserData.role === 'admin'
                        ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-[#0A0714] border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="font-bold">Admin</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Acesso total ao estúdio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUserData({ ...newUserData, role: 'user' })}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      newUserData.role === 'user'
                        ? 'bg-blue-500/20 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-[#0A0714] border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="font-bold">Assistente</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Apenas visualização</span>
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-white/10 text-zinc-300 hover:bg-white/5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#8300E9] to-[#7000C8] font-bold text-white shadow-lg shadow-[#8300E9]/30"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando...
                    </span>
                  ) : creationMode === 'invite' ? (
                    'Enviar Convite por E-mail'
                  ) : (
                    'Confirmar e Cadastrar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
