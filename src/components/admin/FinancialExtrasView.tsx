import React, { useState, useEffect } from 'react';
import { Gallery, FinancialTransaction, TransactionStatus, PaymentMethod } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input, Textarea, Select } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  FileSpreadsheet,
  Zap,
  Edit3,
  Trash2,
  PlusCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Phone,
  FileText,
  CreditCard,
  Hash
} from 'lucide-react';
import {
  getFinancialTransactions,
  getFinancialTransactionsAsync,
  addFinancialTransactionAsync,
  updateFinancialTransactionAsync,
  deleteFinancialTransactionAsync
} from '../../lib/financialStorage';

export interface FinancialExtrasViewProps {
  galleries: Gallery[];
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FinancialExtrasView: React.FC<FinancialExtrasViewProps> = ({
  galleries,
  onShowToast
}) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'pending' | 'canceled'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'client'>('date_desc');

  // Modals state
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null); // View Comprovante
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null); // Edit Modal
  const [deletingTx, setDeletingTx] = useState<FinancialTransaction | null>(null); // Delete Confirm Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Create Modal

  // Form State for Create/Edit
  const [formGalleryId, setFormGalleryId] = useState<string>('');
  const [formGalleryTitle, setFormGalleryTitle] = useState<string>('');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientPhone, setFormClientPhone] = useState<string>('');
  const [formExtraPhotos, setFormExtraPhotos] = useState<number>(0);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPixTxId, setFormPixTxId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<TransactionStatus>('pending');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('pix');
  const [formDate, setFormDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Load transactions synchronously then sync with Supabase async
  useEffect(() => {
    // 1. Initial render from local cache
    const initialLocal = getFinancialTransactions(galleries);
    setTransactions(initialLocal);

    // 2. Fetch from Supabase orders table + live galleries
    let isMounted = true;
    getFinancialTransactionsAsync(galleries).then((synced) => {
      if (isMounted && synced.length > 0) {
        setTransactions(synced);
      }
    }).catch((err) => {
      console.warn('[Financial CMS] Supabase async sync warning:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [galleries]);

  // Open Edit Modal
  const handleOpenEdit = (tx: FinancialTransaction) => {
    setEditingTx(tx);
    setFormGalleryId(tx.galleryId || '');
    setFormGalleryTitle(tx.galleryTitle || '');
    setFormClientName(tx.clientName || '');
    setFormClientPhone(tx.clientPhone || '');
    setFormExtraPhotos(tx.extraPhotosCount || 0);
    setFormAmount(tx.amount || 0);
    setFormPixTxId(tx.pixTxId || '');
    setFormStatus(tx.status || 'pending');
    setFormPaymentMethod(tx.paymentMethod || 'pix');
    setFormDate(tx.date || new Date().toLocaleDateString('pt-BR'));
    setFormNotes(tx.notes || '');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTx(null);
    setFormGalleryId(galleries[0]?.id || '');
    setFormGalleryTitle(galleries[0]?.title || '');
    setFormClientName(galleries[0]?.clientName || '');
    setFormClientPhone(galleries[0]?.clientPhone || '');
    setFormExtraPhotos(5);
    setFormAmount(150);
    setFormPixTxId(`E000${Math.floor(100000 + Math.random() * 900000)}${Date.now().toString().slice(-8)}`);
    setFormStatus('pending');
    setFormPaymentMethod('pix');
    setFormDate(new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setFormNotes('Cobrança manual de fotos adicionais ou serviços extras.');
    setIsCreateModalOpen(true);
  };

  // Handle Gallery Selection in Form
  const handleSelectGalleryInForm = (gId: string) => {
    setFormGalleryId(gId);
    const selected = galleries.find((g) => g.id === gId);
    if (selected) {
      setFormGalleryTitle(selected.title);
      setFormClientName(selected.clientName);
      if (selected.clientPhone) setFormClientPhone(selected.clientPhone);
    }
  };

  // Save Transaction (Create or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formClientName.trim() || !formGalleryTitle.trim()) {
      onShowToast('Campos Obrigatórios', 'Por favor preencha o nome do cliente e o título da galeria.', 'warning');
      return;
    }

    if (editingTx) {
      // EDIT EXISTING TRANSACTION
      const updatedObj: FinancialTransaction = {
        ...editingTx,
        galleryId: formGalleryId || undefined,
        galleryTitle: formGalleryTitle.trim(),
        clientName: formClientName.trim(),
        clientPhone: formClientPhone.trim(),
        extraPhotosCount: Number(formExtraPhotos) || 0,
        amount: Number(formAmount) || 0,
        pixTxId: formPixTxId.trim() || `E000${Date.now()}`,
        status: formStatus,
        paymentMethod: formPaymentMethod,
        date: formDate.trim() || new Date().toLocaleDateString('pt-BR'),
        notes: formNotes.trim()
      };

      const newList = await updateFinancialTransactionAsync(updatedObj, transactions);
      setTransactions(newList);
      setEditingTx(null);
      onShowToast('Transação Atualizada!', `Cobrança de ${updatedObj.clientName} foi alterada e salva com sucesso.`, 'success');
    } else {
      // CREATE NEW TRANSACTION
      const newTxData = {
        galleryId: formGalleryId || undefined,
        galleryTitle: formGalleryTitle.trim(),
        clientName: formClientName.trim(),
        clientPhone: formClientPhone.trim(),
        extraPhotosCount: Number(formExtraPhotos) || 0,
        amount: Number(formAmount) || 0,
        pixTxId: formPixTxId.trim() || `E000${Date.now()}`,
        status: formStatus,
        paymentMethod: formPaymentMethod,
        date: formDate.trim() || new Date().toLocaleDateString('pt-BR'),
        notes: formNotes.trim()
      };

      const newList = await addFinancialTransactionAsync(newTxData, transactions);
      setTransactions(newList);
      setIsCreateModalOpen(false);
      onShowToast('Transação Criada!', `Nova cobrança cadastrada para ${newTxData.clientName}.`, 'success');
    }
  };

  // Delete Transaction
  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    const nextList = await deleteFinancialTransactionAsync(deletingTx.id, transactions);
    setTransactions(nextList);
    onShowToast('Transação Excluída', `Cobrança de ${deletingTx.clientName} (TxID: ${deletingTx.pixTxId}) foi removida.`, 'info');
    setDeletingTx(null);
  };

  // Quick Baixar PIX (Simular ou Confirmar Pagamento)
  const handleSimulatePayment = async (tx: FinancialTransaction) => {
    const updatedObj: FinancialTransaction = {
      ...tx,
      status: 'settled',
      notes: (tx.notes ? tx.notes + ' | ' : '') + 'Baixa realizada manualmente pelo fotógrafo.'
    };
    const nextList = await updateFinancialTransactionAsync(updatedObj, transactions);
    setTransactions(nextList);
    onShowToast(
      'Baixa PIX Efetuada!',
      `Pagamento de R$ ${tx.amount.toFixed(2)} (${tx.clientName}) marcado como pago.`,
      'success'
    );
  };

  // Compute Totals & Summary Metrics
  const totalSettled = transactions
    .filter((t) => t.status === 'settled')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPending = transactions
    .filter((t) => t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExtrasSold = transactions
    .filter((t) => t.status === 'settled')
    .reduce((acc, t) => acc + t.extraPhotosCount, 0);

  const avgPerExtra = totalExtrasSold > 0 ? totalSettled / totalExtrasSold : 30;

  // Filter and Sort Transactions
  const filteredTransactions = transactions
    .filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.clientName.toLowerCase().includes(q) ||
        t.galleryTitle.toLowerCase().includes(q) ||
        t.pixTxId.toLowerCase().includes(q) ||
        (t.clientPhone && t.clientPhone.includes(q));
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'client') return a.clientName.localeCompare(b.clientName);
      if (sortBy === 'date_asc') return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id); // Default date_desc
    });

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'ID Transação,Cliente,Telefone,Ensaio,Qtd Fotos Extras,Valor R$,Status,Forma de Pagamento,Data,Notas\n';
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.pixTxId}","${t.clientName}","${t.clientPhone || ''}","${t.galleryTitle}",${t.extraPhotosCount},${t.amount},"${t.status}","${t.paymentMethod || 'pix'}","${t.date}","${(t.notes || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    // UTF-8 BOM for Microsoft Excel Portuguese compatibility
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_cms_financeiro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Relatório CSV Exportado!', 'Planilha financeira gerada com sucesso.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FDBD00] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#FDBD00]">
              CMS FINANCEIRO & GESTÃO DE COBRANÇAS PIX
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Faturamento & CMS Financeiro
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Gerencie, edite e acompanhe todas as cobranças da plataforma: vendas de fotos extras, taxas de fechamento de galeria e pagamentos PIX com sincronização em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs bg-[#120E22] border-white/10 text-zinc-200 hover:text-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Exportar (CSV)</span>
          </Button>

          <Button
            variant="amber"
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs font-bold shadow-lg shadow-[#FDBD00]/10"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Nova Cobrança PIX</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#120E22] border border-[#FDBD00]/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>FATURAMENTO CONFIRMADO</span>
            <DollarSign className="w-4 h-4 text-[#FDBD00]" />
          </div>
          <div className="text-2xl font-extrabold text-[#FDBD00] font-sans">
            R$ {totalSettled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-mono">Recebido no PIX</span>
            <span className="text-zinc-500 font-mono">{transactions.filter(t => t.status === 'settled').length} transações</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>PIX PENDENTES</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-sans">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-mono">Aguardando Baixa</span>
            <span className="text-zinc-500 font-mono">{transactions.filter(t => t.status === 'pending').length} pendentes</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>FOTOS EXTRAS VENDIDAS</span>
            <TrendingUp className="w-4 h-4 text-[#46BDC6]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-sans">
            {totalExtrasSold} <span className="text-xs text-zinc-400 font-normal">fotos</span>
          </div>
          <span className="text-[11px] text-[#46BDC6] font-mono block">
            Média de R$ {avgPerExtra.toFixed(2)} / foto extra
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>GATEWAY PIX</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-sans flex items-center gap-1.5">
            <span>Ativo</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            Sincronização & CMS em Tempo Real
          </span>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTERS */}
      <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, ensaio, telefone ou TxID PIX..."
            className="w-full py-2 px-3 pl-10 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#0A0714] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#FDBD00] text-[#160F29]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter('settled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'settled'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Confirmadas ({transactions.filter(t => t.status === 'settled').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              Pendentes ({transactions.filter(t => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('canceled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'canceled'
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-red-400'
              }`}
            >
              Canceladas
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#FDBD00]"
          >
            <option value="date_desc">Mais Recentes</option>
            <option value="date_asc">Mais Antigos</option>
            <option value="amount_desc">Maior Valor (R$)</option>
            <option value="amount_asc">Menor Valor (R$)</option>
            <option value="client">Nome do Cliente</option>
          </select>
        </div>
      </div>

      {/* 4. TRANSACTIONS CMS TABLE */}
      <Card className="bg-[#120E22] border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0714] text-zinc-400 uppercase tracking-wider font-mono border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Cliente / Ensaio</th>
                <th className="py-3.5 px-4">Qtd Extras</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Identificador PIX (TxID)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações CMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                    <p className="text-sm">Nenhuma transação encontrada com os filtros selecionados.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                      className="text-[#FDBD00] underline text-xs mt-2 inline-block font-sans"
                    >
                      Limpar filtros de busca
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{tx.clientName}</span>
                        {tx.clientPhone && (
                          <span className="text-[10px] text-zinc-400 font-mono font-normal">
                            ({tx.clientPhone})
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-400 text-xs">{tx.galleryTitle}</div>
                      <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{tx.date}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      +{tx.extraPhotosCount} fotos
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#FDBD00] text-sm">
                      R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 max-w-[180px]">
                      <div className="truncate" title={tx.pixTxId}>
                        {tx.pixTxId}
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        {tx.paymentMethod ? tx.paymentMethod.toUpperCase() : 'PIX'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {tx.status === 'settled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Pago via PIX</span>
                        </span>
                      ) : tx.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Aguardando PIX</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>Cancelado</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Baixar PIX Quick Action */}
                        {tx.status === 'pending' && (
                          <Button
                            variant="amber"
                            size="sm"
                            onClick={() => handleSimulatePayment(tx)}
                            title="Dar baixa no pagamento PIX"
                            className="text-[10px] py-1 px-2 font-bold"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            <span>Baixar</span>
                          </Button>
                        )}

                        {/* View Receipt */}
                        <button
                          onClick={() => setSelectedTx(tx)}
                          title="Ver Comprovante"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#46BDC6]" />
                        </button>

                        {/* EDIT TRANSACTION */}
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          title="Editar Transação (CMS)"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* DELETE TRANSACTION */}
                        <button
                          onClick={() => setDeletingTx(tx)}
                          title="Excluir Transação"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. EDIT & CREATE TRANSACTION MODAL */}
      {(isCreateModalOpen || editingTx) && (
        <Dialog
          isOpen={isCreateModalOpen || !!editingTx}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTx(null);
          }}
          title={
            <div className="flex items-center gap-2 text-[#FDBD00]">
              {editingTx ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
              <span>{editingTx ? `Editar Transação PIX (${editingTx.pixTxId})` : 'Nova Cobrança PIX / Transação'}</span>
            </div>
          }
          description="Ajuste os dados financeiros, valor, cliente e status da transação."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select Gallery */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Galeria / Ensaio Relacionado:
                </label>
                <select
                  value={formGalleryId}
                  onChange={(e) => handleSelectGalleryInForm(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
                >
                  <option value="">-- Cobrança Avulsa / Personalizada --</option>
                  {galleries.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} - {g.clientName} (R$ {g.extraPhotoPrice || 25}/foto)
                    </option>
                  ))}
                </select>
              </div>

              {/* Gallery Title */}
              <Input
                label="Título do Ensaio / Projeto"
                value={formGalleryTitle}
                onChange={(e) => setFormGalleryTitle(e.target.value)}
                placeholder="ex: Casamento Marina & Guilherme"
                required
              />

              {/* Client Name */}
              <Input
                label="Nome do Cliente"
                value={formClientName}
                onChange={(e) => setFormClientName(e.target.value)}
                placeholder="ex: Marina Silva"
                required
              />

              {/* Client Phone */}
              <Input
                label="Telefone / WhatsApp do Cliente"
                value={formClientPhone}
                onChange={(e) => setFormClientPhone(e.target.value)}
                placeholder="ex: (11) 98765-4321"
              />

              {/* Extra Photos Count */}
              <Input
                label="Qtd. de Fotos Extras"
                type="number"
                min={0}
                value={formExtraPhotos}
                onChange={(e) => setFormExtraPhotos(Number(e.target.value))}
              />

              {/* Total Amount R$ */}
              <Input
                label="Valor Total (R$)"
                type="number"
                step="0.01"
                min={0}
                value={formAmount}
                onChange={(e) => setFormAmount(Number(e.target.value))}
                required
              />

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Status da Transação:
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TransactionStatus)}
                  className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
                >
                  <option value="settled">Confirmada / Pago via PIX</option>
                  <option value="pending">Pendente / Aguardando PIX</option>
                  <option value="canceled">Cancelada / Rejeitada</option>
                  <option value="failed">Falha na Operação</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Método de Pagamento:
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
                >
                  <option value="pix">PIX Dinâmico QR Code</option>
                  <option value="manual">Baixa Manual / Dinheiro</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="bank_transfer">Transferência Bancária (TED)</option>
                </select>
              </div>

              {/* Identificador PIX TxID */}
              <Input
                label="Identificador PIX (TxID Banco Central)"
                value={formPixTxId}
                onChange={(e) => setFormPixTxId(e.target.value)}
                placeholder="ex: E0003816620250917..."
                required
              />

              {/* Date */}
              <Input
                label="Data & Hora do Registro"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                placeholder="ex: 17/09/2025 às 14:12"
              />
            </div>

            {/* Notes */}
            <Textarea
              label="Observações / Notas Financeiras"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="ex: Desconto concedido no pacote de fotos extras..."
              rows={2}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTx(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="amber" size="sm" className="font-bold">
                {editingTx ? 'Salvar Alterações' : 'Criar Transação'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingTx && (
        <Dialog
          isOpen={!!deletingTx}
          onClose={() => setDeletingTx(null)}
          title={
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Excluir Transação PIX</span>
            </div>
          }
          description="Esta ação removerá o registro financeiro permanentemente."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-sans text-zinc-300">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
              <div className="font-bold text-white text-sm">
                Tem certeza que deseja excluir esta transação?
              </div>
              <p className="text-zinc-400 leading-snug">
                Você está prestes a remover o registro financeiro de <strong>{deletingTx.clientName}</strong>.
              </p>

              <div className="pt-2 font-mono text-[11px] space-y-1 text-zinc-300">
                <div>Ensaio: <span className="text-white">{deletingTx.galleryTitle}</span></div>
                <div>Valor: <span className="text-[#FDBD00]">R$ {deletingTx.amount.toFixed(2)}</span></div>
                <div>TxID: <span className="text-zinc-400">{deletingTx.pixTxId}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingTx(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                className="font-bold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Sim, Excluir Transação</span>
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* 7. COMPROVANTE RECEIPT MODAL */}
      {selectedTx && (
        <Dialog
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={
            <div className="flex items-center gap-2 text-emerald-400">
              <Receipt className="w-5 h-5" />
              <span>Comprovante de Recebimento PIX</span>
            </div>
          }
          description="Detalhamento financeiro da transação efetuada."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-mono text-zinc-300">
            <div className="p-4 rounded-xl bg-[#0A0714] border border-white/10 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Cliente:</span>
                <strong className="text-white">{selectedTx.clientName}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Contato:</span>
                <span className="text-zinc-400">{selectedTx.clientPhone || 'Não informado'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Ensaio:</span>
                <strong className="text-white">{selectedTx.galleryTitle}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Fotos Extras Adicionadas:</span>
                <strong className="text-purple-300">+{selectedTx.extraPhotosCount} fotos</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Valor Total Pago:</span>
                <strong className="text-[#FDBD00] text-sm">
                  R$ {selectedTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Forma de Pagamento:</span>
                <span className="text-emerald-400 font-bold uppercase">{selectedTx.paymentMethod || 'PIX'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Data & Hora:</span>
                <span className="text-zinc-400">{selectedTx.date}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>TxID Banco Central:</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[200px]" title={selectedTx.pixTxId}>
                  {selectedTx.pixTxId}
                </span>
              </div>
              {selectedTx.notes && (
                <div className="pt-2 text-[11px] text-zinc-400 border-t border-white/5">
                  <strong>Observações:</strong> {selectedTx.notes}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTx(null);
                  handleOpenEdit(selectedTx);
                }}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                <span>Editar no CMS</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onShowToast('Comprovante Impresso', 'Gerando arquivo PDF do recibo...', 'info');
                  window.print();
                }}
                className="text-xs bg-[#0A0714] border-white/10 text-white"
              >
                Imprimir Recibo PDF
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
